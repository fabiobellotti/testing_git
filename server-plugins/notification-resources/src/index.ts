//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021, 2022 Hardcore Engineering Inc.
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

import chunter, { Backlink } from '@hcengineering/chunter'
import contact, { Employee, EmployeeAccount, formatName } from '@hcengineering/contact'
import core, {
  Account,
  AnyAttribute,
  ArrOf,
  AttachedDoc,
  Class,
  Collection,
  Data,
  Doc,
  DocumentUpdate,
  Hierarchy,
  MixinUpdate,
  Ref,
  RefTo,
  Tx,
  TxCUD,
  TxCollectionCUD,
  TxCreateDoc,
  TxMixin,
  TxProcessor,
  TxRemoveDoc,
  TxUpdateDoc,
  generateId
} from '@hcengineering/core'
import notification, {
  ClassCollaborators,
  Collaborators,
  DocUpdates,
  EmailNotification,
  LastView,
  NotificationProvider,
  NotificationType
} from '@hcengineering/notification'
import { getResource } from '@hcengineering/platform'
import type { TriggerControl } from '@hcengineering/server-core'
import serverNotification, {
  HTMLPresenter,
  TextPresenter,
  createLastViewTx,
  getEmployeeAccount,
  getEmployeeAccountById
} from '@hcengineering/server-notification'
import { Content } from './types'
import { replaceAll } from './utils'

/**
 * @public
 */
export async function OnBacklinkCreate (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const hierarchy = control.hierarchy
  const ptx = tx as TxCollectionCUD<Doc, Backlink>
  let res: Tx[] = []

  if (!checkTx(ptx, hierarchy)) return []

  const receiver = await getEmployeeAccount(ptx.objectId as Ref<Employee>, control)
  if (receiver === undefined) return []

  const sender = await getEmployeeAccountById(ptx.modifiedBy, control)
  if (sender === undefined) return []
  const backlink = getBacklink(ptx)
  const doc = await getBacklinkDoc(backlink, control)
  if (doc !== undefined) {
    const collab = hierarchy.as(doc, notification.mixin.Collaborators)
    if (!collab.collaborators.includes(receiver._id)) {
      const collabTx = control.txFactory.createTxMixin(
        doc._id,
        doc._class,
        doc.space,
        notification.mixin.Collaborators,
        {
          $push: {
            collaborators: receiver._id
          }
        }
      )
      res.push(collabTx)
    }
    res = res.concat(await createCollabDocInfo([receiver._id], control, tx as TxCUD<Doc>, doc))
  }
  return res
}

function checkTx (ptx: TxCollectionCUD<Doc, Backlink>, hierarchy: Hierarchy): boolean {
  if (ptx._class !== core.class.TxCollectionCUD) {
    return false
  }

  if (
    ptx.tx._class !== core.class.TxCreateDoc ||
    !hierarchy.isDerived(ptx.tx.objectClass, chunter.class.Backlink) ||
    !hierarchy.isDerived(ptx.objectClass, contact.class.Employee)
  ) {
    return false
  }
  return true
}

/**
 * @public
 */
export async function isAllowed (
  control: TriggerControl,
  receiver: Ref<EmployeeAccount>,
  typeId: Ref<NotificationType>,
  providerId: Ref<NotificationProvider>
): Promise<boolean> {
  const setting = (
    await control.findAll(
      notification.class.NotificationSetting,
      {
        attachedTo: providerId,
        type: typeId,
        modifiedBy: receiver
      },
      { limit: 1 }
    )
  )[0]
  if (setting !== undefined) {
    return setting.enabled
  }
  const type = (
    await control.modelDb.findAll(notification.class.NotificationType, {
      _id: typeId
    })
  )[0]
  if (type === undefined) return false
  return type.providers[providerId] ?? false
}

async function getTextPart (doc: Doc, control: TriggerControl): Promise<string | undefined> {
  const TextPresenter = getTextPresenter(doc._class, control.hierarchy)
  if (TextPresenter === undefined) return
  return await (
    await getResource(TextPresenter.presenter)
  )(doc, control)
}

