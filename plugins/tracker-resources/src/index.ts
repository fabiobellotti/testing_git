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

import { Resources } from '@anticrm/platform'

import NopeComponent from './components/NopeComponent.svelte'

import Active from './components/issues/Active.svelte'
import Backlog from './components/issues/Backlog.svelte'
import Board from './components/issues/Board.svelte'
import Inbox from './components/inbox/Inbox.svelte'
import Issues from './components/issues/Issues.svelte'
import MyIssues from './components/myissues/MyIssues.svelte'
import Projects from './components/projects/Projects.svelte'
import ProjectPresenter from './components/projects/ProjectPresenter.svelte'
import Views from './components/views/Views.svelte'
import IssuePresenter from './components/issues/IssuePresenter.svelte'
import TitlePresenter from './components/issues/TitlePresenter.svelte'
import PriorityPresenter from './components/issues/PriorityPresenter.svelte'
import PriorityEditor from './components/issues/PriorityEditor.svelte'
import StatusPresenter from './components/issues/StatusPresenter.svelte'
import DueDatePresenter from './components/issues/DueDatePresenter.svelte'
import AssigneePresenter from './components/issues/AssigneePresenter.svelte'
import ViewOptionsPopup from './components/issues/ViewOptionsPopup.svelte'

import ModificationDatePresenter from './components/issues/ModificationDatePresenter.svelte'
import EditIssue from './components/issues/EditIssue.svelte'
import NewIssueHeader from './components/NewIssueHeader.svelte'

export default async (): Promise<Resources> => ({
  component: {
    NopeComponent,
    Active,
    Backlog,
    Board,
    Inbox,
    Issues,
    MyIssues,
    Projects,
    Views,
    IssuePresenter,
    ProjectPresenter,
    TitlePresenter,
    ModificationDatePresenter,
    PriorityPresenter,
    PriorityEditor,
    StatusPresenter,
    AssigneePresenter,
    DueDatePresenter,
    EditIssue,
    NewIssueHeader,
    ViewOptionsPopup
  }
})
