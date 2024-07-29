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
import activity, {
  type ActivityMessage,
  type ActivityMessagesFilter,
  type DisplayActivityMessage,
  type DisplayDocUpdateMessage,
  type DocUpdateMessage
} from '@hcengineering/activity'
import { type Channel, type ChatMessage, type DirectMessage, type ThreadMessage } from '@hcengineering/chunter'
import contact, { getName, type Employee, type Person, type PersonAccount } from '@hcengineering/contact'
import { PersonIcon, employeeByIdStore } from '@hcengineering/contact-resources'
import {
  generateId,
  getCurrentAccount,
  type Account,
  type Class,
  type Client,
  type Doc,
  type IdMap,
  type Ref,
  type Space,
  type Timestamp,
  type WithLookup
} from '@hcengineering/core'
import { type DocNotifyContext, type InboxNotification } from '@hcengineering/notification'
import {
  InboxNotificationsClientImpl,
  isActivityNotification,
  isMentionNotification
} from '@hcengineering/notification-resources'
import { translate, type Asset } from '@hcengineering/platform'
import { getClient } from '@hcengineering/presentation'
import { type AnySvelteComponent } from '@hcengineering/ui'
import { classIcon, getDocLinkTitle, getDocTitle } from '@hcengineering/view-resources'
import { get, writable, type Unsubscriber } from 'svelte/store'

import ChannelIcon from './components/ChannelIcon.svelte'
import DirectIcon from './components/DirectIcon.svelte'
import { resetChunterLocIfEqual } from './navigation'
import chunter from './plugin'

export async function getDmName (client: Client, space?: Space): Promise<string> {
  if (space === undefined) {
    return ''
  }

  const employeeAccounts: PersonAccount[] = await getDmAccounts(client, space)

  return await buildDmName(client, employeeAccounts)
}

export async function buildDmName (client: Client, employeeAccounts: PersonAccount[]): Promise<string> {
  if (employeeAccounts.length === 0) {
    return ''
  }

  let unsub: Unsubscriber | undefined
  const promise = new Promise<IdMap<Employee>>((resolve) => {
    unsub = employeeByIdStore.subscribe((p) => {
      if (p.size !== 0) {
        resolve(p)
      }
    })
  })

  const me = getCurrentAccount() as PersonAccount
  const map = await promise

  unsub?.()

  const names: string[] = []
  const processedPersons: Array<Ref<Person>> = []

  let myName = ''

  for (const acc of employeeAccounts) {
    if (processedPersons.includes(acc.person)) {
      continue
    }

    const employee = map.get(acc.person as unknown as Ref<Employee>)

    if (employee === undefined) {
      continue
    }

    if (me.person === employee._id) {
      myName = getName(client.getHierarchy(), employee)
      processedPersons.push(acc.person)
      continue
    }

    names.push(getName(client.getHierarchy(), employee))
    processedPersons.push(acc.person)
  }
  return names.length > 0 ? names.join(', ') : myName
}

export async function dmIdentifierProvider (): Promise<string> {
  return await translate(chunter.string.Direct, {})
}

export async function canDeleteMessage (doc?: ChatMessage): Promise<boolean> {
  if (doc === undefined) {
    return false
  }

  const me = getCurrentAccount()

  return doc.createdBy === me._id
}

export function canReplyToThread (doc?: ActivityMessage): boolean {
  if (doc === undefined) {
    return false
  }

  if (doc._class === chunter.class.ThreadMessage) {
    return false
  }

  if (doc._class === activity.class.DocUpdateMessage) {
    return (doc as DocUpdateMessage).objectClass !== activity.class.Reaction
  }

  return true
}

export async function canCopyMessageLink (doc?: ActivityMessage | ActivityMessage[]): Promise<boolean> {
  const message = Array.isArray(doc) ? doc[0] : doc

  if (message === undefined) {
    return false
  }

  if (message._class === activity.class.DocUpdateMessage) {
    return (message as DocUpdateMessage).objectClass !== activity.class.Reaction
  }

  return true
}

