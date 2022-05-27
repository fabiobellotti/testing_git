//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
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

import { Employee } from '@anticrm/contact'
import type { Class, Doc, Markup, Ref, Type } from '@anticrm/core'
import type { Asset, IntlString, Plugin } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Preference } from '@anticrm/preference'
import type { DoneState, KanbanTemplateSpace, SpaceWithStates, Task } from '@anticrm/task'
import type { AnyComponent } from '@anticrm/ui'
import { Action, ActionCategory } from '@anticrm/view'
import { TagCategory } from '@anticrm/tags'

/**
 * @public
 */
export interface Board extends SpaceWithStates {
  color?: number
  background?: string
}

/**
 * @public
 */
export interface BoardView extends SpaceWithStates {
  title: string
  type: 'table' | 'calendar'
  boards: Ref<Board>[]
}

/**
 * @public
 */
export interface CardCover {
  color: number
  size: 'large' | 'small'
}

/**
 * @public
 */
export interface Card extends Task {
  title: string
  description: Markup

  isArchived?: boolean

  members?: Ref<Employee>[]

  location?: string

  cover?: CardCover | null

  comments?: number
  attachments?: number
}

/**
 * @public
 */
export interface MenuPage extends Doc {
  component: AnyComponent
  pageId: string
  label: IntlString
}

/**
 * @public
 */
export interface CommonBoardPreference extends Preference {
  cardLabelsCompactMode: boolean
}
/**
 * @public
 */
export const boardId = 'board' as Plugin

/**
 * @public
 */
const boards = plugin(boardId, {
  app: {
    Board: '' as Ref<Doc>
  },
  class: {
    Board: '' as Ref<Class<Board>>,
    Card: '' as Ref<Class<Card>>,
    MenuPage: '' as Ref<Class<MenuPage>>,
    CommonBoardPreference: '' as Ref<Class<CommonBoardPreference>>,
    CardCover: '' as Ref<Class<Type<CardCover>>>
  },
  category: {
    Card: '' as Ref<ActionCategory>,
    Other: '' as Ref<TagCategory>
  },
  state: {
    Completed: '' as Ref<DoneState>
  },
  action: {
    Open: '' as Ref<Action>,
    Cover: '' as Ref<Action>,
    Dates: '' as Ref<Action>,
    Labels: '' as Ref<Action>,
    Move: '' as Ref<Action>,
    Copy: '' as Ref<Action>,
    Archive: '' as Ref<Action>,
    SendToBoard: '' as Ref<Action>,
    Delete: '' as Ref<Action>
  },
  icon: {
    Board: '' as Asset,
    Card: '' as Asset
  },
  space: {
    BoardTemplates: '' as Ref<KanbanTemplateSpace>
  },
  menuPageId: {
    Main: 'main',
    Archive: 'archive'
  }
})

/**
 * @public
 */
export default boards
