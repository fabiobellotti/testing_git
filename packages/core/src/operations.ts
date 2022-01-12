import { Collection, DocumentUpdate, Hierarchy, MixinData, MixinUpdate, ModelDb } from '.'
import type { Account, AttachedData, AttachedDoc, Class, Data, Doc, Mixin, PropertyType, Ref, Space } from './classes'
import { Client } from './client'
import type { DocumentQuery, FindOptions, FindResult, TxResult, WithLookup } from './storage'
import { Tx, TxFactory } from './tx'
import core from './component'

/**
 * @public
 *
 * High Level operations with client, will create low level transactions.
 *
 * `notify` is not supported by TxOperations.
 */
export class TxOperations implements Omit<Client, 'notify'> {
  readonly txFactory: TxFactory

  constructor (protected readonly client: Client, user: Ref<Account>) {
    this.txFactory = new TxFactory(user)
  }

  getHierarchy (): Hierarchy {
    return this.client.getHierarchy()
  }

  getModel (): ModelDb {
    return this.client.getModel()
  }

  async close (): Promise<void> {
    return await this.client.close()
  }

  findAll <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T> | undefined): Promise<FindResult<T>> {
    return this.client.findAll(_class, query, options)
  }

  async findOne <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T> | undefined): Promise<WithLookup<T> | undefined> {
    return (await this.findAll(_class, query, options))[0]
  }

  tx (tx: Tx): Promise<TxResult> {
    return this.client.tx(tx)
  }

  async createDoc<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    attributes: Data<T>,
    id?: Ref<T>
  ): Promise<Ref<T>> {
    const tx = this.txFactory.createTxCreateDoc(_class, space, attributes, id)
    await this.client.tx(tx)
    return tx.objectId
  }

  async addCollection<T extends Doc, P extends AttachedDoc>(
    _class: Ref<Class<P>>,
    space: Ref<Space>,
    attachedTo: Ref<T>,
    attachedToClass: Ref<Class<T>>,
    collection: string,
    attributes: AttachedData<P>,
    id?: Ref<P>
  ): Promise<Ref<T>> {
    const tx = this.txFactory.createTxCollectionCUD<T, P>(
      attachedToClass,
      attachedTo,
      space,
      collection,
      this.txFactory.createTxCreateDoc<P>(_class, space, attributes as unknown as Data<P>, id)
    )
    await this.client.tx(tx)
    return tx.objectId
  }

  async updateCollection<T extends Doc, P extends AttachedDoc>(
    _class: Ref<Class<P>>,
    space: Ref<Space>,
    objectId: Ref<P>,
    attachedTo: Ref<T>,
    attachedToClass: Ref<Class<T>>,
    collection: string,
    operations: DocumentUpdate<P>,
    retrieve?: boolean
  ): Promise<Ref<T>> {
    const tx = this.txFactory.createTxCollectionCUD(
      attachedToClass,
      attachedTo,
      space,
      collection,
      this.txFactory.createTxUpdateDoc(_class, space, objectId, operations, retrieve)
    )
    await this.client.tx(tx)
    return tx.objectId
  }

  async removeCollection<T extends Doc, P extends AttachedDoc>(
    _class: Ref<Class<P>>,
    space: Ref<Space>,
    objectId: Ref<P>,
    attachedTo: Ref<T>,
    attachedToClass: Ref<Class<T>>,
    collection: string
  ): Promise<Ref<T>> {
    const tx = this.txFactory.createTxCollectionCUD(
      attachedToClass,
      attachedTo,
      space,
      collection,
      this.txFactory.createTxRemoveDoc(_class, space, objectId)
    )
    await this.client.tx(tx)
    return tx.objectId
  }

  putBag <P extends PropertyType>(
    _class: Ref<Class<Doc>>,
    space: Ref<Space>,
    objectId: Ref<Doc>,
    bag: string,
    key: string,
    value: P
  ): Promise<TxResult> {
    const tx = this.txFactory.createTxPutBag(_class, space, objectId, bag, key, value)
    return this.client.tx(tx)
  }

  updateDoc <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    operations: DocumentUpdate<T>,
    retrieve?: boolean
  ): Promise<TxResult> {
    const tx = this.txFactory.createTxUpdateDoc(_class, space, objectId, operations, retrieve)
    return this.client.tx(tx)
  }

  removeDoc<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<TxResult> {
    const tx = this.txFactory.createTxRemoveDoc(_class, space, objectId)
    return this.client.tx(tx)
  }

  createMixin<D extends Doc, M extends D>(
    objectId: Ref<D>,
    objectClass: Ref<Class<D>>,
    objectSpace: Ref<Space>,
    mixin: Ref<Mixin<M>>,
    attributes: MixinData<D, M>
  ): Promise<TxResult> {
    const tx = this.txFactory.createTxMixin(objectId, objectClass, objectSpace, mixin, attributes)
    return this.client.tx(tx)
  }

  updateMixin<D extends Doc, M extends D>(
    objectId: Ref<D>,
    objectClass: Ref<Class<D>>,
    objectSpace: Ref<Space>,
    mixin: Ref<Mixin<M>>,
    attributes: MixinUpdate<D, M>
  ): Promise<TxResult> {
    const tx = this.txFactory.createTxMixin(objectId, objectClass, objectSpace, mixin, attributes)
    return this.client.tx(tx)
  }

  update<T extends Doc>(doc: T, update: DocumentUpdate<T>, retrieve?: boolean): Promise<TxResult> {
    if (this.client.getHierarchy().isDerived(doc._class, core.class.AttachedDoc)) {
      const adoc = doc as unknown as AttachedDoc
      return this.updateCollection(doc._class, doc.space, adoc._id, adoc.attachedTo, adoc.attachedToClass, adoc.collection, update, retrieve)
    }
    return this.updateDoc(doc._class, doc.space, doc._id, update, retrieve)
  }

  remove<T extends Doc>(doc: T): Promise<TxResult> {
    if (this.client.getHierarchy().isDerived(doc._class, core.class.AttachedDoc)) {
      const adoc = doc as unknown as AttachedDoc
      return this.removeCollection(doc._class, doc.space, adoc._id, adoc.attachedTo, adoc.attachedToClass, adoc.collection)
    }
    return this.removeDoc(doc._class, doc.space, doc._id)
  }

  add<T extends Doc, P extends AttachedDoc>(parent: T, _class: Ref<Class<P>>, obj: AttachedData<P>, objId?: Ref<P>): Promise<TxResult> {
    const h = this.client.getHierarchy()
    const attrs = Array.from(h.getAllAttributes(parent._class).values())
    const collections = attrs.filter(a => h.isDerived(a.type._class, core.class.Collection) && h.isDerived(_class, (a.type as Collection<AttachedDoc>).of))
    if (collections.length !== 1) {
      throw new Error('Please use addCollection method, collection could not be detected.')
    }
    return this.addCollection<T, P>(_class, parent.space, parent._id, parent._class, collections[0].name, obj, objId)
  }
}
