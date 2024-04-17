//
// Copyright © 2022, 2023 Hardcore Engineering Inc.
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
  type Class,
  type Client,
  type DocumentQuery,
  type Ref,
  type RelatedDocument,
  type WithLookup,
  generateId,
  getCurrentAccount
} from '@hcengineering/core'
import { type Document, type Teamspace } from '@hcengineering/document'
import { type Resources } from '@hcengineering/platform'
import preference from '@hcengineering/preference'
import { type ObjectSearchResult, getClient } from '@hcengineering/presentation'
import { showPopup } from '@hcengineering/ui'
import { openDoc } from '@hcengineering/view-resources'

import CreateDocument from './components/CreateDocument.svelte'
import DocumentPresenter from './components/DocumentPresenter.svelte'
import Documents from './components/Documents.svelte'
import MyDocuments from './components/MyDocuments.svelte'
import EditDoc from './components/EditDoc.svelte'
import DocumentItem from './components/DocumentItem.svelte'
import NewDocumentHeader from './components/NewDocumentHeader.svelte'
import CreateTeamspace from './components/teamspace/CreateTeamspace.svelte'
import TeamspaceSpacePresenter from './components/navigator/TeamspaceSpacePresenter.svelte'
import DocumentSearchIcon from './components/DocumentSearchIcon.svelte'
import NotificationDocumentPresenter from './components/NotificationDocumentPresenter.svelte'
import Move from './components/Move.svelte'
import DocumentToDoPresenter from './components/DocumentToDoPresenter.svelte'
import DocumentIcon from './components/DocumentIcon.svelte'

import document from './plugin'
import { createEmptyDocument, documentTitleProvider, getDocumentLink, getDocumentUrl, resolveLocation } from './utils'

const toObjectSearchResult = (e: WithLookup<Document>): ObjectSearchResult => ({
  doc: e,
  title: e.name,
  icon: document.icon.Document,
  component: DocumentItem
})

async function queryDocument (
  _class: Ref<Class<Document>>,
  client: Client,
  search: string,
  filter?: { in?: RelatedDocument[], nin?: RelatedDocument[] }
): Promise<ObjectSearchResult[]> {
  const q: DocumentQuery<Document> = { name: { $like: `%${search}%` } }
  if (filter?.in !== undefined || filter?.nin !== undefined) {
    q._id = {}
    if (filter.in !== undefined) {
      q._id.$in = filter.in?.map((it) => it._id as Ref<Document>)
    }
    if (filter.nin !== undefined) {
      q._id.$nin = filter.nin?.map((it) => it._id as Ref<Document>)
    }
  }
  return (await client.findAll(_class, q, { limit: 200 })).map(toObjectSearchResult)
}

async function createChildDocument (object: Document): Promise<void> {
  const id: Ref<Document> = generateId()
  const space = object.space
  const parent = object._id

  await _createDocument(id, space, parent)
}

async function createDocument (space: Teamspace): Promise<void> {
  const id: Ref<Document> = generateId()
  const parent = document.ids.NoParent

  await _createDocument(id, space._id, parent)
}

async function _createDocument (id: Ref<Document>, space: Ref<Teamspace>, parent: Ref<Document>): Promise<void> {
  const client = getClient()

  await createEmptyDocument(client, id, space, parent, {})

  const doc = await client.findOne(document.class.Document, { _id: id })
  if (doc !== undefined) {
    await openDoc(client.getHierarchy(), doc)
  }
}

async function editTeamspace (teamspace: Teamspace | undefined): Promise<void> {
  if (teamspace !== undefined) {
    showPopup(CreateTeamspace, { teamspace })
  }
}

export async function starDocument (doc: Document): Promise<void> {
  const client = getClient()

  await client.createDoc(document.class.SavedDocument, preference.space.Preference, {
    attachedTo: doc._id
  })
}

export async function unstarDocument (doc: Document): Promise<void> {
  const client = getClient()

  const current = await client.findOne(document.class.SavedDocument, { attachedTo: doc._id })
  if (current !== undefined) {
    await client.remove(current)
  }
}

export default async (): Promise<Resources> => ({
  component: {
    CreateDocument,
    CreateTeamspace,
    DocumentPresenter,
    Documents,
    EditDoc,
    TeamspaceSpacePresenter,
    NewDocumentHeader,
    MyDocuments,
    DocumentSearchIcon,
    NotificationDocumentPresenter,
    Move,
    DocumentToDoPresenter,
    DocumentIcon
  },
  completion: {
    DocumentQuery: async (
      client: Client,
      query: string,
      filter?: { in?: RelatedDocument[], nin?: RelatedDocument[] }
    ) => await queryDocument(document.class.Document, client, query, filter)
  },
  actionImpl: {
    CreateChildDocument: createChildDocument,
    CreateDocument: createDocument,
    EditTeamspace: editTeamspace
  },
  function: {
    GetDocumentLink: getDocumentUrl,
    GetObjectLinkFragment: getDocumentLink,
    IsTeamspaceVisible: async (space: Teamspace) => !space.private || space.members.includes(getCurrentAccount()._id),
    DocumentTitleProvider: documentTitleProvider
  },
  resolver: {
    Location: resolveLocation
  }
})