async function getHtmlPart (doc: Doc, control: TriggerControl): Promise<string | undefined> {
  const HTMLPresenter = getHTMLPresenter(doc._class, control.hierarchy)
  const htmlPart =
    HTMLPresenter !== undefined ? await (await getResource(HTMLPresenter.presenter))(doc, control) : undefined
  return htmlPart
}

function getHTMLPresenter (_class: Ref<Class<Doc>>, hierarchy: Hierarchy): HTMLPresenter | undefined {
  return hierarchy.classHierarchyMixin(_class, serverNotification.mixin.HTMLPresenter)
}

function getTextPresenter (_class: Ref<Class<Doc>>, hierarchy: Hierarchy): TextPresenter | undefined {
  return hierarchy.classHierarchyMixin(_class, serverNotification.mixin.TextPresenter)
}

function fillTemplate (template: string, sender: string, doc: string, data: string): string {
  let res = replaceAll(template, '{sender}', sender)
  res = replaceAll(res, '{doc}', doc)
  res = replaceAll(res, '{data}', data)
  return res
}

/**
 * @public
 */
export async function getContent (
  doc: Doc | undefined,
  sender: string,
  type: Ref<NotificationType>,
  control: TriggerControl,
  data: string
): Promise<Content | undefined> {
  if (doc === undefined) return
  const notificationType = control.modelDb.getObject(type)

  const textPart = await getTextPart(doc, control)
  if (textPart === undefined) return
  if (notificationType.templates === undefined) return
  const text = fillTemplate(notificationType.templates.textTemplate, sender, textPart, data)
  const htmlPart = await getHtmlPart(doc, control)
  const html = fillTemplate(notificationType.templates.htmlTemplate, sender, htmlPart ?? textPart, data)
  const subject = fillTemplate(notificationType.templates.subjectTemplate, sender, textPart, data)
  return {
    text,
    html,
    subject
  }
}

async function createEmailNotificationTxes (
  control: TriggerControl,
  tx: Tx,
  type: Ref<NotificationType>,
  doc: Doc | undefined,
  senderId: Ref<EmployeeAccount>,
  receiverId: Ref<EmployeeAccount>,
  data: string = ''
): Promise<Tx | undefined> {
  const sender = (await control.modelDb.findAll(contact.class.EmployeeAccount, { _id: senderId }))[0]

  if (sender === undefined) return

  const receiver = (await control.modelDb.findAll(contact.class.EmployeeAccount, { _id: receiverId }))[0]
  if (receiver === undefined) return

  const senderName = formatName(sender.name)

  const content = await getContent(doc, senderName, type, control, data)

  if (content !== undefined) {
    return await getEmailNotificationTx(tx, senderName, content.text, content.html, content.subject, receiver)
  }
}

async function getEmailNotificationTx (
  tx: Tx,
  sender: string,
  text: string,
  html: string,
  subject: string,
  receiver: EmployeeAccount
): Promise<TxCreateDoc<EmailNotification> | undefined> {
  return {
    _id: generateId(),
    objectId: generateId(),
    _class: core.class.TxCreateDoc,
    space: core.space.DerivedTx,
    objectClass: notification.class.EmailNotification,
    objectSpace: notification.space.Notifications,
    modifiedOn: tx.modifiedOn,
    modifiedBy: tx.modifiedBy,
    attributes: {
      status: 'new',
      sender,
      receivers: [receiver.email],
      subject,
      text,
      html
    }
  }
}

/**
 * @public
 */
export async function UpdateLastView (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const actualTx = TxProcessor.extractTx(tx)
  if (actualTx._class !== core.class.TxRemoveDoc) {
    return []
  }

  if ((actualTx as TxCUD<Doc>).objectClass === notification.class.LastView) {
    return []
  }

  const result: Tx[] = []

  const removeTx = actualTx as TxRemoveDoc<Doc>
  const lastViews = await control.findAll(notification.class.LastView, { [removeTx.objectId]: { $exists: true } })
  for (const lastView of lastViews) {
    const clearTx = control.txFactory.createTxUpdateDoc(lastView._class, lastView.space, lastView._id, {
      $unset: {
        [removeTx.objectId]: ''
      }
    })
    result.push(clearTx)
  }
  return result
}

/**
 * @public
 */
