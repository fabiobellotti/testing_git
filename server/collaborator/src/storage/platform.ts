//
// Copyright © 2023, 2024 Hardcore Engineering Inc.
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

import {
  YDocVersion,
  loadCollaborativeDoc,
  saveCollaborativeDoc,
  takeCollaborativeDocSnapshot
} from '@hcengineering/collaboration'
import {
  DocumentId,
  PlatformDocumentId,
  parseDocumentId,
  parsePlatformDocumentId
} from '@hcengineering/collaborator-client'
import core, {
  CollaborativeDoc,
  MeasureContext,
  TxOperations,
  collaborativeDocWithLastVersion
} from '@hcengineering/core'
import { StorageAdapter } from '@hcengineering/server-core'
import { Doc as YDoc } from 'yjs'
import { Context } from '../context'

import { CollabStorageAdapter } from './adapter'

export class PlatformStorageAdapter implements CollabStorageAdapter {
  constructor (private readonly storage: StorageAdapter) {}

  async loadDocument (ctx: MeasureContext, documentId: DocumentId, context: Context): Promise<YDoc | undefined> {
    // try to load document content
    try {
      ctx.info('load document content', { documentId })
      const ydoc = await this.loadDocumentFromStorage(ctx, documentId, context)

      if (ydoc !== undefined) {
        return ydoc
      }
    } catch (err) {
      ctx.error('failed to load document content', { documentId, error: err })
      throw err
    }

    // then try to load from inital content
    const { initialContentId } = context
    if (initialContentId !== undefined && initialContentId.length > 0) {
      try {
        ctx.info('load document initial content', { documentId, initialContentId })
        const ydoc = await this.loadDocumentFromStorage(ctx, initialContentId, context)

        // if document was loaded from the initial content or storage we need to save
        // it to ensure the next time we load it from the ydoc document
        if (ydoc !== undefined) {
          ctx.info('save document content', { documentId, initialContentId })
          await this.saveDocumentToStorage(ctx, documentId, ydoc, context)
          return ydoc
        }
      } catch (err) {
        ctx.error('failed to load initial document content', { documentId, initialContentId, error: err })
        throw err
      }
    }

    // nothing found
    return undefined
  }

  async saveDocument (ctx: MeasureContext, documentId: DocumentId, document: YDoc, context: Context): Promise<void> {
    const { clientFactory } = context

    const client = await ctx.with('connect', {}, async () => {
      return await clientFactory()
    })

    try {
      let snapshot: YDocVersion | undefined
      try {
        ctx.info('take document snapshot', { documentId })
        snapshot = await this.takeSnapshot(ctx, client, documentId, document, context)
      } catch (err) {
        ctx.error('failed to take document snapshot', { documentId, error: err })
      }

      try {
        ctx.info('save document content', { documentId })
        await this.saveDocumentToStorage(ctx, documentId, document, context)
      } catch (err) {
        ctx.error('failed to save document', { documentId, error: err })
        // raise an error if failed to save document to storage
        // this will prevent document from being unloaded from memory
        throw err
      }

      const { platformDocumentId } = context
      if (platformDocumentId !== undefined) {
        ctx.info('save document content to platform', { documentId, platformDocumentId })
        await ctx.with('save-to-platform', {}, async (ctx) => {
          await this.saveDocumentToPlatform(ctx, client, documentId, platformDocumentId, snapshot)
        })
      }
    } finally {
      await client.close()
    }
  }

  async loadDocumentFromStorage (
    ctx: MeasureContext,
    documentId: DocumentId,
    context: Context
  ): Promise<YDoc | undefined> {
    const { collaborativeDoc } = parseDocumentId(documentId)

    return await ctx.with('load-document', {}, async (ctx) => {
      return await withRetry(ctx, 5, async () => {
        // TODO load from JSON
        return await loadCollaborativeDoc(this.storage, context.workspaceId, collaborativeDoc, ctx)
      })
    })
  }

  async saveDocumentToStorage (
    ctx: MeasureContext,
    documentId: DocumentId,
    document: YDoc,
    context: Context
  ): Promise<void> {
    const { collaborativeDoc } = parseDocumentId(documentId)

    await ctx.with('save-document', {}, async (ctx) => {
      await withRetry(ctx, 5, async () => {
        // TODO save to JSON
        await saveCollaborativeDoc(this.storage, context.workspaceId, collaborativeDoc, document, ctx)
      })
    })
  }

  async takeSnapshot (
    ctx: MeasureContext,
    client: Omit<TxOperations, 'close'>,
    documentId: DocumentId,
    document: YDoc,
    context: Context
  ): Promise<YDocVersion | undefined> {
    const { collaborativeDoc } = parseDocumentId(documentId)

    const { workspaceId } = context

    const timestamp = Date.now()

    const yDocVersion: YDocVersion = {
      versionId: `${timestamp}`,
      name: 'Automatic snapshot',
      createdBy: client.user,
      createdOn: timestamp
    }

    await ctx.with('take-snapshot', {}, async (ctx) => {
      await takeCollaborativeDocSnapshot(this.storage, workspaceId, collaborativeDoc, document, yDocVersion, ctx)
    })

    return yDocVersion
  }

  async saveDocumentToPlatform (
    ctx: MeasureContext,
    client: Omit<TxOperations, 'close'>,
    documentName: string,
    platformDocumentId: PlatformDocumentId,
    snapshot: YDocVersion | undefined
  ): Promise<void> {
    const { objectClass, objectId, objectAttr } = parsePlatformDocumentId(platformDocumentId)

    const attribute = client.getHierarchy().findAttribute(objectClass, objectAttr)
    if (attribute === undefined) {
      ctx.warn('attribute not found', { documentName, objectClass, objectAttr })
      return
    }

    const current = await ctx.with('query', {}, async () => {
      return await client.findOne(objectClass, { _id: objectId })
    })

    if (current === undefined) {
      ctx.warn('document not found', { documentName, objectClass, objectId })
      return
    }

    const hierarchy = client.getHierarchy()
    if (hierarchy.isDerived(attribute.type._class, core.class.TypeCollaborativeDoc)) {
      const collaborativeDoc = (current as any)[objectAttr] as CollaborativeDoc
      const newCollaborativeDoc =
        snapshot !== undefined
          ? collaborativeDocWithLastVersion(collaborativeDoc, snapshot.versionId)
          : collaborativeDoc

      await ctx.with('update', {}, async () => {
        await client.diffUpdate(current, { [objectAttr]: newCollaborativeDoc })
      })
    } else {
      ctx.error('unsupported attribute type', { documentName, objectClass, objectAttr })
    }
  }
}

async function withRetry<T> (
  ctx: MeasureContext,
  retries: number,
  op: () => Promise<T>,
  delay: number = 100
): Promise<T> {
  let error: any
  while (retries > 0) {
    retries--
    try {
      return await op()
    } catch (err: any) {
      error = err
      ctx.error('error', { err })
      if (retries !== 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw error
}
