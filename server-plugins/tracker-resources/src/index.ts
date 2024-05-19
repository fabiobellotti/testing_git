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

import core, {
  Account,
  AccountRole,
  AttachedDoc,
  concatLink,
  Doc,
  DocumentUpdate,
  Ref,
  Space,
  Tx,
  TxCollectionCUD,
  TxCreateDoc,
  TxCUD,
  TxProcessor,
  TxRemoveDoc,
  TxUpdateDoc,
  WithLookup
} from '@hcengineering/core'
import { getMetadata, IntlString } from '@hcengineering/platform'
import { Person, PersonAccount } from '@hcengineering/contact'
import serverCore, { TriggerControl } from '@hcengineering/server-core'
import tracker, { Component, Issue, IssueParentInfo, IssueDependencyInfo, TimeSpendReport, trackerId } from '@hcengineering/tracker'
import { NotificationContent } from '@hcengineering/notification'
import { workbenchId } from '@hcengineering/workbench'
import { stripTags } from '@hcengineering/text'
import chunter, { ChatMessage } from '@hcengineering/chunter'
import { NOTIFICATION_BODY_SIZE } from '@hcengineering/server-notification'

async function updateSubIssues (
  updateTx: TxUpdateDoc<Issue>,
  control: TriggerControl,
  update: DocumentUpdate<Issue> | ((node: Issue) => DocumentUpdate<Issue>)
): Promise<TxUpdateDoc<Issue>[]> {
  const subIssues = await control.findAll(tracker.class.Issue, { 'parents.parentId': updateTx.objectId })

  return subIssues.map((issue) => {
    const docUpdate = typeof update === 'function' ? update(issue) : update
    return control.txFactory.createTxUpdateDoc(issue._class, issue.space, issue._id, docUpdate)
  })
}

/**
 * @public
 */
export async function issueHTMLPresenter (doc: Doc, control: TriggerControl): Promise<string> {
  const issue = doc as Issue
  const front = getMetadata(serverCore.metadata.FrontUrl) ?? ''
  const path = `${workbenchId}/${control.workspace.workspaceUrl}/${trackerId}/${issue.identifier}`
  const link = concatLink(front, path)
  return `<a href="${link}">${issue.identifier}</a> ${issue.title}`
}

/**
 * @public
 */
export async function getIssueId (doc: Issue, control: TriggerControl): Promise<string> {
  const issue = doc
  const project = (await control.findAll(tracker.class.Project, { _id: issue.space }))[0]
  return `${project?.identifier ?? '?'}-${issue.number}`
}

/**
 * @public
 */
export async function issueTextPresenter (doc: Doc): Promise<string> {
  const issue = doc as Issue
  return `${issue.identifier} ${issue.title}`
}

function isSamePerson (control: TriggerControl, assignee: Ref<Person>, target: Ref<Account>): boolean {
  const targetAccount = control.modelDb.getObject(target) as PersonAccount
  return assignee === targetAccount?.person
}

/**
 * @public
 */
export async function getIssueNotificationContent (
  doc: Doc,
  tx: TxCUD<Doc>,
  target: Ref<Account>,
  control: TriggerControl
): Promise<NotificationContent> {
  const issue = doc as Issue

  const issueTitle = await issueTextPresenter(doc)

  const title = tracker.string.IssueNotificationTitle
  let body = tracker.string.IssueNotificationBody
  const intlParams: Record<string, string | number> = {
    issueTitle
  }
  const intlParamsNotLocalized: Record<string, IntlString> = {}

  if (tx._class === core.class.TxCollectionCUD) {
    const ptx = tx as TxCollectionCUD<Doc, AttachedDoc>

    if (ptx.tx._class === core.class.TxCreateDoc) {
      if (ptx.tx.objectClass === chunter.class.ChatMessage) {
        const createTx = ptx.tx as TxCreateDoc<ChatMessage>
        const message = createTx.attributes.message
        const plainTextMessage = stripTags(message, NOTIFICATION_BODY_SIZE)
        intlParams.message = plainTextMessage
      }
    } else if (ptx.tx._class === core.class.TxUpdateDoc) {
      const updateTx = ptx.tx as TxUpdateDoc<Issue>

      if (
        updateTx.operations.assignee !== null &&
        updateTx.operations.assignee !== undefined &&
        isSamePerson(control, updateTx.operations.assignee, target)
      ) {
        body = tracker.string.IssueAssigneedToYou
      } else {
        const attributes = control.hierarchy.getAllAttributes(doc._class)
        for (const attrName in updateTx.operations) {
          if (!Object.prototype.hasOwnProperty.call(updateTx.operations, attrName)) {
            continue
          }

          const attr = attributes.get(attrName)
          if (attr !== null && attr !== undefined) {
            intlParamsNotLocalized.property = attr.label
            if (attr.type._class === core.class.TypeString) {
              body = tracker.string.IssueNotificationChangedProperty
              intlParams.newValue = (issue as any)[attr.name]?.toString()
            } else {
              body = tracker.string.IssueNotificationChanged
            }
          }
          break
        }
      }
    }
  }

  return {
    title,
    body,
    intlParams,
    intlParamsNotLocalized
  }
}