export async function OnUpdateLastView (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const actualTx = TxProcessor.extractTx(tx) as TxUpdateDoc<LastView>
  if (actualTx._class !== core.class.TxUpdateDoc) return []
  if (actualTx.objectClass !== notification.class.LastView) return []
  const result: Tx[] = []
  const lastView = (await control.findAll(notification.class.LastView, { _id: actualTx.objectId }))[0]
  if (lastView === undefined) return result
  for (const key in actualTx.operations) {
    const docs = await control.findAll(notification.class.DocUpdates, {
      attachedTo: key as Ref<Doc>,
      user: lastView.user
    })
    for (const doc of docs) {
      const txes = doc.txes.filter((p) => p[1] > actualTx.operations[key])
      result.push(
        control.txFactory.createTxUpdateDoc(doc._class, doc.space, doc._id, {
          txes
        })
      )
    }
  }

  return result
}

function getBacklink (ptx: TxCollectionCUD<Doc, Backlink>): Backlink {
  return TxProcessor.createDoc2Doc(ptx.tx as TxCreateDoc<Backlink>)
}

async function getBacklinkDoc (backlink: Backlink, control: TriggerControl): Promise<Doc | undefined> {
  return (
    await control.findAll(
      backlink.backlinkClass,
      {
        _id: backlink.backlinkId
      },
      { limit: 1 }
    )
  )[0]
}

async function getValueCollaborators (value: any, attr: AnyAttribute, control: TriggerControl): Promise<Ref<Account>[]> {
  const hierarchy = control.hierarchy
  if (attr.type._class === core.class.RefTo) {
    const to = (attr.type as RefTo<Doc>).to
    if (hierarchy.isDerived(to, contact.class.Employee)) {
      const acc = await getEmployeeAccount(value, control)
      return acc !== undefined ? [acc._id] : []
    } else if (hierarchy.isDerived(to, core.class.Account)) {
      const acc = await getEmployeeAccountById(value, control)
      return acc !== undefined ? [acc._id] : []
    }
  } else if (attr.type._class === core.class.ArrOf) {
    const arrOf = (attr.type as ArrOf<RefTo<Doc>>).of
    if (arrOf._class === core.class.RefTo) {
      const to = (arrOf as RefTo<Doc>).to
      if (hierarchy.isDerived(to, contact.class.Employee)) {
        const employeeAccounts = await control.modelDb.findAll(contact.class.EmployeeAccount, {
          employee: { $in: Array.isArray(value) ? value : [value] }
        })
        return employeeAccounts.map((p) => p._id)
      } else if (hierarchy.isDerived(to, core.class.Account)) {
        const employeeAccounts = await control.modelDb.findAll(contact.class.EmployeeAccount, {
          _id: { $in: Array.isArray(value) ? value : [value] }
        })
        return employeeAccounts.map((p) => p._id)
      }
    }
  }
  return []
}

async function getKeyCollaborators (
  doc: Doc,
  value: any,
  field: string,
  control: TriggerControl
): Promise<Ref<Account>[] | undefined> {
  if (value !== undefined && value !== null) {
    const attr = control.hierarchy.findAttribute(doc._class, field)
    if (attr !== undefined) {
      return await getValueCollaborators(value, attr, control)
    }
  }
}

/**
 * @public
 */
export async function getDocCollaborators (
  doc: Doc,
  mixin: ClassCollaborators,
  control: TriggerControl
): Promise<Ref<Account>[]> {
  const collaborators: Set<Ref<Account>> = new Set()
  for (const field of mixin.fields) {
    const value = (doc as any)[field]
    const newCollaborators = await getKeyCollaborators(doc, value, field, control)
    if (newCollaborators !== undefined) {
      for (const newCollaborator of newCollaborators) {
        collaborators.add(newCollaborator)
      }
    }
  }
  return Array.from(collaborators.values())
}

function fieldUpdated (field: string, ops: DocumentUpdate<Doc> | MixinUpdate<Doc, Doc>): boolean {
  if ((ops as any)[field] !== undefined) return true
  if ((ops.$pull as any)?.[field] !== undefined) return true
  if ((ops.$push as any)?.[field] !== undefined) return true
  return false
}

