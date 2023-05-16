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

import { Employee } from '@hcengineering/contact'
import core, {
  ApplyOperations,
  AttachedDoc,
  Class,
  Collection,
  Doc,
  DocumentQuery,
  DocumentUpdate,
  Ref,
  SortingOrder,
  StatusCategory,
  StatusValue,
  toIdMap,
  TxCollectionCUD,
  TxOperations,
  TxResult,
  TxUpdateDoc
} from '@hcengineering/core'
import { Asset, IntlString } from '@hcengineering/platform'
import { createQuery } from '@hcengineering/presentation'
import { calcRank } from '@hcengineering/task'
import {
  ComponentStatus,
  Issue,
  IssuePriority,
  IssuesDateModificationPeriod,
  IssuesGrouping,
  IssuesOrdering,
  Project,
  Milestone,
  MilestoneStatus,
  TimeReportDayType
} from '@hcengineering/tracker'
import {
  AnyComponent,
  AnySvelteComponent,
  areDatesEqual,
  getMillisecondsInMonth,
  isWeekend,
  MILLISECONDS_IN_WEEK
} from '@hcengineering/ui'
import { ViewletDescriptor } from '@hcengineering/view'
import { CategoryQuery, groupBy, ListSelectionProvider, SelectDirection } from '@hcengineering/view-resources'
import tracker from './plugin'
import { defaultComponentStatuses, defaultPriorities, defaultMilestoneStatuses } from './types'

export * from './types'

export const UNSET_COLOR = -1

export interface NavigationItem {
  id: string
  label: IntlString
  icon: Asset
  component: AnyComponent
  componentProps?: Record<string, string>
  top: boolean
}

export interface Selection {
  currentProject?: Ref<Project>
  currentSpecial?: string
}

export type IssuesGroupByKeys = keyof Pick<Issue, 'status' | 'priority' | 'assignee' | 'component' | 'milestone'>
export type IssuesOrderByKeys = keyof Pick<Issue, 'status' | 'priority' | 'modifiedOn' | 'dueDate' | 'rank'>

export const issuesGroupKeyMap: Record<IssuesGrouping, IssuesGroupByKeys | undefined> = {
  [IssuesGrouping.Status]: 'status',
  [IssuesGrouping.Priority]: 'priority',
  [IssuesGrouping.Assignee]: 'assignee',
  [IssuesGrouping.Component]: 'component',
  [IssuesGrouping.Milestone]: 'milestone',
  [IssuesGrouping.NoGrouping]: undefined
}

export const issuesOrderKeyMap: Record<IssuesOrdering, IssuesOrderByKeys> = {
  [IssuesOrdering.Status]: 'status',
  [IssuesOrdering.Priority]: 'priority',
  [IssuesOrdering.LastUpdated]: 'modifiedOn',
  [IssuesOrdering.DueDate]: 'dueDate',
  [IssuesOrdering.Manual]: 'rank'
}

export const issuesSortOrderMap: Record<IssuesOrderByKeys, SortingOrder> = {
  status: SortingOrder.Ascending,
  priority: SortingOrder.Ascending,
  modifiedOn: SortingOrder.Descending,
  dueDate: SortingOrder.Ascending,
  rank: SortingOrder.Ascending
}

export const issuesGroupEditorMap: Record<'status' | 'priority' | 'component' | 'milestone', AnyComponent | undefined> =
  {
    status: tracker.component.StatusEditor,
    priority: tracker.component.PriorityEditor,
    component: tracker.component.ComponentEditor,
    milestone: tracker.component.MilestoneEditor
  }

export const getIssuesModificationDatePeriodTime = (period: IssuesDateModificationPeriod | null): number => {
  const today = new Date(Date.now())

  switch (period) {
    case IssuesDateModificationPeriod.PastWeek: {
      return today.getTime() - MILLISECONDS_IN_WEEK
    }
    case IssuesDateModificationPeriod.PastMonth: {
      return today.getTime() - getMillisecondsInMonth(today)
    }
    default: {
      return 0
    }
  }
}

export interface FilterAction {
  icon?: Asset | AnySvelteComponent
  label?: IntlString
  onSelect: (event: MouseEvent | KeyboardEvent) => void
}

export interface FilterSectionElement extends Omit<FilterAction, 'label'> {
  title?: string
  count?: number
  isSelected?: boolean
}

export interface IssueFilter {
  mode: '$in' | '$nin'
  query: DocumentQuery<Issue>
}