async function getDmAccounts (client: Client, space?: Space): Promise<PersonAccount[]> {
  if (space === undefined) {
    return []
  }

  return await client.findAll(contact.class.PersonAccount, {
    _id: { $in: (space.members ?? []) as Array<Ref<PersonAccount>> }
  })
}

export async function getDmPersons (
  client: Client,
  space: Space,
  personsMap: Map<Ref<WithLookup<Person>>, WithLookup<Person>>
): Promise<Person[]> {
  const personAccounts: PersonAccount[] = await getDmAccounts(client, space)
  const me = getCurrentAccount() as PersonAccount
  const persons: Person[] = []

  const personRefs = new Set(personAccounts.map(({ person }) => person))
  let myPerson: Person | undefined

  for (const personRef of personRefs) {
    const person = personsMap.get(personRef) ?? (await client.findOne(contact.class.Person, { _id: personRef }))
    if (person === undefined) {
      continue
    }

    if (me.person === person._id) {
      myPerson = person
      continue
    }

    persons.push(person)
  }

  if (persons.length > 0) {
    return persons
  }

  return myPerson !== undefined ? [myPerson] : []
}

export async function DirectTitleProvider (
  client: Client,
  id: Ref<DirectMessage>,
  doc?: DirectMessage
): Promise<string> {
  const direct = doc ?? (await client.findOne(chunter.class.DirectMessage, { _id: id }))

  if (direct === undefined) {
    return ''
  }

  return await getDmName(client, direct)
}

export async function ChannelTitleProvider (client: Client, id: Ref<Channel>, doc?: Channel): Promise<string> {
  const channel = doc ?? (await client.findOne(chunter.class.Channel, { _id: id }))

  if (channel === undefined) {
    return ''
  }

  return channel.name
}

export enum SearchType {
  Messages,
  Files,
  Contacts
}

export async function getTitle (doc: Doc): Promise<string> {
  const client = getClient()
  const hierarchy = client.getHierarchy()
  let clazz = hierarchy.getClass(doc._class)
  let label = clazz.shortLabel
  while (label === undefined && clazz.extends !== undefined) {
    clazz = hierarchy.getClass(clazz.extends)
    label = clazz.shortLabel
  }
  label = label ?? doc._class
  return `${label}-${doc._id}`
}

export function getObjectIcon (_class: Ref<Class<Doc>>): Asset | AnySvelteComponent | undefined {
  const client = getClient()
  const hierarchy = client.getHierarchy()

  if (_class === chunter.class.Channel) {
    return ChannelIcon
  }

  if (_class === chunter.class.DirectMessage) {
    return DirectIcon
  }

  if (hierarchy.isDerived(_class, contact.class.Person)) {
    return PersonIcon
  }

  return classIcon(client, _class)
}

export async function getChannelName (
  _id: Ref<Doc>,
  _class: Ref<Class<Doc>>,
  object?: Doc
): Promise<string | undefined> {
  const client = getClient()

  if (client.getHierarchy().isDerived(_class, chunter.class.ChunterSpace)) {
    return await getDocTitle(client, _id, _class, object)
  }

  return await getDocLinkTitle(client, _id, _class, object)
}

export function getUnreadThreadsCount (): number {
  const notificationClient = InboxNotificationsClientImpl.getClient()

  const threadIds = get(notificationClient.activityInboxNotifications)
    .filter(({ attachedToClass, isViewed }) => attachedToClass === chunter.class.ThreadMessage && !isViewed)
    .map(({ $lookup }) => $lookup?.attachedTo?.attachedTo)
    .filter((_id) => _id !== undefined)

  return new Set(threadIds).size
}

