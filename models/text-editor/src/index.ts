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

import { DOMAIN_MODEL } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { TDoc } from '@anticrm/model-core'
import type { Asset, IntlString, Resource } from '@anticrm/platform'
// Import types to prevent .svelte components to being exposed to type typescript.
import { RefInputAction, RefInputActionItem } from '@anticrm/text-editor/src/types'
import textEditor from './plugin'

export { default } from './plugin'
export { RefInputAction, RefInputActionItem }

@Model(textEditor.class.RefInputActionItem, core.class.Doc, DOMAIN_MODEL)
export class TRefInputActionItem extends TDoc implements RefInputActionItem {
  label!: IntlString
  icon!: Asset

  // Query for documents with pattern
  action!: Resource<RefInputAction>
}

export function createModel (builder: Builder): void {
  builder.createModel(TRefInputActionItem)
}