export const getGroupedIssues = (
  key: IssuesGroupByKeys | undefined,
  elements: Issue[],
  orderedCategories?: any[]
): { [p: string]: Issue[] } => {
  if (key === undefined) {
    return { [undefined as any]: elements }
  }

  const unorderedIssues = groupBy(elements, key)

  if (orderedCategories === undefined || orderedCategories.length === 0) {
    return unorderedIssues
  }

  return Object.keys(unorderedIssues)
    .sort((o1, o2) => {
      const key1 = o1 === 'null' ? null : o1
      const key2 = o2 === 'null' ? null : o2

      const i1 = orderedCategories.findIndex((x) => x === key1)
      const i2 = orderedCategories.findIndex((x) => x === key2)

      return i1 - i2
    })
    .reduce((obj: { [p: string]: any[] }, objKey) => {
      obj[objKey] = unorderedIssues[objKey]
      return obj
    }, {})
}

export const getIssueFilterAssetsByType = (type: string): { icon: Asset, label: IntlString } | undefined => {
  switch (type) {
    case 'status': {
      return {
        icon: tracker.icon.CategoryBacklog,
        label: tracker.string.Status
      }
    }
    case 'priority': {
      return {
        icon: tracker.icon.PriorityHigh,
        label: tracker.string.Priority
      }
    }
    case 'component': {
      return {
        icon: tracker.icon.Component,
        label: tracker.string.Component
      }
    }
    case 'milestone': {
      return {
        icon: tracker.icon.Milestone,
        label: tracker.string.Milestone
      }
    }
    default: {
      return undefined
    }
  }
}

export const getArraysIntersection = (a: any[], b: any[]): any[] => {
  const setB = new Set(b)
  const intersection = new Set(a.filter((x) => setB.has(x)))

  return Array.from(intersection)
}

export const getArraysUnion = (a: any[], b: any[]): any[] => {
  const setB = new Set(b)
  const union = new Set(a)

  for (const element of setB) {
    union.add(element)
  }

  return Array.from(union)
}

export type ComponentsFilterMode = 'all' | 'backlog' | 'active' | 'closed'

export type MilestoneViewMode = 'all' | 'planned' | 'active' | 'closed'

export type ScrumRecordViewMode = 'timeReports' | 'objects'

export const getIncludedComponentStatuses = (mode: ComponentsFilterMode): ComponentStatus[] => {
  switch (mode) {
    case 'all': {
      return defaultComponentStatuses
    }
    case 'active': {
      return [ComponentStatus.Planned, ComponentStatus.InProgress, ComponentStatus.Paused]
    }
    case 'backlog': {
      return [ComponentStatus.Backlog]
    }
    case 'closed': {
      return [ComponentStatus.Completed, ComponentStatus.Canceled]
    }
    default: {
      return []
    }
  }
}

export const getIncludedMilestoneStatuses = (mode: MilestoneViewMode): MilestoneStatus[] => {
  switch (mode) {
    case 'all': {
      return defaultMilestoneStatuses
    }
    case 'active': {
      return [MilestoneStatus.InProgress]
    }
    case 'planned': {
      return [MilestoneStatus.Planned]
    }
    case 'closed': {
      return [MilestoneStatus.Completed, MilestoneStatus.Canceled]
    }
    default: {
      return []
    }
  }
}

export const componentsTitleMap: Record<ComponentsFilterMode, IntlString> = Object.freeze({
  all: tracker.string.AllComponents,
  backlog: tracker.string.BacklogComponents,
  active: tracker.string.ActiveComponents,
  closed: tracker.string.ClosedComponents
})

export const milestoneTitleMap: Record<MilestoneViewMode, IntlString> = Object.freeze({
  all: tracker.string.AllMilestones,
  planned: tracker.string.PlannedMilestones,
  active: tracker.string.ActiveMilestones,
  closed: tracker.string.ClosedMilestones
})

export const scrumRecordTitleMap: Record<ScrumRecordViewMode, IntlString> = Object.freeze({
  timeReports: tracker.string.ScrumRecordTimeReports,
  objects: tracker.string.ScrumRecordObjects
})

const listIssueStatusOrder = [
  tracker.issueStatusCategory.Started,
  tracker.issueStatusCategory.Unstarted,
  tracker.issueStatusCategory.Backlog,
  tracker.issueStatusCategory.Completed,
  tracker.issueStatusCategory.Canceled
] as const

const listIssueKanbanStatusOrder = [
  tracker.issueStatusCategory.Backlog,
  tracker.issueStatusCategory.Unstarted,
  tracker.issueStatusCategory.Started,
  tracker.issueStatusCategory.Completed,
  tracker.issueStatusCategory.Canceled
] as const

