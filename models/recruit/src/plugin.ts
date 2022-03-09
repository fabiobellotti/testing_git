//
// Copyright © 2020 Anticrm Platform Contributors.
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

import type { Client, Doc, Ref } from '@anticrm/core'
import type { IntlString, Resource, Status } from '@anticrm/platform'
import { mergeIds } from '@anticrm/platform'
import { recruitId } from '@anticrm/recruit'
import recruit from '@anticrm/recruit-resources/src/plugin'
import { KanbanTemplate } from '@anticrm/task'
import type { AnyComponent } from '@anticrm/ui'
import type { Action } from '@anticrm/view'
import { ObjectSearchFactory, ObjectSearchCategory } from '@anticrm/model-presentation'

export default mergeIds(recruitId, recruit, {
  action: {
    CreateApplication: '' as Ref<Action>,
    EditVacancy: '' as Ref<Action>,
    CreateReview: '' as Ref<Action>
  },
  actionImpl: {
    CreateApplication: '' as Resource<(object: Doc) => Promise<void>>,
    EditVacancy: '' as Resource<(object: Doc) => Promise<void>>,
    CreateReview: '' as Resource<(object: Doc) => Promise<void>>
  },
  string: {
    ApplicationShort: '' as IntlString,
    ApplicationsShort: '' as IntlString,
    RecruitApplication: '' as IntlString,
    CandidatePools: '' as IntlString,
    SearchApplication: '' as IntlString,
    Application: '' as IntlString,
    AssignedRecruiter: '' as IntlString,
    FullDescription: '' as IntlString,
    Due: '' as IntlString,
    Source: '' as IntlString,
    ManageVacancyStatuses: '' as IntlString,
    EditVacancy: '' as IntlString
  },
  validator: {
    ApplicantValidator: '' as Resource<<T extends Doc>(doc: T, client: Client) => Promise<Status>>,
    ReviewValidator: '' as Resource<<T extends Doc>(doc: T, client: Client) => Promise<Status>>
  },
  component: {
    CreateVacancy: '' as AnyComponent,
    CreateApplication: '' as AnyComponent,
    KanbanCard: '' as AnyComponent,
    ApplicationPresenter: '' as AnyComponent,
    ApplicationsPresenter: '' as AnyComponent,
    VacancyPresenter: '' as AnyComponent,
    EditApplication: '' as AnyComponent,
    TemplatesIcon: '' as AnyComponent,
    Applications: '' as AnyComponent,
    Candidates: '' as AnyComponent,
    CreateCandidate: '' as AnyComponent,
    SkillsView: '' as AnyComponent,
    Vacancies: '' as AnyComponent,

    CreateReviewCategory: '' as AnyComponent,
    EditReviewCategory: '' as AnyComponent,
    CreateReview: '' as AnyComponent,
    Reviews: '' as AnyComponent,
    KanbanReviewCard: '' as AnyComponent,
    EditReview: '' as AnyComponent,
    ReviewPresenter: '' as AnyComponent,
    Opinions: '' as AnyComponent,
    OpinionPresenter: '' as AnyComponent
  },
  template: {
    DefaultVacancy: '' as Ref<KanbanTemplate>,

    Interview: '' as Ref<KanbanTemplate>,
    Task: '' as Ref<KanbanTemplate>
  },
  completion: {
    ApplicationQuery: '' as Resource<ObjectSearchFactory>,
    ApplicationCategory: '' as Ref<ObjectSearchCategory>
  }
})
