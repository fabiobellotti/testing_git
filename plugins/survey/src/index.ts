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

import type { IntlString, Plugin } from '@hcengineering/platform'
import type { Class, Mixin, Ref, Type } from '@hcengineering/core'
import { Asset, plugin } from '@hcengineering/platform'
import {
  Answer,
  AnswerDataOf,
  AssessmentData,
  Fraction,
  MultipleChoiceAnswerData,
  MultipleChoiceAssessmentData,
  MultipleChoiceQuestion,
  Question,
  QuestionType,
  QuestionOption,
  Rank,
  ReorderAnswerData,
  ReorderAssessmentData,
  ReorderQuestion,
  SingleChoiceAnswerData,
  SingleChoiceAssessmentData,
  SingleChoiceQuestion,
  Survey,
  SurveyResult
} from './types'
import { type Action, ActionCategory } from '@hcengineering/view'

export * from './types'

/**
 * @public
 */
export const surveyId = 'survey' as Plugin

/**
 * @public
 */
export default plugin(surveyId, {
  class: {
    Answer: '' as Ref<Class<Answer<any>>>,
    MultipleChoiceQuestion: '' as Ref<Class<MultipleChoiceQuestion>>,
    Question: '' as Ref<Class<Question>>,
    ReorderQuestion: '' as Ref<Class<ReorderQuestion>>,
    SingleChoiceQuestion: '' as Ref<Class<SingleChoiceQuestion>>,
    Survey: '' as Ref<Class<Survey>>,
    SurveyResult: '' as Ref<Class<SurveyResult>>,
    TypeAnswerData: '' as Ref<Class<Type<AnswerDataOf<any>>>>,
    TypeAssessmentData: '' as Ref<Class<Type<AssessmentData>>>,
    TypeFraction: '' as Ref<Class<Type<Fraction>>>,
    TypeMultipleChoiceAnswerData: '' as Ref<Class<Type<MultipleChoiceAnswerData>>>,
    TypeMultipleChoiceAssessmentData: '' as Ref<Class<Type<MultipleChoiceAssessmentData>>>,
    TypeQuestionOption: '' as Ref<Class<Type<QuestionOption>>>,
    TypeRank: '' as Ref<Class<Type<Rank>>>,
    TypeReorderAnswerData: '' as Ref<Class<Type<ReorderAnswerData>>>,
    TypeReorderAssessmentData: '' as Ref<Class<Type<ReorderAssessmentData>>>,
    TypeSingleChoiceAnswerData: '' as Ref<Class<Type<SingleChoiceAnswerData>>>,
    TypeSingleChoiceAssessmentData: '' as Ref<Class<Type<SingleChoiceAssessmentData>>>
  },
  category: {
    Survey: '' as Ref<ActionCategory>
  },
  action: {
    SurveyPublish: '' as Ref<Action<Survey>>,
    SurveyTake: '' as Ref<Action<Survey>>,
    SurveyUnpublish: '' as Ref<Action<Survey>>
  },
  mixin: {
    QuestionType: '' as Ref<Mixin<QuestionType>>
  },
  string: {
    Answer: '' as IntlString,
    Answers: '' as IntlString,
    Assessment: '' as IntlString,
    Assignee: '' as IntlString,
    ConfigDescription: '' as IntlString,
    ConfigLabel: '' as IntlString,
    CorrectAnswer: '' as IntlString,
    MultipleChoice: '' as IntlString,
    Inbox: '' as IntlString,
    Option: '' as IntlString,
    Options: '' as IntlString,
    Outbox: '' as IntlString,
    Question: '' as IntlString,
    QuestionText: '' as IntlString,
    QuestionWeight: '' as IntlString,
    Questions: '' as IntlString,
    Rank: '' as IntlString,
    Reorder: '' as IntlString,
    Score: '' as IntlString,
    Shuffle: '' as IntlString,
    SingleChoice: '' as IntlString,
    SubmittedBy: '' as IntlString,
    SubmittedOn: '' as IntlString,
    Survey: '' as IntlString,
    Surveys: '' as IntlString,
    SurveyApplication: '' as IntlString,
    SurveyCreate: '' as IntlString,
    SurveyName: '' as IntlString,
    SurveyPublish: '' as IntlString,
    SurveyResult: '' as IntlString,
    SurveyResults: '' as IntlString,
    SurveyTake: '' as IntlString,
    SurveyUnpublish: '' as IntlString,
    TypeFraction: '' as IntlString,
    TypeRank: '' as IntlString
  },
  icon: {
    Checkbox: '' as Asset,
    Drag: '' as Asset,
    Eye: '' as Asset,
    Inbox: '' as Asset,
    Outbox: '' as Asset,
    Question: '' as Asset,
    RadioButton: '' as Asset,
    Survey: '' as Asset,
    SurveyApplication: '' as Asset,
    SurveyResult: '' as Asset
  }
})