export async function issueStatusSort (
  value: StatusValue[],
  viewletDescriptorId?: Ref<ViewletDescriptor>
): Promise<StatusValue[]> {
  // TODO: How we track category updates.

  if (viewletDescriptorId === tracker.viewlet.Kanban) {
    value.sort((a, b) => {
      const res =
        listIssueKanbanStatusOrder.indexOf(a.values[0].category as Ref<StatusCategory>) -
        listIssueKanbanStatusOrder.indexOf(b.values[0].category as Ref<StatusCategory>)
      if (res === 0) {
        return a.values[0].rank.localeCompare(b.values[0].rank)
      }
      return res
    })
  } else {
    value.sort((a, b) => {
      const res =
        listIssueStatusOrder.indexOf(a.values[0].category as Ref<StatusCategory>) -
        listIssueStatusOrder.indexOf(b.values[0].category as Ref<StatusCategory>)
      if (res === 0) {
        return a.values[0].rank.localeCompare(b.values[0].rank)
      }
      return res
    })
  }
  return value
}

export async function issuePrioritySort (value: IssuePriority[]): Promise<IssuePriority[]> {
  value.sort((a, b) => {
    const i1 = defaultPriorities.indexOf(a)
    const i2 = defaultPriorities.indexOf(b)

    return i1 - i2
  })
  return value
}

export async function milestoneSort (value: Array<Ref<Milestone>>): Promise<Array<Ref<Milestone>>> {
  return await new Promise((resolve) => {
    const query = createQuery(true)
    query.query(tracker.class.Milestone, { _id: { $in: value } }, (res) => {
      const milestones = toIdMap(res)
      value.sort((a, b) => (milestones.get(b)?.targetDate ?? 0) - (milestones.get(a)?.targetDate ?? 0))
      resolve(value)
      query.unsubscribe()
    })
  })
}

export async function moveIssuesToAnotherMilestone (
  client: TxOperations,
  oldMilestone: Milestone,
  newMilestone: Milestone | undefined
): Promise<boolean> {
  try {
    // Find all Issues by Milestone
    const movedIssues = await client.findAll(tracker.class.Issue, { milestone: oldMilestone._id })

    // Update Issues by new Milestone
    const awaitedUpdates: Array<Promise<TxResult>> = []
    for (const issue of movedIssues) {
      awaitedUpdates.push(client.update(issue, { milestone: newMilestone?._id ?? null }))
    }
    await Promise.all(awaitedUpdates)

    return true
  } catch (error) {
    console.error(
      `Error happened while moving issues between milestones from ${oldMilestone.label} to ${
        newMilestone?.label ?? 'No Milestone'
      }: `,
      error
    )
    return false
  }
}

export function getTimeReportDate (type: TimeReportDayType): number {
  const date = new Date(Date.now())

  if (type === TimeReportDayType.PreviousWorkDay) {
    date.setDate(date.getDate() - 1)
  }

  // if date is day off then set date to last working day
  while (isWeekend(date)) {
    date.setDate(date.getDate() - 1)
  }

  return date.valueOf()
}

export function getTimeReportDayType (timestamp: number): TimeReportDayType | undefined {
  const date = new Date(timestamp)
  const currentWorkDate = new Date(getTimeReportDate(TimeReportDayType.CurrentWorkDay))
  const previousWorkDate = new Date(getTimeReportDate(TimeReportDayType.PreviousWorkDay))

  if (areDatesEqual(date, currentWorkDate)) {
    return TimeReportDayType.CurrentWorkDay
  } else if (areDatesEqual(date, previousWorkDate)) {
    return TimeReportDayType.PreviousWorkDay
  }
}

export function subIssueQuery (value: boolean, query: DocumentQuery<Issue>): DocumentQuery<Issue> {
  return value ? query : { ...query, attachedTo: tracker.ids.NoParent }
}

async function getAllSomething (
  _class: Ref<Class<Doc>>,
  query: DocumentQuery<Doc> | undefined,
  onUpdate: () => void,
  queryId: Ref<Doc>
): Promise<any[] | undefined> {
  const promise = new Promise<Array<Ref<Doc>>>((resolve, reject) => {
    let refresh: boolean = false
    const lq = CategoryQuery.getLiveQuery(queryId)
    refresh = lq.query(_class, query ?? {}, (res) => {
      const result = res.map((p) => p._id)
      CategoryQuery.results.set(queryId, result)
      resolve(result)
      onUpdate()
    })

    if (!refresh) {
      resolve(CategoryQuery.results.get(queryId) ?? [])
    }
  })
  return await promise
}

