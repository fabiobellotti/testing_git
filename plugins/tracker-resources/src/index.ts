//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
  Class,
  Client,
  Doc,
  DocumentQuery,
  getCurrentAccount,
  Ref,
  RelatedDocument,
  toIdMap,
  TxOperations
} from '@hcengineering/core'
import { Resources, translate } from '@hcengineering/platform'
import { getClient, MessageBox, ObjectSearchResult } from '@hcengineering/presentation'
import { Issue, Project, Scrum, ScrumRecord, Milestone } from '@hcengineering/tracker'
import { showPopup } from '@hcengineering/ui'
import ComponentEditor from './components/components/ComponentEditor.svelte'
import ComponentPresenter from './components/components/ComponentPresenter.svelte'
import ComponentRefPresenter from './components/components/ComponentRefPresenter.svelte'
import Components from './components/components/Components.svelte'
import ComponentTitlePresenter from './components/components/ComponentTitlePresenter.svelte'
import EditComponent from './components/components/EditComponent.svelte'
import IconPresenter from './components/components/IconComponent.svelte'
import LeadPresenter from './components/components/LeadPresenter.svelte'
import ProjectComponents from './components/components/ProjectComponents.svelte'
import CreateIssue from './components/CreateIssue.svelte'
import Inbox from './components/inbox/Inbox.svelte'
import AssigneeEditor from './components/issues/AssigneeEditor.svelte'
import DueDatePresenter from './components/issues/DueDatePresenter.svelte'
import EditIssue from './components/issues/edit/EditIssue.svelte'
import IssueItem from './components/issues/IssueItem.svelte'
import IssuePresenter from './components/issues/IssuePresenter.svelte'
import IssuePreview from './components/issues/IssuePreview.svelte'
import Issues from './components/issues/Issues.svelte'
import IssuesView from './components/issues/IssuesView.svelte'
import KanbanView from './components/issues/KanbanView.svelte'
import ModificationDatePresenter from './components/issues/ModificationDatePresenter.svelte'
import NotificationIssuePresenter from './components/issues/NotificationIssuePresenter.svelte'
import PriorityEditor from './components/issues/PriorityEditor.svelte'
import PriorityPresenter from './components/issues/PriorityPresenter.svelte'
import PriorityRefPresenter from './components/issues/PriorityRefPresenter.svelte'
import RelatedIssueSelector from './components/issues/related/RelatedIssueSelector.svelte'
import RelatedIssuesSection from './components/issues/related/RelatedIssuesSection.svelte'
import StatusEditor from './components/issues/StatusEditor.svelte'
import StatusPresenter from './components/issues/StatusPresenter.svelte'
import TitlePresenter from './components/issues/TitlePresenter.svelte'
import PriorityFilterValuePresenter from './components/issues/PriorityFilterValuePresenter.svelte'
import StatusFilterValuePresenter from './components/issues/StatusFilterValuePresenter.svelte'
import ProjectFilterValuePresenter from './components/projects/ProjectFilterValuePresenter.svelte'
import MyIssues from './components/myissues/MyIssues.svelte'
import NewIssueHeader from './components/NewIssueHeader.svelte'
import NopeComponent from './components/NopeComponent.svelte'
import RelationsPopup from './components/RelationsPopup.svelte'
import SetDueDateActionPopup from './components/SetDueDateActionPopup.svelte'
import SetParentIssueActionPopup from './components/SetParentIssueActionPopup.svelte'
import MilestoneDatePresenter from './components/milestones/MilestoneDatePresenter.svelte'
import EditMilestone from './components/milestones/EditMilestone.svelte'
import CreateIssueTemplate from './components/templates/CreateIssueTemplate.svelte'
import Statuses from './components/workflow/Statuses.svelte'

import {
  getIssueId,
  getIssueTitle,
  issueIdProvider,
  issueLinkFragmentProvider,
  issueLinkProvider,
  issueTitleProvider,
  resolveLocation
} from './issues'
import tracker from './plugin'

import MilestoneEditor from './components/milestones/MilestoneEditor.svelte'
import MilestonePresenter from './components/milestones/MilestonePresenter.svelte'
import Milestones from './components/milestones/Milestones.svelte'
import MilestoneSelector from './components/milestones/MilestoneSelector.svelte'
import MilestoneStatusPresenter from './components/milestones/MilestoneStatusPresenter.svelte'
import MilestoneStatusEditor from './components/milestones/MilestoneStatusEditor.svelte'
import MilestoneTitlePresenter from './components/milestones/MilestoneTitlePresenter.svelte'

import ScrumRecordPanel from './components/scrums/ScrumRecordPanel.svelte'
import Scrums from './components/scrums/Scrums.svelte'