/**
 * @public
 */
export async function OnComponentRemove (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const ctx = TxProcessor.extractTx(tx) as TxRemoveDoc<Component>

  const issues = await control.findAll(tracker.class.Issue, {
    component: ctx.objectId
  })
  if (issues === undefined) return []
  const res: Tx[] = []

  for (const issue of issues) {
    const issuePush = {
      ...issue,
      component: null
    }
    const tx = control.txFactory.createTxUpdateDoc(issue._class, issue.space, issue._id, issuePush)
    res.push(tx)
  }
  return res
}

/**
 * @public
 */
export async function OnWorkspaceOwnerAdded (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  let ownerId: Ref<PersonAccount> | undefined
  if (control.hierarchy.isDerived(tx._class, core.class.TxCreateDoc)) {
    const createTx = tx as TxCreateDoc<PersonAccount>

    if (createTx.attributes.role === AccountRole.Owner) {
      ownerId = createTx.objectId
    }
  } else if (control.hierarchy.isDerived(tx._class, core.class.TxUpdateDoc)) {
    const updateTx = tx as TxUpdateDoc<PersonAccount>

    if (updateTx.operations.role === AccountRole.Owner) {
      ownerId = updateTx.objectId
    }
  }

  if (ownerId === undefined) {
    return []
  }

  const targetProject = (
    await control.findAll(tracker.class.Project, {
      _id: tracker.project.DefaultProject
    })
  )[0]

  if (targetProject === undefined) {
    return []
  }

  if (
    targetProject.owners === undefined ||
    targetProject.owners.length === 0 ||
    targetProject.owners[0] === core.account.System
  ) {
    const updTx = control.txFactory.createTxUpdateDoc(tracker.class.Project, targetProject.space, targetProject._id, {
      owners: [ownerId]
    })
    return [updTx]
  }

  return []
}

/**
 * @public
 */
export async function OnIssueUpdate (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const actualTx = TxProcessor.extractTx(tx)

  // Check TimeReport operations
  if (
    actualTx._class === core.class.TxCreateDoc ||
    actualTx._class === core.class.TxUpdateDoc ||
    actualTx._class === core.class.TxRemoveDoc
  ) {
    const cud = actualTx as TxCUD<TimeSpendReport>
    if (cud.objectClass === tracker.class.TimeSpendReport) {
      return await doTimeReportUpdate(cud, tx, control)
    }
  }

  if (actualTx._class === core.class.TxCreateDoc) {
    const createTx = actualTx as TxCreateDoc<Issue>
    if (control.hierarchy.isDerived(createTx.objectClass, tracker.class.Issue)) {
      const issue = TxProcessor.createDoc2Doc(createTx)
      const res: Tx[] = []
      updateIssueParentEstimations(issue, res, control, [], issue.parents)
      updateIssueDependencyEstimations(issue, res, control, [], issue.dependency)

      return res
    }
  }

  if (actualTx._class === core.class.TxUpdateDoc) {
    const updateTx = actualTx as TxUpdateDoc<Issue>
    if (control.hierarchy.isDerived(updateTx.objectClass, tracker.class.Issue)) {
      return await doIssueUpdate(updateTx, control, tx as TxCollectionCUD<Issue, AttachedDoc>)
    }
  }
  if (actualTx._class === core.class.TxRemoveDoc) {
    const removeTx = actualTx as TxRemoveDoc<Issue>
    if (control.hierarchy.isDerived(removeTx.objectClass, tracker.class.Issue)) {
      const parentIssue = await control.findAll(tracker.class.Issue, {
        'childInfo.childId': removeTx.objectId
      })
      const dependencyIssue = await control.findAll(tracker.class.Issue, {
        'childInfo.childId': removeTx.objectId
      })
      const res: Tx[] = []
      const parents: IssueParentInfo[] = parentIssue.map((it) => ({
        parentId: it._id,
        parentTitle: it.title,
        identifier: it.identifier,
        space: it.space
      }))

      const dependency: IssueDependencyInfo[] = dependencyIssue.map((it) => ({
        dependencyId: it._id,
        dependencyTitle: it.title,
        identifier: it.identifier,
        space: it.space
      }))
      updateIssueParentEstimations(
        {
          _id: removeTx.objectId,
          estimation: 0,
          reportedTime: 0,
          space: removeTx.space
        },
        res,
        control,
        parents,
        dependency,
        []
      )
      return res
    }
  }
  return []
}