function isTypeMatched (
  control: TriggerControl,
  type: NotificationType,
  tx: TxCUD<Doc>,
  extractedTx: TxCUD<Doc>
): boolean {
  const h = control.hierarchy
  const targetClass = h.getBaseClass(type.objectClass)
  if (!type.txClasses.includes(extractedTx._class)) return false
  if (!control.hierarchy.isDerived(h.getBaseClass(extractedTx.objectClass), targetClass)) return false
  if (tx._class === core.class.TxCollectionCUD && type.attachedToClass !== undefined) {
    if (!control.hierarchy.isDerived(h.getBaseClass(tx.objectClass), h.getBaseClass(type.attachedToClass))) return false
  }
  if (type.field !== undefined) {
    if (extractedTx._class === core.class.TxUpdateDoc) {
      if (!fieldUpdated(type.field, (extractedTx as TxUpdateDoc<Doc>).operations)) return false
    }
    if (extractedTx._class === core.class.TxMixin) {
      if (!fieldUpdated(type.field, (extractedTx as TxMixin<Doc, Doc>).attributes)) return false
    }
  }
  return true
}

async function getMatchedTypes (control: TriggerControl, tx: TxCUD<Doc>): Promise<NotificationType[]> {
  const allTypes = await control.modelDb.findAll(notification.class.NotificationType, {})
  const extractedTx = TxProcessor.extractTx(tx) as TxCUD<Doc>
  const filtered: NotificationType[] = []
  for (const type of allTypes) {
    if (isTypeMatched(control, type, tx, extractedTx)) {
      filtered.push(type)
    }
  }
  return filtered
}

interface NotifyResult {
  allowed: boolean
  emails: NotificationType[]
}

async function isShouldNotify (
  control: TriggerControl,
  tx: TxCUD<Doc>,
  object: Doc,
  user: Ref<Account>
): Promise<NotifyResult> {
  let allowed = false
  const emailTypes: NotificationType[] = []
  const types = await getMatchedTypes(control, tx)
  for (const type of types) {
    if (control.hierarchy.hasMixin(type, serverNotification.mixin.TypeMatch)) {
      const mixin = control.hierarchy.as(type, serverNotification.mixin.TypeMatch)
      if (mixin.func !== undefined) {
        const f = await getResource(mixin.func)
        const res = await f(tx, object, user, type, control)
        if (!res) continue
      }
    }
    if (await isAllowed(control, user as Ref<EmployeeAccount>, type._id, notification.providers.PlatformNotification)) {
      allowed = true
    }
    if (await isAllowed(control, user as Ref<EmployeeAccount>, type._id, notification.providers.EmailNotification)) {
      emailTypes.push(type)
    }
  }
  return {
    allowed,
    emails: emailTypes
  }
}

async function getNotificationTxes (
  control: TriggerControl,
  object: Doc,
  originTx: TxCUD<Doc>,
  target: Ref<Account>,
  docUpdates: DocUpdates[]
): Promise<Tx[]> {
  if (originTx.modifiedBy === target) return []
  const res: Tx[] = []
  const allowed = await isShouldNotify(control, originTx, object, target)
  if (allowed.allowed) {
    const current = docUpdates.find((p) => p.user === target)
    if (current === undefined) {
      res.push(
        control.txFactory.createTxCreateDoc(notification.class.DocUpdates, notification.space.Notifications, {
          user: target,
          attachedTo: object._id,
          attachedToClass: object._class,
          hidden: false,
          lastTx: originTx._id,
          lastTxTime: originTx.modifiedOn,
          txes: [[originTx._id, originTx.modifiedOn]]
        })
      )
    } else {
      res.push(
        control.txFactory.createTxUpdateDoc(current._class, current.space, current._id, {
          $push: {
            txes: [originTx._id, originTx.modifiedOn]
          }
        })
      )
      res.push(
        control.txFactory.createTxUpdateDoc(current._class, current.space, current._id, {
          lastTx: originTx._id,
          lastTxTime: originTx.modifiedOn,
          hidden: false
        })
      )
    }
  }
  for (const type of allowed.emails) {
    const emailTx = await createEmailNotificationTxes(
      control,
      originTx,
      type._id,
      object,
      originTx.modifiedBy as Ref<EmployeeAccount>,
      target as Ref<EmployeeAccount>
    )
    if (emailTx !== undefined) {
      res.push(emailTx)
    }
  }
  return res
}

