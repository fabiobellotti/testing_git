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
import { Client, Doc, Ref } from '@hcengineering/core'
import type { Asset, IntlString, Metadata, Resource } from '@hcengineering/platform'
import { mergeIds } from '@hcengineering/platform'
import { IssueDraft } from '@hcengineering/tracker'
import { AnyComponent, Location } from '@hcengineering/ui'
import { GetAllValuesFunc, SortFunc, Viewlet, ViewletDescriptor, ViewQueryAction } from '@hcengineering/view'
import tracker, { trackerId } from '../../tracker/lib'

export default mergeIds(trackerId, tracker, {
  viewlet: {
    SubIssues: '' as Ref<Viewlet>,
    List: '' as Ref<ViewletDescriptor>,
    Kanban: '' as Ref<ViewletDescriptor>,
    Timeline: '' as Ref<ViewletDescriptor>
  },
  string: {
    More: '' as IntlString,
    Delete: '' as IntlString,
    Open: '' as IntlString,
    Default: '' as IntlString,
    MakeDefault: '' as IntlString,
    Members: '' as IntlString,
    Inbox: '' as IntlString,
    MyIssues: '' as IntlString,
    ViewIssue: '' as IntlString,
    IssueCreated: '' as IntlString,
    Issues: '' as IntlString,
    Views: '' as IntlString,
    Active: '' as IntlString,
    AllIssues: '' as IntlString,
    ActiveIssues: '' as IntlString,
    BacklogIssues: '' as IntlString,
    Backlog: '' as IntlString,
    Board: '' as IntlString,
    Component: '' as IntlString,
    Components: '' as IntlString,
    AllComponents: '' as IntlString,
    BacklogComponents: '' as IntlString,
    ActiveComponents: '' as IntlString,
    ClosedComponents: '' as IntlString,
    NewComponent: '' as IntlString,
    CreateComponent: '' as IntlString,
    ComponentNamePlaceholder: '' as IntlString,
    ComponentDescriptionPlaceholder: '' as IntlString,
    ComponentStatusPlaceholder: '' as IntlString,
    ComponentLead: '' as IntlString,
    ComponentMembers: '' as IntlString,
    StartDate: '' as IntlString,
    TargetDate: '' as IntlString,
    Planned: '' as IntlString,
    InProgress: '' as IntlString,
    Paused: '' as IntlString,
    Completed: '' as IntlString,
    Canceled: '' as IntlString,
    CreateProject: '' as IntlString,
    NewProject: '' as IntlString,
    ProjectTitlePlaceholder: '' as IntlString,
    ProjectIdentifierPlaceholder: '' as IntlString,
    ChooseIcon: '' as IntlString,
    AddIssue: '' as IntlString,
    NewIssue: '' as IntlString,
    ResumeDraft: '' as IntlString,
    NewSubIssue: '' as IntlString,
    Project: '' as IntlString,
    SelectIssue: '' as IntlString,
    SelectProject: '' as IntlString,
    SaveIssue: '' as IntlString,
    Todo: '' as IntlString,
    Done: '' as IntlString,
    SetPriority: '' as IntlString,
    SetStatus: '' as IntlString,
    Priority: '' as IntlString,
    NoPriority: '' as IntlString,
    Urgent: '' as IntlString,
    High: '' as IntlString,
    Medium: '' as IntlString,
    Low: '' as IntlString,
    Title: '' as IntlString,
    Identifier: '' as IntlString,
    IdentifierExists: '' as IntlString,
    Description: '' as IntlString,
    Status: '' as IntlString,
    DefaultIssueStatus: '' as IntlString,
    IssueStatuses: '' as IntlString,
    EditWorkflowStatuses: '' as IntlString,
    EditProject: '' as IntlString,
    DeleteProject: '' as IntlString,
    ArchiveProjectName: '' as IntlString,
    ArchiveProjectConfirm: '' as IntlString,
    ProjectHasIssues: '' as IntlString,
    ManageWorkflowStatuses: '' as IntlString,
    AddWorkflowStatus: '' as IntlString,
    EditWorkflowStatus: '' as IntlString,
    DeleteWorkflowStatus: '' as IntlString,
    DeleteWorkflowStatusConfirm: '' as IntlString,
    DeleteWorkflowStatusErrorDescription: '' as IntlString,
    Name: '' as IntlString,
    StatusCategory: '' as IntlString,
    CategoryBacklog: '' as IntlString,
    CategoryUnstarted: '' as IntlString,
    CategoryStarted: '' as IntlString,
    CategoryCompleted: '' as IntlString,
    CategoryCanceled: '' as IntlString,
    Number: '' as IntlString,
    Assignee: '' as IntlString,
    AssignTo: '' as IntlString,
    AssignedTo: '' as IntlString,
    SubIssues: '' as IntlString,
    SubIssuesList: '' as IntlString,
    SetParent: '' as IntlString,
    ChangeParent: '' as IntlString,
    RemoveParent: '' as IntlString,
    OpenParent: '' as IntlString,
    OpenSubIssues: '' as IntlString,
    AddSubIssues: '' as IntlString,
    BlockedBy: '' as IntlString,
    RelatedTo: '' as IntlString,
    Comments: '' as IntlString,
    Attachments: '' as IntlString,
    Labels: '' as IntlString,
    Space: '' as IntlString,
    SetDueDate: '' as IntlString,
    ChangeDueDate: '' as IntlString,
    ModificationDate: '' as IntlString,
    Issue: '' as IntlString,
    IssueTemplate: '' as IntlString,
    Document: '' as IntlString,
    DocumentIcon: '' as IntlString,
    DocumentColor: '' as IntlString,
    Rank: '' as IntlString,
    Grouping: '' as IntlString,
    Ordering: '' as IntlString,
    CompletedIssues: '' as IntlString,
    NoGrouping: '' as IntlString,
    NoAssignee: '' as IntlString,
    LastUpdated: '' as IntlString,
    DueDate: '' as IntlString,
    Manual: '' as IntlString,
    All: '' as IntlString,
    PastWeek: '' as IntlString,
    PastMonth: '' as IntlString,
    Filter: '' as IntlString,
    ClearFilters: '' as IntlString,
    Back: '' as IntlString,
    AssetLabel: '' as IntlString,
    AddToComponent: '' as IntlString,
    MoveToComponent: '' as IntlString,
    NoComponent: '' as IntlString,
    ComponentLeadTitle: '' as IntlString,
    ComponentMembersTitle: '' as IntlString,
    ComponentLeadSearchPlaceholder: '' as IntlString,
    ComponentMembersSearchPlaceholder: '' as IntlString,
    List: '' as IntlString,
    NumberLabels: '' as IntlString,
    MoveToProject: '' as IntlString,
    Duplicate: '' as IntlString,
    MoveIssues: '' as IntlString,
    MoveIssuesDescription: '' as IntlString,

    TypeIssuePriority: '' as IntlString,
    IssueTitlePlaceholder: '' as IntlString,
    SubIssueTitlePlaceholder: '' as IntlString,
    IssueDescriptionPlaceholder: '' as IntlString,
    SubIssueDescriptionPlaceholder: '' as IntlString,
    Unassigned: '' as IntlString,
    AddIssueTooltip: '' as IntlString,
    NewIssueDialogClose: '' as IntlString,
    NewIssueDialogCloseNote: '' as IntlString,

    RemoveComponentDialogClose: '' as IntlString,
    RemoveComponentDialogCloseNote: '' as IntlString,

    CopyIssueUrl: '' as IntlString,
    CopyIssueId: '' as IntlString,
    CopyIssueBranch: '' as IntlString,
    CopyIssueTitle: '' as IntlString,

    FilterIs: '' as IntlString,
    FilterIsNot: '' as IntlString,
    FilterIsEither: '' as IntlString,
    FilterStatesCount: '' as IntlString,

    EditIssue: '' as IntlString,

    Save: '' as IntlString,
    IncludeItemsThatMatch: '' as IntlString,
    AnyFilter: '' as IntlString,
    AllFilters: '' as IntlString,
    NoDescription: '' as IntlString,

    Assigned: '' as IntlString,
    Created: '' as IntlString,
    Subscribed: '' as IntlString,

    Relations: '' as IntlString,
    RemoveRelation: '' as IntlString,
    AddBlockedBy: '' as IntlString,
    AddIsBlocking: '' as IntlString,
    AddRelatedIssue: '' as IntlString,
    RelatedIssuesNotFound: '' as IntlString,
    RelatedIssue: '' as IntlString,
    BlockedIssue: '' as IntlString,
    BlockingIssue: '' as IntlString,
    BlockedBySearchPlaceholder: '' as IntlString,
    IsBlockingSearchPlaceholder: '' as IntlString,
    RelatedIssueSearchPlaceholder: '' as IntlString,
    Blocks: '' as IntlString,
    Related: '' as IntlString,

    DurMinutes: '' as IntlString,
    DurHours: '' as IntlString,
    DurDays: '' as IntlString,
    DurMonths: '' as IntlString,
    DurYears: '' as IntlString,
    StatusHistory: '' as IntlString,
    AddLabel: '' as IntlString,

    Milestone: '' as IntlString,
    Milestones: '' as IntlString,
    AllMilestones: '' as IntlString,
    PlannedMilestones: '' as IntlString,
    ActiveMilestones: '' as IntlString,
    ClosedMilestones: '' as IntlString,
    MilestoneNamePlaceholder: '' as IntlString,
    MilestoneLead: '' as IntlString,
    MilestoneLeadTitle: '' as IntlString,
    MilestoneLeadSearchPlaceholder: '' as IntlString,
    MilestoneMembersTitle: '' as IntlString,
    MilestoneMembersSearchPlaceholder: '' as IntlString,

    NewMilestone: '' as IntlString,
    CreateMilestone: '' as IntlString,
    AddToMilestone: '' as IntlString,
    MoveToMilestone: '' as IntlString,
    NoMilestone: '' as IntlString,

    MoveAndDeleteMilestone: '' as IntlString,
    MoveAndDeleteMilestoneConfirm: '' as IntlString,

    Scrum: '' as IntlString,
    Scrums: '' as IntlString,
    ScrumMembersTitle: '' as IntlString,
    ScrumMembersSearchPlaceholder: '' as IntlString,
    ScrumBeginTime: '' as IntlString,
    ScrumEndTime: '' as IntlString,
    NewScrum: '' as IntlString,
    CreateScrum: '' as IntlString,
    ScrumTitlePlaceholder: '' as IntlString,
    ScrumDescriptionPlaceholder: '' as IntlString,
    ScrumRecords: '' as IntlString,
    ScrumRecord: '' as IntlString,
    StartRecord: '' as IntlString,
    StopRecord: '' as IntlString,
    ChangeScrumRecord: '' as IntlString,
    ChangeScrumRecordConfirm: '' as IntlString,
    ScrumRecorder: '' as IntlString,
    ScrumRecordTimeReports: '' as IntlString,
    ScrumRecordObjects: '' as IntlString,

    Estimation: '' as IntlString,
    ReportedTime: '' as IntlString,
    TimeSpendReport: '' as IntlString,
    TimeSpendReportAdd: '' as IntlString,
    TimeSpendReports: '' as IntlString,
    TimeSpendReportDate: '' as IntlString,
    TimeSpendReportValue: '' as IntlString,
    TimeSpendReportDescription: '' as IntlString,
    TimeSpendValue: '' as IntlString,
    TimeSpendHours: '' as IntlString,
    MilestonePassed: '' as IntlString,

    ChildEstimation: '' as IntlString,
    ChildReportedTime: '' as IntlString,
    Capacity: '' as IntlString,
    CapacityValue: '' as IntlString,
    AddedReference: '' as IntlString,
    AddedAsBlocked: '' as IntlString,
    AddedAsBlocking: '' as IntlString,

    IssueTemplates: '' as IntlString,
    NewProcess: '' as IntlString,
    SaveProcess: '' as IntlString,
    NoIssueTemplate: '' as IntlString,
    TemplateReplace: '' as IntlString,
    TemplateReplaceConfirm: '' as IntlString,

    CurrentWorkDay: '' as IntlString,
    PreviousWorkDay: '' as IntlString,
    TimeReportDayTypeLabel: '' as IntlString,
    DefaultTimeReportDay: '' as IntlString,
    DefaultAssignee: '' as IntlString,

    SevenHoursLength: '' as IntlString,
    EightHoursLength: '' as IntlString,
    HourLabel: '' as IntlString,
    Saved: '' as IntlString,
    CreatedIssue: '' as IntlString,
    CreatedSubIssue: '' as IntlString,

    ProjectColor: '' as IntlString,

    ProjectIconCategory: '' as IntlString,
    ProjectEmojiiCategory: '' as IntlString
  },
  component: {
    NopeComponent: '' as AnyComponent,
    Inbox: '' as AnyComponent,
    MyIssues: '' as AnyComponent,
    Views: '' as AnyComponent,
    Issues: '' as AnyComponent,
    Active: '' as AnyComponent,
    Backlog: '' as AnyComponent,
    Components: '' as AnyComponent,
    ComponentsTimeline: '' as AnyComponent,
    IssuePresenter: '' as AnyComponent,
    ComponentTitlePresenter: '' as AnyComponent,
    ComponentPresenter: '' as AnyComponent,
    TitlePresenter: '' as AnyComponent,
    ModificationDatePresenter: '' as AnyComponent,
    PriorityPresenter: '' as AnyComponent,
    PriorityEditor: '' as AnyComponent,
    PriorityRefPresenter: '' as AnyComponent,
    ComponentEditor: '' as AnyComponent,
    MilestoneEditor: '' as AnyComponent,
    StatusPresenter: '' as AnyComponent,
    StatusRefPresenter: '' as AnyComponent,
    StatusEditor: '' as AnyComponent,
    AssigneePresenter: '' as AnyComponent,
    DueDatePresenter: '' as AnyComponent,
    EditIssueTemplate: '' as AnyComponent,
    CreateProject: '' as AnyComponent,
    ProjectSpacePresenter: '' as AnyComponent,
    ProjectPresenter: '' as AnyComponent,
    NewIssueHeader: '' as AnyComponent,
    IconPresenter: '' as AnyComponent,
    LeadPresenter: '' as AnyComponent,
    TargetDatePresenter: '' as AnyComponent,
    ComponentStatusPresenter: '' as AnyComponent,
    ComponentStatusEditor: '' as AnyComponent,
    SetDueDateActionPopup: '' as AnyComponent,
    SetParentIssueActionPopup: '' as AnyComponent,
    EditComponent: '' as AnyComponent,
    IssuesView: '' as AnyComponent,
    KanbanView: '' as AnyComponent,
    ProjectComponents: '' as AnyComponent,
    IssuePreview: '' as AnyComponent,
    RelationsPopup: '' as AnyComponent,
    MilestoneRefPresenter: '' as AnyComponent,
    Milestones: '' as AnyComponent,
    MilestonePresenter: '' as AnyComponent,
    MilestoneStatusPresenter: '' as AnyComponent,
    MilestoneTitlePresenter: '' as AnyComponent,
    MilestoneDatePresenter: '' as AnyComponent,
    MilestoneLeadPresenter: '' as AnyComponent,
    ReportedTimeEditor: '' as AnyComponent,
    TimeSpendReport: '' as AnyComponent,
    EstimationEditor: '' as AnyComponent,
    TemplateEstimationEditor: '' as AnyComponent,
    DeleteComponentPresenter: '' as AnyComponent,

    Scrums: '' as AnyComponent,
    ScrumRecordPanel: '' as AnyComponent,

    ComponentSelector: '' as AnyComponent,

    IssueTemplates: '' as AnyComponent,
    IssueTemplatePresenter: '' as AnyComponent,
    SubIssuesSelector: '' as AnyComponent,
    IconWithEmojii: '' as Asset
  },
  metadata: {
    CreateIssueDraft: '' as Metadata<IssueDraft>
  },
  function: {
    IssueTitleProvider: '' as Resource<(client: Client, ref: Ref<Doc>) => Promise<string>>,
    GetIssueId: '' as Resource<(doc: Doc, props: Record<string, any>) => Promise<string>>,
    GetIssueLink: '' as Resource<(doc: Doc, props: Record<string, any>) => Promise<string>>,
    GetIssueLinkFragment: '' as Resource<(doc: Doc, props: Record<string, any>) => Promise<Location>>,
    GetIssueTitle: '' as Resource<(doc: Doc, props: Record<string, any>) => Promise<string>>,
    IssueStatusSort: '' as SortFunc,
    IssuePrioritySort: '' as SortFunc,
    MilestoneSort: '' as SortFunc,
    SubIssueQuery: '' as ViewQueryAction,
    GetAllPriority: '' as GetAllValuesFunc,
    GetAllComponents: '' as GetAllValuesFunc,
    GetAllMilestones: '' as GetAllValuesFunc
  }
})
