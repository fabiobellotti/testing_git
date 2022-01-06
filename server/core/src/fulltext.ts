//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import core, {
  AttachedDoc, Class, ClassifierKind, Doc, Obj, Ref, TxCreateDoc, TxResult, TxUpdateDoc,
  AnyAttribute,
  Collection,
  DocumentQuery,
  FindOptions,
  FindResult,
  Hierarchy,
  MeasureContext,
  PropertyType,
  Tx,
  TxBulkWrite,
  TxCollectionCUD,
  TxMixin,
  TxProcessor,
  TxPutBag,
  TxRemoveDoc
} from '@anticrm/core'
import type { FullTextAdapter, IndexedDoc, WithFind } from './types'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const NO_INDEX = [] as AnyAttribute[]

/**
 * @public
 */
export class FullTextIndex implements WithFind {
  private readonly indexes = new Map<Ref<Class<Obj>>, AnyAttribute[]>()

  constructor (
    private readonly hierarchy: Hierarchy,
    private readonly adapter: FullTextAdapter,
    private readonly dbStorage: WithFind
  ) {}

  protected async txPutBag (ctx: MeasureContext, tx: TxPutBag<any>): Promise<TxResult> {
    // console.log('FullTextIndex.txPutBag: Method not implemented.')
    return {}
  }

  protected async txRemoveDoc (ctx: MeasureContext, tx: TxRemoveDoc<Doc>): Promise<TxResult> {
    // console.log('FullTextIndex.txRemoveDoc: Method not implemented.')
    await this.adapter.remove(tx.objectId)
    return {}
  }

  protected async txMixin (ctx: MeasureContext, tx: TxMixin<Doc, Doc>): Promise<TxResult> {
    const attributes = this.getFullTextAttributes(tx.mixin)
    let result = {}
    if (attributes === undefined) return result
    const ops: any = tx.attributes
    const update: any = {}
    let shouldUpdate = false
    for (const attr of attributes) {
      if (ops[attr.name] !== undefined) {
        update[(tx.mixin as string) + '.' + attr.name] = ops[attr.name]
        shouldUpdate = true
      }
    }
    if (shouldUpdate) {
      result = await this.adapter.update(tx.objectId, update)
      await this.updateAttachedDocs(ctx, tx, update)
    }
    return result
  }

  async tx (ctx: MeasureContext, tx: Tx): Promise<TxResult> {
    switch (tx._class) {
      case core.class.TxCreateDoc:
        return await this.txCreateDoc(ctx, tx as TxCreateDoc<Doc>)
      case core.class.TxCollectionCUD:
        return await this.txCollectionCUD(ctx, tx as TxCollectionCUD<Doc, AttachedDoc>)
      case core.class.TxUpdateDoc:
        return await this.txUpdateDoc(ctx, tx as TxUpdateDoc<Doc>)
      case core.class.TxRemoveDoc:
        return await this.txRemoveDoc(ctx, tx as TxRemoveDoc<Doc>)
      case core.class.TxMixin:
        return await this.txMixin(ctx, tx as TxMixin<Doc, Doc>)
      case core.class.TxPutBag:
        return await this.txPutBag(ctx, tx as TxPutBag<PropertyType>)
      case core.class.TxBulkWrite:
        return await this.txBulkWrite(ctx, tx as TxBulkWrite)
    }
    throw new Error('TxProcessor: unhandled transaction class: ' + tx._class)
  }

  protected txCollectionCUD (ctx: MeasureContext, tx: TxCollectionCUD<Doc, AttachedDoc>): Promise<TxResult> {
    // We need update only create transactions to contain attached, attachedToClass.
    if (tx.tx._class === core.class.TxCreateDoc) {
      const createTx = tx.tx as TxCreateDoc<AttachedDoc>
      const d: TxCreateDoc<AttachedDoc> = {
        ...createTx,
        attributes: {
          ...createTx.attributes,
          attachedTo: tx.objectId,
          attachedToClass: tx.objectClass,
          collection: tx.collection
        }
      }
      return this.txCreateDoc(ctx, d)
    }
    return this.tx(ctx, tx.tx)
  }

  protected async txBulkWrite (ctx: MeasureContext, bulkTx: TxBulkWrite): Promise<TxResult> {
    for (const tx of bulkTx.txes) {
      await this.tx(ctx, tx)
    }
    return {}
  }

  async findAll<T extends Doc>(
    ctx: MeasureContext,
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    console.log('search', query)
    const { _id, $search, ...mainQuery } = query
    if ($search === undefined) return []
    const docs = await this.adapter.search(_class, query, options?.limit)
    const ids: Set<Ref<Doc>> = new Set<Ref<Doc>>(docs.map(p => p.id))
    for (const doc of docs) {
      if (doc.attachedTo !== undefined) {
        ids.add(doc.attachedTo)
      }
    }
    return await this.dbStorage.findAll(ctx, _class, { _id: { $in: Array.from(ids) as any }, ...mainQuery }, options) // TODO: remove `as any`
  }

