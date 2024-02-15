//
// Copyright © 2023 Hardcore Engineering Inc.
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
import activity, { type ActivityMessage } from '@hcengineering/activity'
import {
  SortingOrder,
  getCurrentAccount,
  type Class,
  type Doc,
  type Ref,
  type TxOperations,
  type WithLookup
} from '@hcengineering/core'
import notification, {
  type ActivityInboxNotification,
  type Collaborators,
  type DocNotifyContext,
  type InboxNotification,
  type InboxNotificationsClient
} from '@hcengineering/notification'
import { createQuery } from '@hcengineering/presentation'
import { derived, get, writable } from 'svelte/store'

export const inboxMessagesStore = writable<ActivityMessage[]>([])

/**
 * @public
 */
export class InboxNotificationsClientImpl implements InboxNotificationsClient {
  protected static _instance: InboxNotificationsClientImpl | undefined = undefined

  readonly docNotifyContexts = writable<DocNotifyContext[]>([])
  readonly docNotifyContextByDoc = writable<Map<Ref<Doc>, DocNotifyContext>>(new Map())

  readonly activityInboxNotifications = writable<Array<WithLookup<ActivityInboxNotification>>>([])
  readonly otherInboxNotifications = writable<InboxNotification[]>([])

  readonly inboxNotifications = derived(
    [this.activityInboxNotifications, this.otherInboxNotifications],
    ([activityNotifications, otherNotifications]) => {
      return otherNotifications
        .concat(activityNotifications)
        .sort((n1, n2) => (n2.createdOn ?? n2.modifiedOn) - (n1.createdOn ?? n1.modifiedOn))
    },
    [] as InboxNotification[]
  )

  readonly inboxNotificationsByContext = derived(
    [this.docNotifyContexts, this.inboxNotifications],
    ([notifyContexts, inboxNotifications]) => {
      if (inboxNotifications.length === 0 || notifyContexts.length === 0) {
        return new Map<Ref<DocNotifyContext>, InboxNotification[]>()
      }

      return inboxNotifications.reduce((result, notification) => {
        const notifyContext = notifyContexts.find(({ _id }) => _id === notification.docNotifyContext)

        if (notifyContext === undefined || notifyContext.hidden) {
          return result
        }

        return result.set(notifyContext._id, (result.get(notifyContext._id) ?? []).concat(notification))
      }, new Map<Ref<DocNotifyContext>, InboxNotification[]>())
    }
  )

  private readonly docNotifyContextsQuery = createQuery(true)
  private readonly otherInboxNotificationsQuery = createQuery(true)
  private readonly activityInboxNotificationsQuery = createQuery(true)

  private _docNotifyContextByDoc = new Map<Ref<Doc>, DocNotifyContext>()

  private constructor () {
    this.docNotifyContextsQuery.query(
      notification.class.DocNotifyContext,
      {
        user: getCurrentAccount()._id
      },
      (result: DocNotifyContext[]) => {
        this.docNotifyContexts.set(result)
        this._docNotifyContextByDoc = new Map(result.map((updates) => [updates.attachedTo, updates]))
        this.docNotifyContextByDoc.set(this._docNotifyContextByDoc)
      }
    )
    this.otherInboxNotificationsQuery.query(
      notification.class.InboxNotification,
      {
        _class: { $nin: [notification.class.ActivityInboxNotification] },
        user: getCurrentAccount()._id
      },
      (result: InboxNotification[]) => {
        this.otherInboxNotifications.set(result)
      },
      {
        sort: {
          createdOn: SortingOrder.Descending
        }
      }
    )

    this.activityInboxNotificationsQuery.query(
      notification.class.ActivityInboxNotification,
      {
        user: getCurrentAccount()._id
      },
      (result: ActivityInboxNotification[]) => {
        this.activityInboxNotifications.set(result)
      },
      {
        sort: {
          createdOn: SortingOrder.Descending
        },
        lookup: {
          attachedTo: activity.class.ActivityMessage
        }
      }
    )
  }

  static createClient (): InboxNotificationsClientImpl {
    InboxNotificationsClientImpl._instance = new InboxNotificationsClientImpl()
    return InboxNotificationsClientImpl._instance
  }

