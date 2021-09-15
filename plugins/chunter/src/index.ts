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

import { plugin } from '@anticrm/platform'
import type { Asset, Plugin } from '@anticrm/platform'
import type { Space, Obj, Doc, Ref, Class, AttachedDoc } from '@anticrm/core'

/**
 * @public
 */
export interface Channel extends Space {}

/**
 * @public
 */
export interface Message extends Doc {
  content: string
}

/**
 * @public
 */
export interface Comment extends AttachedDoc {
  message: string
}

/**
 * @public
 */
export interface Backlink extends Comment {
  backlinkId: Ref<Doc>
  backlinkClass: Ref<Class<Doc>>
}

/**
 * @public
 */
export interface Attachment extends Obj {
  name: string
  file: string
  size: number
  type: string
}

/**
 * @public
 */
export const chunterId = 'chunter' as Plugin

export default plugin(chunterId, {
  icon: {
    Chunter: '' as Asset,
    Hashtag: '' as Asset,
    Lock: '' as Asset
  },
  class: {
    Message: '' as Ref<Class<Message>>,
    Backlink: '' as Ref<Class<Backlink>>,
    Comment: '' as Ref<Class<Comment>>,
    Attachment: '' as Ref<Class<Attachment>>
  },
  space: {
    Backlinks: '' as Ref<Space>
  }
})