export async function getAllPriority (
  query: DocumentQuery<Doc> | undefined,
  onUpdate: () => void,
  queryId: Ref<Doc>
): Promise<any[] | undefined> {
  return defaultPriorities
}

export async function getAllComponents (
  query: DocumentQuery<Doc> | undefined,
  onUpdate: () => void,
  queryId: Ref<Doc>
): Promise<any[] | undefined> {
  return await getAllSomething(tracker.class.Component, query, onUpdate, queryId)
}

export async function getAllMilestones (
  query: DocumentQuery<Doc> | undefined,
  onUpdate: () => void,
  queryId: Ref<Doc>
): Promise<any[] | undefined> {
  return await getAllSomething(tracker.class.Milestone, query, onUpdate, queryId)
}

export function subIssueListProvider (subIssues: Issue[], target: Ref<Issue>): void {
  const listProvider = new ListSelectionProvider((offset: 1 | -1 | 0, of?: Doc, dir?: SelectDirection) => {
    if (dir === 'vertical') {
      let pos = subIssues.findIndex((p) => p._id === of?._id)
      pos += offset
      if (pos < 0) {
        pos = 0
      }
      if (pos >= subIssues.length) {
        pos = subIssues.length - 1
      }
      listProvider.updateFocus(subIssues[pos])
    }
  }, false)
  listProvider.update(subIssues)
  const selectedIssue = subIssues.find((p) => p._id === target)
  if (selectedIssue != null) {
    listProvider.updateFocus(selectedIssue)
  }
}

export async function getPreviousAssignees (issue: Issue): Promise<Array<Ref<Employee>>> {
  return await new Promise((resolve) => {
    const query = createQuery(true)
    query.query(
      core.class.Tx,
      {
        'tx.objectId': issue._id,
        'tx.operations.assignee': { $exists: true }
      },
      (res) => {
        const prevAssignee = res
          .map((t) => ((t as TxCollectionCUD<Doc, Issue>).tx as TxUpdateDoc<Issue>).operations.assignee)
          .filter((p) => !(p == null)) as Array<Ref<Employee>>
        resolve(prevAssignee)
        query.unsubscribe()
      }
    )
  })
}

async function updateIssuesOnMove (
  client: TxOperations,
  applyOps: ApplyOperations,
  doc: Doc,
  space: Ref<Project>,
  extra?: DocumentUpdate<any>
): Promise<void> {
  const hierarchy = client.getHierarchy()
  const attributes = hierarchy.getAllAttributes(doc._class)
  for (const attribute of attributes.values()) {
    if (hierarchy.isDerived(attribute.type._class, core.class.Collection)) {
      const collection = attribute.type as Collection<AttachedDoc>
      const allAttached = await client.findAll(collection.of, { attachedTo: doc._id })
      for (const attached of allAttached) {
        // Do not use extra for childs.
        if (hierarchy.isDerived(collection.of, tracker.class.Issue)) {
          const lastOne = await client.findOne(tracker.class.Issue, {}, { sort: { rank: SortingOrder.Descending } })
          const incResult = await client.updateDoc(
            tracker.class.Project,
            core.space.Space,
            space,
            {
              $inc: { sequence: 1 }
            },
            true
          )
          await updateIssuesOnMove(client, applyOps, attached, space, {
            ...extra,
            rank: calcRank(lastOne, undefined),
            number: (incResult as any).object.sequence
          })
        } else await updateIssuesOnMove(client, applyOps, attached, space)
      }
    }
  }
  await applyOps.update(doc, {
    space,
    ...extra
  })
}

/**
 * @public
 */
export async function moveIssueToSpace (
  client: TxOperations,
  docs: Doc[],
  space: Ref<Project>,
  extra?: DocumentUpdate<any>
): Promise<void> {
  const applyOps = client.apply(docs[0]._id)
  for (const doc of docs) {
    const lastOne = await client.findOne(tracker.class.Issue, {}, { sort: { rank: SortingOrder.Descending } })
    const incResult = await client.updateDoc(
      tracker.class.Project,
      core.space.Space,
      space,
      {
        $inc: { sequence: 1 }
      },
      true
    )
    await updateIssuesOnMove(client, applyOps, doc, space, {
      ...extra,
      rank: calcRank(lastOne, undefined),
      number: (incResult as any).object.sequence
    })
  }
  await applyOps.commit()
}