import SubIssuesSelector from './components/issues/edit/SubIssuesSelector.svelte'
import EstimationEditor from './components/issues/timereport/EstimationEditor.svelte'
import ReportedTimeEditor from './components/issues/timereport/ReportedTimeEditor.svelte'
import TimeSpendReport from './components/issues/timereport/TimeSpendReport.svelte'

import RelatedIssues from './components/issues/related/RelatedIssues.svelte'
import RelatedIssueTemplates from './components/issues/related/RelatedIssueTemplates.svelte'

import ComponentSelector from './components/ComponentSelector.svelte'

import IssueTemplatePresenter from './components/templates/IssueTemplatePresenter.svelte'
import IssueTemplates from './components/templates/IssueTemplates.svelte'

import { deleteObject, deleteObjects } from '@hcengineering/view-resources'
import MoveAndDeleteMilestonePopup from './components/milestones/MoveAndDeleteMilestonePopup.svelte'
import EditIssueTemplate from './components/templates/EditIssueTemplate.svelte'
import TemplateEstimationEditor from './components/templates/EstimationEditor.svelte'
import {
  getAllComponents,
  getAllPriority,
  getAllMilestones,
  issuePrioritySort,
  issueStatusSort,
  moveIssuesToAnotherMilestone,
  milestoneSort,
  subIssueQuery,
  getVisibleFilters
} from './utils'

import { EmployeeAccount } from '@hcengineering/contact'
import PriorityIcon from './components/activity/PriorityIcon.svelte'
import StatusIcon from './components/activity/StatusIcon.svelte'
import TxIssueCreated from './components/activity/TxIssueCreated.svelte'
import DeleteComponentPresenter from './components/components/DeleteComponentPresenter.svelte'
import MoveIssues from './components/issues/Move.svelte'
import StatusRefPresenter from './components/issues/StatusRefPresenter.svelte'
import TimeSpendReportPopup from './components/issues/timereport/TimeSpendReportPopup.svelte'
import CreateProject from './components/projects/CreateProject.svelte'
import ProjectPresenter from './components/projects/ProjectPresenter.svelte'
import ProjectSpacePresenter from './components/projects/ProjectSpacePresenter.svelte'
import IssueStatistics from './components/milestones/IssueStatistics.svelte'
import MilestoneRefPresenter from './components/milestones/MilestoneRefPresenter.svelte'
import MilestoneFilter from './components/milestones/MilestoneFilter.svelte'
import { ComponentAggregationManager, grouppingComponentManager } from './component'

export { default as SubIssueList } from './components/issues/edit/SubIssueList.svelte'

export async function queryIssue<D extends Issue> (
  _class: Ref<Class<D>>,
  client: Client,
  search: string,
  filter?: { in?: RelatedDocument[], nin?: RelatedDocument[] }
): Promise<ObjectSearchResult[]> {
  const projects = await client.findAll<Project>(tracker.class.Project, {})

  const q: DocumentQuery<Issue> = { title: { $like: `%${search}%` } }
  if (filter?.in !== undefined || filter?.nin !== undefined) {
    q._id = {}
    if (filter.in !== undefined) {
      q._id.$in = filter.in?.map((it) => it._id as Ref<Issue>)
    }
    if (filter.nin !== undefined) {
      q._id.$nin = filter.nin?.map((it) => it._id as Ref<Issue>)
    }
  }

  const named = toIdMap(
    await client.findAll<Issue>(_class, q, {
      limit: 200,
      lookup: { space: tracker.class.Project }
    })
  )
  for (const currentProject of projects) {
    const nids: number[] = []
    for (let n = 0; n <= currentProject.sequence; n++) {
      const v = `${currentProject.identifier}-${n}`
      if (v.includes(search)) {
        nids.push(n)
      }
    }
    if (nids.length > 0) {
      const q2: DocumentQuery<Issue> = { number: { $in: nids } }
      if (q._id !== undefined) {
        q2._id = q._id
      }
      const numbered = await client.findAll<Issue>(_class, q2, { limit: 200, lookup: { space: tracker.class.Project } })
      for (const d of numbered) {
        const shortId = `${projects.find((it) => it._id === d.space)?.identifier ?? ''}-${d.number}`
        if (shortId.includes(search) || d.title.includes(search)) {
          if (!named.has(d._id)) {
            named.set(d._id, d)
          }
        }
      }
    }
  }

  return Array.from(named.values()).map((e) => ({
    doc: e,
    title: getIssueId(e.$lookup?.space as Project, e),
    icon: tracker.icon.TrackerApplication,
    component: IssueItem
  }))
}

async function move (issues: Issue | Issue[]): Promise<void> {
  showPopup(MoveIssues, { selected: issues })
}

