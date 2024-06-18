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

import { type Ref, TxOperations } from '@hcengineering/core'
import {
  createDefaultSpace,
  tryMigrate,
  tryUpgrade,
  type MigrateOperation,
  type MigrationClient,
  type MigrationUpgradeClient
} from '@hcengineering/model'
import core, { DOMAIN_SPACE } from '@hcengineering/model-core'
import hr, { DOMAIN_HR, hrId } from './index'
import { type Department } from '@hcengineering/hr'

async function createDepartment (tx: TxOperations): Promise<void> {
  const current = await tx.findOne(hr.class.Department, {
    _id: hr.ids.Head
  })
  if (current === undefined) {
    await tx.createDoc(
      hr.class.Department,
      hr.space.HR,
      {
        name: 'Organization',
        description: '',
        members: [],
        teamLead: null,
        managers: []
      },
      hr.ids.Head
    )
  }
}

async function migrateDepartments (client: MigrationClient): Promise<void> {
  await client.update(
    DOMAIN_HR,
    { _class: hr.class.PublicHoliday, space: { $ne: hr.space.HR } },
    { space: hr.space.HR }
  )
  const objects = await client.find(DOMAIN_HR, { space: { $ne: hr.space.HR }, _class: hr.class.Request })
  for (const obj of objects) {
    await client.update(DOMAIN_HR, { _id: obj._id }, { space: hr.space.HR, department: obj.space })
  }
  await client.move(DOMAIN_SPACE, { _class: hr.class.Department }, DOMAIN_HR)
  const departments = await client.find<Department>(DOMAIN_HR, {
    _class: hr.class.Department,
    space: { $ne: hr.space.HR }
  })
  for (const department of departments) {
    const upd: Partial<Department> = {
      space: hr.space.HR
    }
    if (department._id !== hr.ids.Head) {
      upd.parent = department.space as unknown as Ref<Department>
    }
    await client.update(DOMAIN_HR, { _id: department._id }, upd)
  }
  await client.update(
    DOMAIN_HR,
    { _class: hr.class.Department },
    { $unset: { archived: true, private: true, owners: true, autoJoin: true } }
  )
}

export const hrOperation: MigrateOperation = {
  async migrate (client: MigrationClient): Promise<void> {
    await tryMigrate(client, hrId, [
      {
        state: 'migrateDepartments',
        func: migrateDepartments
      }
    ])
  },
  async upgrade (state: Map<string, Set<string>>, client: () => Promise<MigrationUpgradeClient>): Promise<void> {
    await tryUpgrade(state, client, hrId, [
      {
        state: 'create-defaults-v2',
        func: async (client) => {
          await createDefaultSpace(client, hr.space.HR, { name: 'HR', description: 'Human Resources' })
          const tx = new TxOperations(client, core.account.System)
          await createDepartment(tx)
        }
      }
    ])
  }
}
