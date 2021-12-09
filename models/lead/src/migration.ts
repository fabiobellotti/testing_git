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

import { Doc, TxOperations } from '@anticrm/core'
import { MigrateOperation, MigrationClient, MigrationUpgradeClient } from '@anticrm/model'
import core from '@anticrm/model-core'
import view from '@anticrm/model-view'
import { createKanban } from '@anticrm/lead'
import lead from './plugin'

export const leadOperation: MigrateOperation = {
  async migrate (client: MigrationClient): Promise<void> {

  },
  async upgrade (client: MigrationUpgradeClient): Promise<void> {
    console.log('Lead: Performing model upgrades')

    const ops = new TxOperations(client, core.account.System)
    if (await client.findOne(view.class.Kanban, { attachedTo: lead.space.DefaultFunnel }) === undefined) {
      console.info('Create kanban for default funnel.')
      await createKanban(lead.space.DefaultFunnel, async (_class, space, data, id) => {
        const doc = await ops.findOne<Doc>(_class, { _id: id })
        if (doc === undefined) {
          await ops.createDoc(_class, space, data, id)
        } else {
          await ops.updateDoc(_class, space, id, data)
        }
      }).catch((err) => console.error(err))
    } else {
      console.log('Lead: => default funnel Kanban is ok')
    }
  }
}