async function editWorkflowStatuses (project: Project | undefined): Promise<void> {
  if (project !== undefined) {
    showPopup(Statuses, { projectId: project._id, projectClass: project._class }, 'float')
  }
}

async function editProject (project: Project | undefined): Promise<void> {
  if (project !== undefined) {
    showPopup(CreateProject, { project })
  }
}

async function deleteIssue (issue: Issue | Issue[]): Promise<void> {
  const issueCount = Array.isArray(issue) ? issue.length : 1
  let subissues: number = 0
  if (Array.isArray(issue)) {
    issue.forEach((it) => {
      subissues += it.subIssues
    })
  } else {
    subissues = issue.subIssues
  }
  showPopup(
    MessageBox,
    {
      label: tracker.string.DeleteIssue,
      labelProps: { issueCount },
      message: tracker.string.DeleteIssueConfirm,
      params: {
        issueCount,
        subIssueCount: subissues
      }
    },
    undefined,
    async (result?: boolean) => {
      if (result === true) {
        const objs = Array.isArray(issue) ? issue : [issue]
        await deleteObjects(getClient(), objs as unknown as Doc[]).catch((err) => console.error(err))
      }
    }
  )
}

async function deleteProject (project: Project | undefined): Promise<void> {
  if (project !== undefined) {
    const client = getClient()
    const anyIssue = await client.findOne(tracker.class.Issue, { space: project._id })
    if (anyIssue !== undefined) {
      showPopup(
        MessageBox,
        {
          label: tracker.string.ArchiveProjectName,
          labelProps: { name: project.name },
          message: tracker.string.ProjectHasIssues
        },
        undefined,
        (result?: boolean) => {
          if (result === true) {
            void client.update(project, { archived: true })
          }
        }
      )
    } else {
      showPopup(
        MessageBox,
        {
          label: tracker.string.ArchiveProjectName,
          labelProps: { name: project.name },
          message: tracker.string.ArchiveProjectConfirm
        },
        undefined,
        (result?: boolean) => {
          if (result === true) {
            void client.update(project, { archived: true })
          }
        }
      )
    }
  }
}

async function moveAndDeleteMilestones (
  client: TxOperations,
  oldMilestones: Milestone[],
  newMilestone?: Milestone
): Promise<void> {
  const noMilestoneLabel = await translate(tracker.string.NoMilestone, {})

  showPopup(
    MessageBox,
    {
      label: tracker.string.MoveAndDeleteMilestone,
      message: tracker.string.MoveAndDeleteMilestoneConfirm,
      labelProps: {
        newMilestone: newMilestone?.label ?? noMilestoneLabel,
        deleteMilestone: oldMilestones.map((p) => p.label)
      }
    },
    undefined,
    (result?: boolean) => {
      if (result === true) {
        for (const oldMilestone of oldMilestones) {
          void moveIssuesToAnotherMilestone(client, oldMilestone, newMilestone).then((succes) => {
            if (succes) {
              void deleteObject(client, oldMilestone)
            }
          })
        }
      }
    }
  )
}

async function deleteMilestone (milestones: Milestone | Milestone[]): Promise<void> {
  const client = getClient()
  const milestoneArray = Array.isArray(milestones) ? milestones : [milestones]
  // Check if available to move issues to another milestone
  const firstSearchedMilestone = await client.findOne(tracker.class.Milestone, {
    _id: { $nin: milestoneArray.map((p) => p._id) }
  })
  if (firstSearchedMilestone !== undefined) {
    showPopup(
      MoveAndDeleteMilestonePopup,
      {
        milestones: milestoneArray,
        moveAndDeleteMilestone: async (selectedMilestone?: Milestone) =>
          await moveAndDeleteMilestones(client, milestoneArray, selectedMilestone)
      },
      'top'
    )
  } else {
    await moveAndDeleteMilestones(client, milestoneArray)
  }
}

async function startRecordingScrum (
  client: TxOperations,
  newRecordingScrum: Scrum,
  previousScrumRecord?: ScrumRecord
): Promise<void> {
  const newRecordLabel = `${newRecordingScrum.title}-${newRecordingScrum.scrumRecords ?? 0}`
  const startRecord = async (): Promise<void> => {
    await client.addCollection(
      tracker.class.ScrumRecord,
      newRecordingScrum.space,
      newRecordingScrum._id,
      tracker.class.Scrum,
      'scrumRecords',
      {
        label: newRecordLabel,
        scrumRecorder: getCurrentAccount()._id as Ref<EmployeeAccount>,
        startTs: Date.now(),
        comments: 0
      }
    )
  }

  if (previousScrumRecord !== undefined) {
    showPopup(
      MessageBox,
      {
        label: tracker.string.ChangeScrumRecord,
        message: tracker.string.ChangeScrumRecordConfirm,
        params: { previousRecord: previousScrumRecord.label, newRecord: newRecordLabel }
      },
      undefined,
      (result?: boolean) => {
        if (result === true) {
          void client
            .updateCollection(
              tracker.class.ScrumRecord,
              previousScrumRecord.space,
              previousScrumRecord._id,
              previousScrumRecord.attachedTo,
              tracker.class.Scrum,
              'scrumRecords',
              { endTs: Date.now() }
            )
            .then(async () => await startRecord())
        }
      }
    )
  } else {
    await startRecord()
  }
}