async function doTimeReportUpdate (cud: TxCUD<TimeSpendReport>, tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const parentTx = tx as TxCollectionCUD<Issue, TimeSpendReport>
  switch (cud._class) {
    case core.class.TxCreateDoc: {
      const ccud = cud as TxCreateDoc<TimeSpendReport>
      const res = [
        control.txFactory.createTxUpdateDoc<Issue>(parentTx.objectClass, parentTx.objectSpace, parentTx.objectId, {
          $inc: { reportedTime: ccud.attributes.value }
        })
      ]
      const [currentIssue] = await control.findAll(tracker.class.Issue, { _id: parentTx.objectId }, { limit: 1 })
      currentIssue.reportedTime += ccud.attributes.value
      currentIssue.remainingTime = Math.max(0, currentIssue.estimation - currentIssue.reportedTime)
      updateIssueParentEstimations(currentIssue, res, control, currentIssue.parents, currentIssue.parents)
      return res
    }
    case core.class.TxUpdateDoc: {
      const upd = cud as TxUpdateDoc<TimeSpendReport>
      if (upd.operations.value !== undefined) {
        const logTxes = Array.from(
          await control.findAll(core.class.TxCollectionCUD, {
            'tx.objectId': cud.objectId,
            _id: { $nin: [parentTx._id] }
          })
          // eslint-disable-next-line @typescript-eslint/unbound-method
        ).map(TxProcessor.extractTx)
        const doc: TimeSpendReport | undefined = TxProcessor.buildDoc2Doc(logTxes)

        const res: Tx[] = []
        const [currentIssue] = await control.findAll(tracker.class.Issue, { _id: parentTx.objectId }, { limit: 1 })
        if (doc !== undefined) {
          res.push(
            control.txFactory.createTxUpdateDoc<Issue>(parentTx.objectClass, parentTx.objectSpace, parentTx.objectId, {
              $inc: { reportedTime: upd.operations.value - doc.value }
            })
          )
          currentIssue.reportedTime -= doc.value
          currentIssue.reportedTime += upd.operations.value
          currentIssue.remainingTime = Math.max(0, currentIssue.estimation - currentIssue.reportedTime)
        }

        updateIssueParentEstimations(currentIssue, res, control, currentIssue.parents, currentIssue.parents)
        return res
      }
      break
    }
    case core.class.TxRemoveDoc: {
      if (!control.removedMap.has(parentTx.objectId)) {
        const logTxes = Array.from(
          await control.findAll(core.class.TxCollectionCUD, {
            'tx.objectId': cud.objectId,
            _id: { $nin: [parentTx._id] }
          })
          // eslint-disable-next-line @typescript-eslint/unbound-method
        ).map(TxProcessor.extractTx)
        const doc: TimeSpendReport | undefined = TxProcessor.buildDoc2Doc(logTxes)
        if (doc !== undefined) {
          const res = [
            control.txFactory.createTxUpdateDoc<Issue>(parentTx.objectClass, parentTx.objectSpace, parentTx.objectId, {
              $inc: { reportedTime: -1 * doc.value }
            })
          ]

          const [currentIssue] = await control.findAll(tracker.class.Issue, { _id: parentTx.objectId }, { limit: 1 })
          currentIssue.reportedTime -= doc.value
          currentIssue.remainingTime = Math.max(0, currentIssue.estimation - currentIssue.reportedTime)
          updateIssueParentEstimations(currentIssue, res, control, currentIssue.parents, currentIssue.parents)
          return res
        }
      }
    }
  }
  return []
}

