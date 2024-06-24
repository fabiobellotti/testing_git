//
// Copyright © 2022 Hardcore Engineering Inc.
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

import { ActivityMessage } from '@hcengineering/activity'
import {
  Account,
  AnyAttribute,
  Class,
  Doc,
  DocumentQuery,
  IdMap,
  Markup,
  Mixin,
  Ref,
  Space,
  Timestamp,
  Tx,
  TxOperations
} from '@hcengineering/core'
import type { Asset, IntlString, Metadata, Plugin, Resource } from '@hcengineering/platform'
import { plugin } from '@hcengineering/platform'
import { Preference } from '@hcengineering/preference'
import { IntegrationType } from '@hcengineering/setting'
import { AnyComponent, Location, ResolvedLocation } from '@hcengineering/ui'
import { Action } from '@hcengineering/view'
import { Readable, Writable } from './types'

export * from './types'

/**
 * @public
 */
export interface BrowserNotification extends Doc {
  user: Ref<Account>
  status: NotificationStatus
  title: string
  body: string
  onClickLocation?: Location
  senderId?: Ref<Account>
  tag: Ref<Doc>
}

export interface PushData {
  tag?: string
  title: string
  body: string
  icon?: string
  domain?: string
  url?: string
}

export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface PushSubscription extends Doc {
  user: Ref<Account>
  endpoint: string
  keys: PushSubscriptionKeys
}

/**
 * @public
 */
export enum NotificationStatus {
  New,
  Notified
}

/**
 * @public
 */
export interface NotificationGroup extends Doc {
  label: IntlString
  icon: Asset
  // using for autogenerated settings
  objectClass?: Ref<Class<Doc>>
}

/**
 * @public
 */
export interface NotificationPreferencesGroup extends Doc {
  label: IntlString
  icon: Asset
  presenter: AnyComponent
}

/**
 * @public
 */
export interface NotificationTemplate {
  textTemplate: string
  htmlTemplate: string
  subjectTemplate: string
}

/**
 * @public
 */
export interface NotificationContent {
  title: IntlString
  body: IntlString
  intlParams: Record<string, string | number>
  intlParamsNotLocalized?: Record<string, IntlString>
}

export interface BaseNotificationType extends Doc {
  label: IntlString
  // Is autogenerated
  generated: boolean
  // allowed to  change setting (probably we should show it, but disable toggle??)
  hidden: boolean
  group: Ref<NotificationGroup>
  // allowed providers and default value for it
  providers: Record<Ref<NotificationProvider>, boolean>
  // templates for email (and browser/push?)
  templates?: NotificationTemplate
}
/**
 * @public
 */
export interface NotificationType extends BaseNotificationType {
  // For show/hide with attributes
  attribute?: Ref<AnyAttribute>
  txClasses: Ref<Class<Tx>>[]
  objectClass: Ref<Class<Doc>>
  // not allowed to parent doc
  onlyOwn?: boolean
  // check parent doc class
  attachedToClass?: Ref<Class<Doc>>
  // use for update/mixin txes
  field?: string
  txMatch?: DocumentQuery<Tx>
  // use for space collaborators, not object
  spaceSubscribe?: boolean
  // when true notification will be created for user which trigger it (default - false)
  allowedForAuthor?: boolean
}

export interface CommonNotificationType extends BaseNotificationType {}

/**
 * @public
 */
export interface NotificationProvider extends Doc {
  label: IntlString
  depends?: Ref<NotificationProvider>
  onChange?: Resource<(value: boolean) => Promise<boolean>>
}

/**
 * @public
 */
export interface NotificationSetting extends Preference {
  attachedTo: Ref<NotificationProvider>
  type: Ref<BaseNotificationType>
  enabled: boolean
}

/**
 * @public
 */
export interface ClassCollaborators extends Class<Doc> {
  fields: string[] // Ref<Account> | Ref<Employee> | Ref<Account>[] | Ref<Employee>[]
}

/**
 * @public
 */
export interface NotificationObjectPresenter extends Class<Doc> {
  presenter: AnyComponent
}

/**
 * @public
 */
export interface Collaborators extends Doc {
  collaborators: Ref<Account>[]
}

/**
 * @public
 */
export const notificationId = 'notification' as Plugin