async function createCollabDocInfo (
  collaborators: Ref<Account>[],
  control: TriggerControl,
  originTx: TxCUD<Doc>,
  object: Doc
): Promise<Tx[]> {
  let res: Tx[] = []
  const targets = new Set(collaborators)
  const docUpdates = await control.findAll(notification.class.DocUpdates, { attachedTo: object._id })
  for (const target of targets) {
    res = res.concat(await getNotificationTxes(control, object, originTx, target, docUpdates))
  }
  return res
}

/**
 * @public
 */
export function getMixinTx (
  actualTx: TxCUD<Doc>,
  control: TriggerControl,
  collaborators: Ref<Account>[]
): TxMixin<Doc, Collaborators> {
  const tx = control.txFactory.createTxMixin(
    actualTx.objectId,
    actualTx.objectClass,
    actualTx.objectSpace,
    notification.mixin.Collaborators,
    {
      collaborators
    }
  )
  return tx
}

/**
 * @public
 */
export async function createCollaboratorDoc (
  tx: TxCreateDoc<Doc>,
  control: TriggerControl,
  originTx: TxCUD<Doc>
): Promise<Tx[]> {
  const res: Tx[] = []
  const hierarchy = control.hierarchy
  const mixin = hierarchy.classHierarchyMixin(tx.objectClass, notification.mixin.ClassCollaborators)
  if (mixin !== undefined) {
    const doc = TxProcessor.createDoc2Doc(tx)
    const collaborators = await getDocCollaborators(doc, mixin, control)

    const mixinTx = getMixinTx(tx, control, collaborators)
    const notificationTxes = await createCollabDocInfo(collaborators, control, originTx, doc)
    res.push(mixinTx)
    res.push(...notificationTxes)
  }
  return res
}

/**
 * @public
 */
export async function collaboratorDocHandler (
  tx: TxCUD<Doc>,
  control: TriggerControl,
  originTx?: TxCUD<Doc>
): Promise<Tx[]> {
  switch (tx._class) {
    case core.class.TxCreateDoc:
      if (tx.space === core.space.DerivedTx) return []
      return await createCollaboratorDoc(tx as TxCreateDoc<Doc>, control, originTx ?? tx)
    case core.class.TxUpdateDoc:
    case core.class.TxMixin:
      if (tx.space === core.space.DerivedTx) return []
      return await updateCollaboratorDoc(tx as TxUpdateDoc<Doc>, control, originTx ?? tx)
    case core.class.TxRemoveDoc:
      return await removeCollaboratorDoc(tx as TxRemoveDoc<Doc>, control)
    case core.class.TxCollectionCUD:
      return await collectionCollabDoc(tx as TxCollectionCUD<Doc, AttachedDoc>, control)
  }

  return []
}

async function collectionCollabDoc (tx: TxCollectionCUD<Doc, AttachedDoc>, control: TriggerControl): Promise<Tx[]> {
  const actualTx = TxProcessor.extractTx(tx)
  let res = await collaboratorDocHandler(actualTx as TxCUD<Doc>, control, tx)
  if ([core.class.TxCreateDoc, core.class.TxRemoveDoc].includes(actualTx._class)) {
    const doc = (await control.findAll(tx.objectClass, { _id: tx.objectId }, { limit: 1 }))[0]
    if (doc !== undefined) {
      if (control.hierarchy.hasMixin(doc, notification.mixin.Collaborators)) {
        const collabMixin = control.hierarchy.as(doc, notification.mixin.Collaborators)
        res = res.concat(await createCollabDocInfo(collabMixin.collaborators, control, tx, doc))
      }
    }
  }
  return res
}