  private getFullTextAttributes (clazz: Ref<Class<Obj>>): AnyAttribute[] | undefined {
    const attributes = this.indexes.get(clazz)
    if (attributes === undefined) {
      const allAttributes = this.hierarchy.getAllAttributes(clazz)
      const result: AnyAttribute[] = []
      for (const [, attr] of allAttributes) {
        if (attr.type._class === core.class.TypeString) {
          result.push(attr)
        }
      }
      if (result.length > 0) {
        this.indexes.set(clazz, result)
        return result
      } else {
        this.indexes.set(clazz, NO_INDEX)
      }
    } else if (attributes !== NO_INDEX) {
      return attributes
    }
  }

  protected async txCreateDoc (ctx: MeasureContext, tx: TxCreateDoc<Doc>): Promise<TxResult> {
    const attributes = this.getFullTextAttributes(tx.objectClass)
    const doc = TxProcessor.createDoc2Doc(tx)
    let parentContent: Record<string, string> = {}
    if (this.hierarchy.isDerived(doc._class, core.class.AttachedDoc)) {
      const attachedDoc = doc as AttachedDoc
      const parentDoc = (
        await this.dbStorage.findAll(ctx, attachedDoc.attachedToClass, { _id: attachedDoc.attachedTo }, { limit: 1 })
      )[0]
      if (parentDoc !== undefined) {
        const parentAttributes = this.getFullTextAttributes(parentDoc._class)
        parentContent = this.getContent(parentAttributes, parentDoc)
      }
    }
    if (attributes === undefined && Object.keys(parentContent).length === 0) return {}

    let content = this.getContent(attributes, doc)
    content = { ...parentContent, ...content }
    const indexedDoc: IndexedDoc = {
      id: doc._id,
      _class: doc._class,
      modifiedBy: doc.modifiedBy,
      modifiedOn: doc.modifiedOn,
      space: doc.space,
      attachedTo: (doc as AttachedDoc).attachedTo,
      ...content
    }
    return await this.adapter.index(indexedDoc)
  }

  protected async txUpdateDoc (ctx: MeasureContext, tx: TxUpdateDoc<Doc>): Promise<TxResult> {
    const attributes = this.getFullTextAttributes(tx.objectClass)
    let result = {}
    if (attributes === undefined) return result
    const ops: any = tx.operations
    const update: any = {}
    let shouldUpdate = false
    for (const attr of attributes) {
      if (ops[attr.name] !== undefined) {
        update[attr.name] = ops[attr.name]
        shouldUpdate = true
      }
    }
    if (tx.operations.space !== undefined) {
      update.space = tx.operations.space
      shouldUpdate = true
    }
    if (shouldUpdate) {
      result = await this.adapter.update(tx.objectId, update)
      await this.updateAttachedDocs(ctx, tx, update)
    }
    return result
  }

  private getContent (attributes: AnyAttribute[] | undefined, doc: Doc): Record<string, string> {
    const attrs: Record<string, string> = {}

    for (const attr of attributes ?? []) {
      attrs[attr.name] = (doc as any)[attr.name]?.toString() ?? ''
    }
    return attrs
  }

  private async updateAttachedDocs (ctx: MeasureContext, tx: {objectId: Ref<Doc>, objectClass: Ref<Class<Doc>>}, update: any): Promise<void> {
    const doc = (await this.dbStorage.findAll(ctx, tx.objectClass, { _id: tx.objectId }, { limit: 1 }))[0]
    if (doc === undefined) return
    const attributes = this.hierarchy.getAllAttributes(doc._class)

    // Find all mixin atttibutes for document.
    this.hierarchy.getDescendants(doc._class)
      .filter((m) => this.hierarchy.getClass(m).kind === ClassifierKind.MIXIN && this.hierarchy.hasMixin(doc, m))
      .forEach((m) => {
        for (const [k, v] of this.hierarchy.getAllAttributes(m, doc._class)) {
          attributes.set(k, v)
        }
      })

    for (const attribute of attributes.values()) {
      if (this.hierarchy.isDerived(attribute.type._class, core.class.Collection)) {
        const collection = attribute.type as Collection<AttachedDoc>
        const allAttached = await this.dbStorage.findAll(ctx, collection.of, { attachedTo: tx.objectId })
        if (allAttached.length === 0) continue
        const docUpdate: any = {}
        for (const key in update) {
          docUpdate[key] = update[key]
        }
        for (const attached of allAttached) {
          try {
            await this.adapter.update(attached._id, docUpdate)
          } catch (err: any) {
            if (((err.message as string) ?? '').includes('document_missing_exception:')) {
              console.error('missing document in elastic for', tx.objectId, 'attached', attached._id, 'collection', attached.collection)
              // We have no document for attached object, so ignore for now. it is probable rebuild of elastic DB.
              continue
            }
            throw err
          }
        }
      }
    }
  }
}