/**
 * @public
 */
export interface NotificationPreview extends Class<Doc> {
  presenter: AnyComponent
}

/**
 * @public
 */
export interface NotificationContextPresenter extends Class<Doc> {
  labelPresenter?: AnyComponent
}

/**
 * @public
 */
export interface InboxNotification extends Doc {
  user: Ref<Account>
  isViewed: boolean

  docNotifyContext: Ref<DocNotifyContext>

  // For browser notifications
  title?: IntlString
  body?: IntlString
  intlParams?: Record<string, string | number>
  intlParamsNotLocalized?: Record<string, IntlString>
  archived?: boolean
}

export interface ActivityInboxNotification extends InboxNotification {
  attachedTo: Ref<ActivityMessage>
  attachedToClass: Ref<Class<ActivityMessage>>
}

export interface CommonInboxNotification extends InboxNotification {
  header?: IntlString
  headerIcon?: Asset
  headerObjectId?: Ref<Doc>
  headerObjectClass?: Ref<Class<Doc>>
  message?: IntlString
  messageHtml?: Markup
  props?: Record<string, any>
  icon?: Asset
  iconProps?: Record<string, any>
}

export interface MentionInboxNotification extends CommonInboxNotification {
  mentionedIn: Ref<Doc>
  mentionedInClass: Ref<Class<Doc>>
}

export interface DisplayActivityInboxNotification extends ActivityInboxNotification {
  combinedIds: Ref<ActivityInboxNotification>[]
  combinedMessages: ActivityMessage[]
}

export type DisplayInboxNotification = DisplayActivityInboxNotification | InboxNotification

/**
 * @public
 */
export interface DocNotifyContext extends Doc {
  user: Ref<Account>

  // Context
  attachedTo: Ref<Doc>
  attachedToClass: Ref<Class<Doc>>

  hidden: boolean
  isPinned?: boolean
  lastViewedTimestamp?: Timestamp
  lastUpdateTimestamp?: Timestamp
}

/**
 * @public
 */
export interface InboxNotificationsClient {
  contextByDoc: Writable<Map<Ref<Doc>, DocNotifyContext>>
  contexts: Writable<DocNotifyContext[]>
  contextById: Readable<IdMap<DocNotifyContext>>

  inboxNotifications: Readable<InboxNotification[]>
  activityInboxNotifications: Writable<ActivityInboxNotification[]>
  inboxNotificationsByContext: Readable<Map<Ref<DocNotifyContext>, InboxNotification[]>>

  readDoc: (client: TxOperations, _id: Ref<Doc>) => Promise<void>
  forceReadDoc: (client: TxOperations, _id: Ref<Doc>, _class: Ref<Class<Doc>>) => Promise<void>
  readMessages: (client: TxOperations, ids: Ref<ActivityMessage>[]) => Promise<void>
  readNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  unreadNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  archiveNotifications: (client: TxOperations, ids: Array<Ref<InboxNotification>>) => Promise<void>
  archiveAllNotifications: () => Promise<void>
  readAllNotifications: () => Promise<void>
  unreadAllNotifications: () => Promise<void>
}

/**
 * @public
 */
export type InboxNotificationsClientFactory = () => InboxNotificationsClient

/**
 * @public
 */
export interface ActivityNotificationViewlet extends Doc {
  messageMatch: DocumentQuery<Doc>
  presenter: AnyComponent
}

/**
 * @public
 */
export type NotifyFunc = (title: string, body: string, _id?: string, onClick?: () => void) => void

/**
 * @public
 */