export function getClosestDate (selectedDate: Timestamp, dates: Timestamp[]): Timestamp | undefined {
  if (dates.length === 0) {
    return
  }

  let closestDate: Timestamp | undefined = dates[dates.length - 1]
  const reversedDates = [...dates].reverse()

  for (const date of reversedDates) {
    if (date < selectedDate) {
      break
    } else if (date - selectedDate < closestDate - selectedDate) {
      closestDate = date
    }
  }

  return closestDate
}

export function filterChatMessages (
  messages: DisplayActivityMessage[],
  filters: ActivityMessagesFilter[],
  filterResources: Map<Ref<ActivityMessagesFilter>, (message: ActivityMessage, _class?: Ref<Doc>) => boolean>,
  objectClass: Ref<Class<Doc>>,
  selectedIds: Array<Ref<ActivityMessagesFilter>>
): DisplayActivityMessage[] {
  if (selectedIds.length === 0 || selectedIds.includes(activity.ids.AllFilter)) {
    return messages
  }

  const selectedFilters = filters.filter(({ _id }) => selectedIds.includes(_id))

  if (selectedFilters.length === 0) {
    return messages
  }
  const filtersFns: Array<(message: ActivityMessage, _class?: Ref<Doc>) => boolean> = []

  for (const filter of selectedFilters) {
    const filterFn = filterResources.get(filter._id)
    if (filterFn !== undefined) {
      filtersFns.push(filterFn)
    }
  }

  return messages.filter((message) => filtersFns.some((filterFn) => filterFn(message, objectClass)))
}

export async function joinChannel (channel: Channel, value: Ref<Account> | Array<Ref<Account>>): Promise<void> {
  const client = getClient()

  if (Array.isArray(value)) {
    if (value.length > 0) {
      await client.update(channel, { $push: { members: { $each: value, $position: 0 } } })
    }
  } else {
    await client.update(channel, { $push: { members: value } })
  }
}

export async function leaveChannel (
  channel: Channel | undefined,
  value: Ref<Account> | Array<Ref<Account>>
): Promise<void> {
  if (channel === undefined) return

  const client = getClient()

  if (Array.isArray(value)) {
    if (value.length > 0) {
      await client.update(channel, { $pull: { members: { $in: value } } })
    }
  } else {
    await client.update(channel, { $pull: { members: value } })
    await resetChunterLocIfEqual(channel._id, channel._class, channel)
  }
}

// NOTE: Store timestamp updates to avoid unnecessary updates when if the server takes a long time to respond
const contextsTimestampStore = writable<Map<Ref<DocNotifyContext>, number>>(new Map())
// NOTE: Sometimes user can read message before notification is created and we should mark it as viewed when notification is received
export const chatReadMessagesStore = writable<Set<Ref<ActivityMessage>>>(new Set())

function getAllIds (messages: DisplayActivityMessage[]): Array<Ref<ActivityMessage>> {
  return messages
    .map((message) => {
      const combined =
        message._class === activity.class.DocUpdateMessage
          ? (message as DisplayDocUpdateMessage)?.combinedMessagesIds
          : undefined

      return [message._id, ...(combined ?? [])]
    })
    .flat()
}

let toReadTimer: any
const toRead = new Set<Ref<InboxNotification>>()

export function recheckNotifications (context: DocNotifyContext): void {
  const client = getClient()
  const inboxClient = InboxNotificationsClientImpl.getClient()

  const messages = get(chatReadMessagesStore)

  if (messages.size === 0) {
    return
  }

  const notifications = get(inboxClient.inboxNotificationsByContext).get(context._id) ?? []

  notifications
    .filter((it) => {
      if (it.isViewed) {
        return false
      }

      if (isMentionNotification(it)) {
        return messages.has(it.mentionedIn as Ref<ActivityMessage>)
      }

      if (isActivityNotification(it)) {
        return messages.has(it.attachedTo)
      }

      return false
    })
    .forEach((n) => toRead.add(n._id))

  clearTimeout(toReadTimer)
  toReadTimer = setTimeout(() => {
    const toReadData = Array.from(toRead)
    toRead.clear()
    void (async () => {
      const _client = client.apply(generateId())
      await inboxClient.readNotifications(_client, toReadData)
      await _client.commit()
    })()
  }, 500)
}