async function doIssueUpdate (
  updateTx: TxUpdateDoc<Issue>,
  control: TriggerControl,
  tx: TxCollectionCUD<Issue, AttachedDoc>
): Promise<Tx[]> {
  const res: Tx[] = []

  let currentIssue: WithLookup<Issue> | undefined

  async function getCurrentIssue(): Promise<WithLookup<Issue>> {
    if (currentIssue !== undefined) {
      return currentIssue
    }
    // We need to remove estimation information from out parent issue
    ;[currentIssue] = await control.findAll(tracker.class.Issue, { _id: updateTx.objectId }, { limit: 1 })
    return currentIssue
  }

  if (Object.prototype.hasOwnProperty.call(updateTx.operations, 'attachedTo')) {
    const [newParent] = await control.findAll(
      tracker.class.Issue,
      { _id: updateTx.operations.attachedTo as Ref<Issue> },
      { limit: 1 }
    )

    const updatedParents: IssueParentInfo[] =
      newParent !== undefined
        ? [
            {
              parentId: newParent._id,
              parentTitle: newParent.title,
              space: newParent.space,
              identifier: newParent.identifier
            },
            ...newParent.parents
          ]
        : []

    function update (issue: Issue): DocumentUpdate<Issue> {
      const parentInfoIndex = issue.parents.findIndex(({ parentId }) => parentId === updateTx.objectId)
      const parentsUpdate =
        parentInfoIndex === -1
          ? {}
          : { parents: [...issue.parents].slice(0, parentInfoIndex + 1).concat(updatedParents) }

      return { ...parentsUpdate }
    }

    res.push(
      control.txFactory.createTxUpdateDoc(updateTx.objectClass, updateTx.objectSpace, updateTx.objectId, {
        parents: updatedParents
      }),
      ...(await updateSubIssues(updateTx, control, update))
    )

    // Remove from parent estimation list.
    const issue = await getCurrentIssue()
    updateIssueParentEstimations(issue, res, control, issue.parents, updatedParents)
  }


  if (Object.prototype.hasOwnProperty.call(updateTx.operations, 'attachedToDependency')) {
    const [newDependency] = await control.findAll(
      tracker.class.Issue,
      { _id: updateTx.operations.attachedToDependency as Ref<Issue> },
      { limit: 1 }
    )

    const updatedDependency: IssueDependencyInfo[] =
      newDependency !== undefined
        ? [
            {
              dependencyId: newDependency._id,
              dependencyTitle: newDependency.title,
              space: newDependency.space,
              identifier: newDependency.identifier
            },
            ...newDependency.dependency
          ]
        : []

    function update (issue: Issue): DocumentUpdate<Issue> {
      const dependencyInfoIndex = issue.dependency.findIndex(({ dependencyId }) => dependencyId === updateTx.objectId)
      const dependencyUpdate =
        dependencyInfoIndex === -1
          ? {}
          : { dependency: [...issue.dependency].slice(0, dependencyInfoIndex + 1).concat(updatedDependency) }

      return { ...dependencyUpdate }
    }

    res.push(
      control.txFactory.createTxUpdateDoc(updateTx.objectClass, updateTx.objectSpace, updateTx.objectId, {
        dependency: updatedDependency
      }),
      ...(await updateSubIssues(updateTx, control, update))
    )

    // Remove from parent estimation list.
    const issue = await getCurrentIssue()
    updateIssueDependencyEstimations(issue, res, control, issue.dependency, updatedDependency)
  }

  if (
    Object.prototype.hasOwnProperty.call(updateTx.operations, 'estimation') ||
    Object.prototype.hasOwnProperty.call(updateTx.operations, 'reportedTime') ||
    (Object.prototype.hasOwnProperty.call(updateTx.operations, '$inc') &&
      Object.prototype.hasOwnProperty.call(updateTx.operations.$inc, 'reportedTime'))
  ) {
    const issue = await getCurrentIssue()

    issue.estimation = updateTx.operations.estimation ?? issue.estimation
    issue.reportedTime = updateTx.operations.reportedTime ?? issue.reportedTime
    issue.remainingTime = Math.max(0, issue.estimation - issue.reportedTime)

    res.push(
      control.txFactory.createTxUpdateDoc(tracker.class.Issue, issue.space, issue._id, {
        remainingTime: issue.remainingTime
      })
    )

    updateIssueParentEstimations(issue, res, control, issue.parents, issue.parents)
    updateIssueDependencyEstimations(issue, res, control, issue.dependency, issue.dependency)
  }

  if (Object.prototype.hasOwnProperty.call(updateTx.operations, 'title')) {
    function update (issue: Issue): DocumentUpdate<Issue> {
      const parentInfoIndex = issue.parents.findIndex(({ parentId }) => parentId === updateTx.objectId)
      const dependecyInfoIndex = issue.dependency.findIndex(({ dependencyId }) => dependencyId === updateTx.objectId)
      const updatedParentInfo = { ...issue.parents[parentInfoIndex], parentTitle: updateTx.operations.title as string }
      const updatedDependencyInfo = { ...issue.dependency[dependecyInfoIndex], dependencyTitle: updateTx.operations.title as string }

      const updatedParents = [...issue.parents]

      const updatedDependency = [...issue.dependency]

      updatedParents[parentInfoIndex] = updatedParentInfo
      updatedDependency[dependecyInfoIndex] = updatedDependencyInfo

      return { parents: updatedParents, dependency: updatedDependency }
    }

    res.push(...(await updateSubIssues(updateTx, control, update)))
  }

  return res
}
function updateIssueParentEstimations (
  issue: {
    _id: Ref<Issue>
    space: Ref<Space>
    estimation: number
    reportedTime: number
  },
  res: Tx[],
  control: TriggerControl,
  sourceParents: IssueParentInfo[],
  targetParents: IssueParentInfo[]
): void {
  for (const pinfo of sourceParents) {
    res.push(
      control.txFactory.createTxUpdateDoc(tracker.class.Issue, pinfo.space, pinfo.parentId, {
        $pull: {
          childInfo: { childId: issue._id }
        }
      })
    )
  }
  for (const pinfo of targetParents) {
    res.push(
      control.txFactory.createTxUpdateDoc(tracker.class.Issue, pinfo.space, pinfo.parentId, {
        $push: {
          childInfo: {
            childId: issue._id,
            estimation: issue.estimation,
            reportedTime: issue.reportedTime
          }
        }
      })
    )
  }
}

function updateIssueDependencyEstimations (
  issue: {
    _id: Ref<Issue>
    space: Ref<Space>
    estimation: number
    reportedTime: number
  },
  res: Tx[],
  control: TriggerControl,
  sourceDependency: IssueDependencyInfo[],
  targetDependency: IssueDependencyInfo[]
): void {
  for (const pinfo of sourceDependency) {
    res.push(
      control.txFactory.createTxUpdateDoc(tracker.class.Issue, pinfo.space, pinfo.DependencyId, {
        $pull: {
          childInfo: { childId: issue._id }
        }
      })
    )
  }
  for (const pinfo of targetDependency) {
    res.push(
      control.txFactory.createTxUpdateDoc(tracker.class.Issue, pinfo.space, pinfo.dependencyId, {
        $push: {
          childInfo: {
            childId: issue._id,
            estimation: issue.estimation,
            reportedTime: issue.reportedTime
          }
        }
      })
    )
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  function: {
    IssueHTMLPresenter: issueHTMLPresenter,
    IssueTextPresenter: issueTextPresenter,
    IssueNotificationContentProvider: getIssueNotificationContent
  },
  trigger: {
    OnIssueUpdate,
    OnComponentRemove,
    OnWorkspaceOwnerAdded
  }
})