const notification = plugin(notificationId, {
  mixin: {
    ClassCollaborators: '' as Ref<Mixin<ClassCollaborators>>,
    Collaborators: '' as Ref<Mixin<Collaborators>>,
    NotificationObjectPresenter: '' as Ref<Mixin<NotificationObjectPresenter>>,
    NotificationPreview: '' as Ref<Mixin<NotificationPreview>>,
    NotificationContextPresenter: '' as Ref<Mixin<NotificationContextPresenter>>
  },
  class: {
    BrowserNotification: '' as Ref<Class<BrowserNotification>>,
    PushSubscription: '' as Ref<Class<PushSubscription>>,
    BaseNotificationType: '' as Ref<Class<BaseNotificationType>>,
    NotificationType: '' as Ref<Class<NotificationType>>,
    CommonNotificationType: '' as Ref<Class<CommonNotificationType>>,
    NotificationProvider: '' as Ref<Class<NotificationProvider>>,
    NotificationSetting: '' as Ref<Class<NotificationSetting>>,
    NotificationGroup: '' as Ref<Class<NotificationGroup>>,
    NotificationPreferencesGroup: '' as Ref<Class<NotificationPreferencesGroup>>,
    DocNotifyContext: '' as Ref<Class<DocNotifyContext>>,
    InboxNotification: '' as Ref<Class<InboxNotification>>,
    ActivityInboxNotification: '' as Ref<Class<ActivityInboxNotification>>,
    CommonInboxNotification: '' as Ref<Class<CommonInboxNotification>>,
    ActivityNotificationViewlet: '' as Ref<Class<ActivityNotificationViewlet>>,
    MentionInboxNotification: '' as Ref<Class<MentionInboxNotification>>
  },
  ids: {
    NotificationSettings: '' as Ref<Doc>,
    NotificationGroup: '' as Ref<NotificationGroup>,
    CollaboratoAddNotification: '' as Ref<NotificationType>,
    MentionCommonNotificationType: '' as Ref<CommonNotificationType>
  },
  metadata: {
    PushPublicKey: '' as Metadata<string>
  },
  providers: {
    PlatformNotification: '' as Ref<NotificationProvider>,
    BrowserNotification: '' as Ref<NotificationProvider>,
    EmailNotification: '' as Ref<NotificationProvider>
  },
  integrationType: {
    MobileApp: '' as Ref<IntegrationType>
  },
  component: {
    Inbox: '' as AnyComponent,
    NotificationPresenter: '' as AnyComponent,
    CollaboratorsChanged: '' as AnyComponent,
    DocNotifyContextPresenter: '' as AnyComponent,
    NotificationCollaboratorsChanged: '' as AnyComponent,
    ReactionNotificationPresenter: '' as AnyComponent
  },
  action: {
    PinDocNotifyContext: '' as Ref<Action>,
    UnpinDocNotifyContext: '' as Ref<Action>,
    UnReadNotifyContext: '' as Ref<Action>,
    ReadNotifyContext: '' as Ref<Action>,
    ArchiveContextNotifications: '' as Ref<Action>,
    UnarchiveContextNotifications: '' as Ref<Action>
  },
  icon: {
    Notifications: '' as Asset,
    Inbox: '' as Asset,
    BellCrossed: '' as Asset
  },
  space: {
    Notifications: '' as Ref<Space>
  },
  string: {
    Notification: '' as IntlString,
    Notifications: '' as IntlString,
    DontTrack: '' as IntlString,
    Inbox: '' as IntlString,
    CommonNotificationTitle: '' as IntlString,
    CommonNotificationBody: '' as IntlString,
    CommonNotificationChanged: '' as IntlString,
    CommonNotificationChangedProperty: '' as IntlString,
    ChangedCollaborators: '' as IntlString,
    NewCollaborators: '' as IntlString,
    RemovedCollaborators: '' as IntlString,
    Edited: '' as IntlString,
    Pinned: '' as IntlString,
    All: '' as IntlString,
    ArchiveAll: '' as IntlString,
    MarkReadAll: '' as IntlString,
    MarkUnreadAll: '' as IntlString,
    ArchiveAllConfirmationTitle: '' as IntlString,
    ArchiveAllConfirmationMessage: '' as IntlString,
    YouAddedCollaborators: '' as IntlString,
    YouRemovedCollaborators: '' as IntlString,
    Push: '' as IntlString
  },
  function: {
    Notify: '' as Resource<NotifyFunc>,
    CheckPushPermission: '' as Resource<(value: boolean) => Promise<boolean>>,
    GetInboxNotificationsClient: '' as Resource<InboxNotificationsClientFactory>,
    HasInboxNotifications: '' as Resource<
    (notificationsByContext: Map<Ref<DocNotifyContext>, InboxNotification[]>) => Promise<boolean>
    >
  },
  resolver: {
    Location: '' as Resource<(loc: Location) => Promise<ResolvedLocation | undefined>>
  }
})

export default notification
