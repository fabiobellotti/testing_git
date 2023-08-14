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

import { Account, Domain, IndexKind, Ref } from '@hcengineering/core'
import { Builder, Index, Model } from '@hcengineering/model'
import preference, { TPreference } from '@hcengineering/model-preference'
import { SupportStatus } from '@hcengineering/support'

import support from './plugin'

export { supportId } from '@hcengineering/support'
export { supportOperation } from './migration'
export { support as default }

export const DOMAIN_SUPPORT = 'support' as Domain

@Model(support.class.SupportStatus, preference.class.Preference)
export class TSupportStatus extends TPreference implements SupportStatus {
  @Index(IndexKind.Indexed)
    user!: Ref<Account>

  hasUnreadMessages!: boolean
}

export function createModel (builder: Builder): void {
  builder.createModel(TSupportStatus)
}