async function removeCollaboratorDoc (tx: TxRemoveDoc<Doc>, control: TriggerControl): Promise<Tx[]> {
  const res: Tx[] = []
  const hierarchy = control.hierarchy
  const mixin = hierarchy.classHierarchyMixin(tx.objectClass, notification.mixin.ClassCollaborators)
  if (mixin !== undefined) {
    const docUpdates = await control.findAll(notification.class.DocUpdates, { attachedTo: tx.objectId })
    for (const doc of docUpdates) {
      res.push(control.txFactory.createTxRemoveDoc(doc._class, doc.space, doc._id))
    }
  }
  return res
}

async function getNewCollaborators (
  ops: DocumentUpdate<Doc> | MixinUpdate<Doc, Doc>,
  mixin: ClassCollaborators,
  doc: Doc,
  control: TriggerControl
): Promise<Ref<Account>[]> {
  const newCollaborators: Set<Ref<Account>> = new Set()
  if (ops.$push !== undefined) {
    for (const key in ops.$push) {
      if (mixin.fields.includes(key)) {
        const value = (ops.$push as any)[key]
        const newCollabs = await getKeyCollaborators(doc, value, key, control)
        if (newCollabs !== undefined) {
          for (const newCollab of newCollabs) {
            newCollaborators.add(newCollab)
          }
        }
      }
    }
  }
  for (const key in ops) {
    if (key.startsWith('$')) continue
    if (mixin.fields.includes(key)) {
      const value = (ops as any)[key]
      const newCollabs = await getKeyCollaborators(doc, value, key, control)
      if (newCollabs !== undefined) {
        for (const newCollab of newCollabs) {
          newCollaborators.add(newCollab)
        }
      }
    }
  }
  return Array.from(newCollaborators.values())
}

function isMixinTx (tx: TxUpdateDoc<Doc> | TxMixin<Doc, Doc>): tx is TxMixin<Doc, Doc> {
  return tx._class === core.class.TxMixin
}

async function updateCollaboratorDoc (
  tx: TxUpdateDoc<Doc> | TxMixin<Doc, Doc>,
  control: TriggerControl,
  originTx: TxCUD<Doc>
): Promise<Tx[]> {
  const hierarchy = control.hierarchy
  let res: Tx[] = []
  const mixin = hierarchy.classHierarchyMixin(tx.objectClass, notification.mixin.ClassCollaborators)
  if (mixin === undefined) return []
  const doc = (await control.findAll(tx.objectClass, { _id: tx.objectId }, { limit: 1 }))[0]
  if (doc === undefined) return []
  if (hierarchy.hasMixin(doc, notification.mixin.Collaborators)) {
    // we should handle change field and subscribe new collaborators
    const collabMixin = hierarchy.as(doc, notification.mixin.Collaborators)
    const collabs = new Set(collabMixin.collaborators)
    const ops = isMixinTx(tx) ? tx.attributes : tx.operations
    const newCollaborators = (await getNewCollaborators(ops, mixin, doc, control)).filter((p) => !collabs.has(p))

    if (newCollaborators.length > 0) {
      res.push(
        control.txFactory.createTxMixin(tx.objectId, tx.objectClass, tx.objectSpace, notification.mixin.Collaborators, {
          $push: {
            collaborators: {
              $each: newCollaborators,
              $position: 0
            }
          }
        })
      )
    }
    res = res.concat(
      await createCollabDocInfo([...collabMixin.collaborators, ...newCollaborators], control, originTx, doc)
    )
  } else {
    const collaborators = await getDocCollaborators(doc, mixin, control)
    res.push(getMixinTx(tx, control, collaborators))
    res = res.concat(await createCollabDocInfo(collaborators, control, originTx, doc))
  }

  return res
}

/**
 * @public
 */
export async function OnAddCollborator (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const result: Tx[] = []
  const actualTx = TxProcessor.extractTx(tx) as TxMixin<Doc, Collaborators>

  if (actualTx._class !== core.class.TxMixin) return []
  if (actualTx.mixin !== notification.mixin.Collaborators) return []
  if (actualTx.attributes.collaborators !== undefined) {
    for (const collab of actualTx.attributes.collaborators) {
      const resTx = await createLastViewTx(control.findAll, actualTx.objectId, collab)
      if (resTx !== undefined) {
        result.push(resTx)
      }
    }
  }
  if (actualTx.attributes.$push?.collaborators !== undefined) {
    const collab = actualTx.attributes.$push?.collaborators
    if (typeof collab === 'object') {
      if ('$each' in collab) {
        for (const collaborator of collab.$each) {
          const resTx = await createLastViewTx(control.findAll, actualTx.objectId, collaborator)
          if (resTx !== undefined) {
            result.push(resTx)
          }
        }
      }
    } else {
      const resTx = await createLastViewTx(control.findAll, actualTx.objectId, collab)
      if (resTx !== undefined) {
        result.push(resTx)
      }
    }
  }
  return result
}