export async function handleRecordingScrum (
  client: TxOperations,
  currentScrum: Scrum,
  activeScrumRecord?: ScrumRecord
): Promise<void> {
  // Stop recording scrum if active record attached to current scrum
  if (activeScrumRecord?.attachedTo === currentScrum._id) {
    await client.updateCollection(
      tracker.class.ScrumRecord,
      activeScrumRecord.space,
      activeScrumRecord._id,
      activeScrumRecord.attachedTo,
      tracker.class.Scrum,
      'scrumRecords',
      { endTs: Date.now() }
    )
  } else {
    await startRecordingScrum(client, currentScrum, activeScrumRecord)
  }
}

export default async (): Promise<Resources> => ({
  activity: {
    TxIssueCreated,
    PriorityIcon,
    StatusIcon
  },
  component: {
    NopeComponent,
    Issues,
    Inbox,
    MyIssues,
    Components,
    IssuePresenter,
    ComponentPresenter,
    ComponentRefPresenter,
    ComponentTitlePresenter,
    TitlePresenter,
    ModificationDatePresenter,
    PriorityPresenter,
    PriorityEditor,
    PriorityRefPresenter,
    MilestoneRefPresenter,
    ComponentEditor,
    StatusPresenter,
    StatusEditor,
    AssigneeEditor,
    DueDatePresenter,
    EditIssue,
    NewIssueHeader,
    IconPresenter,
    LeadPresenter,
    SetDueDateActionPopup,
    SetParentIssueActionPopup,
    EditComponent,
    IssuesView,
    KanbanView,
    ProjectComponents,
    IssuePreview,
    RelationsPopup,
    CreateIssue,
    CreateIssueTemplate,
    Milestones,
    MilestonePresenter,
    EditMilestone,
    Scrums,
    ScrumRecordPanel,
    MilestoneStatusPresenter,
    MilestoneStatusEditor,
    MilestoneTitlePresenter,
    MilestoneSelector,
    MilestoneEditor,
    ReportedTimeEditor,
    TimeSpendReport,
    EstimationEditor,
    SubIssuesSelector,
    RelatedIssues,
    RelatedIssueTemplates,
    ComponentSelector,
    IssueTemplates,
    IssueTemplatePresenter,
    EditIssueTemplate,
    TemplateEstimationEditor,
    CreateProject,
    ProjectPresenter,
    ProjectSpacePresenter,
    IssueStatistics,
    StatusRefPresenter,
    RelatedIssuesSection,
    RelatedIssueSelector,
    DeleteComponentPresenter,
    TimeSpendReportPopup,
    MilestoneDatePresenter,
    NotificationIssuePresenter,
    MilestoneFilter,
    PriorityFilterValuePresenter,
    StatusFilterValuePresenter,
    ProjectFilterValuePresenter
  },
  completion: {
    IssueQuery: async (client: Client, query: string, filter?: { in?: RelatedDocument[], nin?: RelatedDocument[] }) =>
      await queryIssue(tracker.class.Issue, client, query, filter)
  },
  function: {
    IssueTitleProvider: getIssueTitle,
    GetIssueId: issueIdProvider,
    GetIssueLink: issueLinkProvider,
    GetIssueLinkFragment: issueLinkFragmentProvider,
    GetIssueTitle: issueTitleProvider,
    IssueStatusSort: issueStatusSort,
    IssuePrioritySort: issuePrioritySort,
    MilestoneSort: milestoneSort,
    SubIssueQuery: subIssueQuery,
    GetAllPriority: getAllPriority,
    GetAllComponents: getAllComponents,
    GetAllMilestones: getAllMilestones,
    GetVisibleFilters: getVisibleFilters
  },
  actionImpl: {
    Move: move,
    EditWorkflowStatuses: editWorkflowStatuses,
    EditProject: editProject,
    DeleteMilestone: deleteMilestone,
    DeleteProject: deleteProject,
    DeleteIssue: deleteIssue
  },
  resolver: {
    Location: resolveLocation
  },
  aggregation: {
    CreateComponentAggregationManager: ComponentAggregationManager.create,
    GrouppingComponentManager: grouppingComponentManager
  }
})