export async function readChannelMessages (
  messages: DisplayActivityMessage[],
  context: DocNotifyContext | undefined
): Promise<void> {
  if (messages.length === 0) {
    return
  }

  const inboxClient = InboxNotificationsClientImpl.getClient()

  const client = getClient().apply(generateId())
  try {
    const readMessages = get(chatReadMessagesStore)
    const allIds = getAllIds(messages).filter((id) => !readMessages.has(id))

    const notifications = get(inboxClient.activityInboxNotifications)
      .filter(({ _id, attachedTo }) => allIds.includes(attachedTo))
      .map((n) => n._id)

    const relatedMentions = get(inboxClient.otherInboxNotifications)
      .filter((n) => !n.isViewed && isMentionNotification(n) && allIds.includes(n.mentionedIn as Ref<ActivityMessage>))
      .map((n) => n._id)

    chatReadMessagesStore.update((store) => new Set([...store, ...allIds]))

    await inboxClient.readNotifications(client, [...notifications, ...relatedMentions])

    if (context === undefined) {
      return
    }

    const storedTimestampUpdates = get(contextsTimestampStore).get(context._id)
    const newTimestamp = messages[messages.length - 1].createdOn ?? 0
    const prevTimestamp = Math.max(storedTimestampUpdates ?? 0, context.lastViewedTimestamp ?? 0)

    if (prevTimestamp < newTimestamp) {
      context.lastViewedTimestamp = newTimestamp
      contextsTimestampStore.update((store) => {
        store.set(context._id, newTimestamp)
        return store
      })
      await client.update(context, { lastViewedTimestamp: newTimestamp })
    }
  } finally {
    await client.commit()
  }
}

export async function leaveChannelAction (
  context?: DocNotifyContext,
  _?: Event,
  props?: { object?: Channel }
): Promise<void> {
  if (context === undefined) {
    return
  }
  const client = getClient()
  const channel =
    props?.object ?? (await client.findOne(chunter.class.Channel, { _id: context.attachedTo as Ref<Channel> }))

  if (channel === undefined) {
    return
  }

  await leaveChannel(channel, getCurrentAccount()._id)
  await resetChunterLocIfEqual(channel._id, channel._class, channel)
}

export async function removeChannelAction (
  context?: DocNotifyContext,
  _?: Event,
  props?: { object?: Doc }
): Promise<void> {
  if (context === undefined) {
    return
  }

  const client = getClient()
  const hierarchy = client.getHierarchy()
  const inboxClient = InboxNotificationsClientImpl.getClient()

  if (hierarchy.isDerived(context.attachedToClass, chunter.class.Channel)) {
    const channel = await client.findOne(chunter.class.Channel, { _id: context.attachedTo as Ref<Channel> })
    await leaveChannel(channel, getCurrentAccount()._id)
  } else {
    const object = await client.findOne(context.attachedToClass, { _id: context.attachedTo })
    const account = getCurrentAccount() as PersonAccount

    await client.createMixin(context._id, context._class, context.space, chunter.mixin.ChannelInfo, { hidden: true })

    const chatInfo = await client.findOne(chunter.class.ChatInfo, { user: account.person })

    if (chatInfo !== undefined) {
      await client.update(chatInfo, { hidden: chatInfo.hidden.concat([context._id]) })
    }
    await resetChunterLocIfEqual(context.attachedTo, context.attachedToClass, object)
  }

  void inboxClient.readDoc(client, context.attachedTo)
}

export function isThreadMessage (message: ActivityMessage): message is ThreadMessage {
  return message._class === chunter.class.ThreadMessage
}