/**
 * @public
 */
export async function isUserInFieldValue (
  tx: Tx,
  doc: Doc,
  user: Ref<Account>,
  type: NotificationType,
  control: TriggerControl
): Promise<boolean> {
  if (type.field === undefined) return false
  const value = (doc as any)[type.field]
  if (value === undefined) return false
  if (Array.isArray(value)) {
    return value.includes(user)
  } else {
    return value === user
  }
}

/**
 * @public
 */
export async function isUserEmployeeInFieldValue (
  tx: Tx,
  doc: Doc,
  user: Ref<Account>,
  type: NotificationType,
  control: TriggerControl
): Promise<boolean> {
  if (type.field === undefined) return false
  const value = (doc as any)[type.field]
  if (value === undefined) return false
  const employee = (
    await control.modelDb.findAll(contact.class.EmployeeAccount, { _id: user as Ref<EmployeeAccount> })
  )[0]
  if (employee === undefined) return false
  if (Array.isArray(value)) {
    return value.includes(employee.employee)
  } else {
    return value === employee.employee
  }
}

/**
 * @public
 */
export async function OnAttributeCreate (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  if (tx._class !== core.class.TxCreateDoc) return []
  const ctx = tx as TxCreateDoc<AnyAttribute>
  if (ctx.objectClass !== core.class.Attribute) return []
  const attribute = TxProcessor.createDoc2Doc(ctx)
  const group = (
    await control.modelDb.findAll(notification.class.NotificationGroup, { objectClass: attribute.attributeOf })
  )[0]
  if (group === undefined) return []
  const isCollection: boolean = core.class.Collection === attribute.type._class
  const objectClass = !isCollection ? attribute.attributeOf : (attribute.type as Collection<AttachedDoc>).of
  const txClasses = !isCollection
    ? [control.hierarchy.isMixin(attribute.attributeOf) ? core.class.TxMixin : core.class.TxUpdateDoc]
    : [core.class.TxCreateDoc, core.class.TxRemoveDoc]
  const data: Data<NotificationType> = {
    attribute: attribute._id,
    group: group._id,
    field: attribute.name,
    generated: true,
    objectClass,
    txClasses,
    hidden: false,
    providers: {
      [notification.providers.PlatformNotification]: false
    },
    label: attribute.label
  }
  if (isCollection) {
    data.attachedToClass = attribute.attributeOf
  }
  const id =
    `${notification.class.NotificationType}_${attribute.attributeOf}_${attribute.name}` as Ref<NotificationType>
  const res = control.txFactory.createTxCreateDoc(notification.class.NotificationType, core.space.Model, data, id)
  return [res]
}

/**
 * @public
 */
export async function OnAttributeUpdate (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  if (tx._class !== core.class.TxUpdateDoc) return []
  const ctx = tx as TxUpdateDoc<AnyAttribute>
  if (ctx.objectClass !== core.class.Attribute) return []
  if (ctx.operations.hidden === undefined) return []
  const type = (await control.findAll(notification.class.NotificationType, { attribute: ctx.objectId }))[0]
  if (type === undefined) return []
  const res = control.txFactory.createTxUpdateDoc(type._class, type.space, type._id, {
    hidden: ctx.operations.hidden
  })
  return [res]
}

export * from './types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  trigger: {
    OnBacklinkCreate,
    CollaboratorDocHandler: collaboratorDocHandler,
    OnUpdateLastView,
    UpdateLastView,
    OnAddCollborator,
    OnAttributeCreate,
    OnAttributeUpdate
  },
  function: {
    IsUserInFieldValue: isUserInFieldValue,
    IsUserEmployeeInFieldValue: isUserEmployeeInFieldValue
  }
})