  static getClient (): InboxNotificationsClientImpl {
    if (InboxNotificationsClientImpl._instance === undefined) {
      InboxNotificationsClientImpl._instance = new InboxNotificationsClientImpl()
    }
    return InboxNotificationsClientImpl._instance
  }

  async readDoc (client: TxOperations, _id: Ref<Doc>): Promise<void> {
    const docNotifyContext = this._docNotifyContextByDoc.get(_id)

    if (docNotifyContext === undefined) {
      return
    }

    const inboxNotifications = (get(this.inboxNotifications) ?? []).filter(
      (notification) => notification.docNotifyContext === docNotifyContext._id && !notification.isViewed
    )

    for (const notification of inboxNotifications) {
      await client.update(notification, { isViewed: true })
    }
    await client.update(docNotifyContext, { lastViewedTimestamp: Date.now() })
  }

  async forceReadDoc (client: TxOperations, _id: Ref<Doc>, _class: Ref<Class<Doc>>): Promise<void> {
    const context = this._docNotifyContextByDoc.get(_id)

    if (context !== undefined) {
      await this.readDoc(client, _id)
      return
    }

    const doc = await client.findOne(_class, { _id })

    if (doc === undefined) {
      return
    }

    const hierarchy = client.getHierarchy()
    const collaboratorsMixin = hierarchy.as<Doc, Collaborators>(doc, notification.mixin.Collaborators)

    if (collaboratorsMixin.collaborators === undefined) {
      await client.createMixin<Doc, Collaborators>(
        collaboratorsMixin._id,
        collaboratorsMixin._class,
        collaboratorsMixin.space,
        notification.mixin.Collaborators,
        {
          collaborators: [getCurrentAccount()._id]
        }
      )
    } else if (!collaboratorsMixin.collaborators.includes(getCurrentAccount()._id)) {
      await client.updateMixin(
        collaboratorsMixin._id,
        collaboratorsMixin._class,
        collaboratorsMixin.space,
        notification.mixin.Collaborators,
        {
          $push: {
            collaborators: getCurrentAccount()._id
          }
        }
      )
    }

    await client.createDoc(notification.class.DocNotifyContext, doc.space, {
      attachedTo: _id,
      attachedToClass: _class,
      user: getCurrentAccount()._id,
      hidden: true
    })
  }

  async readMessages (client: TxOperations, ids: Array<Ref<ActivityMessage>>): Promise<void> {
    const alreadyReadIds = get(this.activityInboxNotifications)
      .filter(({ attachedTo, isViewed }) => ids.includes(attachedTo) && isViewed)
      .map(({ attachedTo }) => attachedTo)

    const toReadIds = ids.filter((id) => !alreadyReadIds.includes(id))

    if (toReadIds.length === 0) {
      return
    }

    const notificationsToRead = await client.findAll(notification.class.ActivityInboxNotification, {
      user: getCurrentAccount()._id,
      attachedTo: { $in: toReadIds },
      isViewed: { $ne: true }
    })

    for (const notification of notificationsToRead) {
      await client.update(notification, { isViewed: true })
    }
  }

  async readNotifications (client: TxOperations, ids: Array<Ref<InboxNotification>>): Promise<void> {
    const notificationsToRead = (get(this.inboxNotifications) ?? []).filter(({ _id }) => ids.includes(_id))

    for (const notification of notificationsToRead) {
      await client.update(notification, { isViewed: true })
    }
  }

  async unreadNotifications (client: TxOperations, ids: Array<Ref<InboxNotification>>): Promise<void> {
    const notificationsToUnread = (get(this.inboxNotifications) ?? []).filter(({ _id }) => ids.includes(_id))

    for (const notification of notificationsToUnread) {
      await client.update(notification, { isViewed: false })
    }
  }

  async deleteNotifications (client: TxOperations, ids: Array<Ref<InboxNotification>>): Promise<void> {
    const inboxNotifications = (get(this.inboxNotifications) ?? []).filter(({ _id }) => ids.includes(_id))
    for (const notification of inboxNotifications) {
      await client.remove(notification)
    }
  }
}
