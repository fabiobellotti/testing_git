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

import { ClassifierKind, TxOperations, toIdMap, type Class, type Doc, type Ref } from '@hcengineering/core'
import {
  createOrUpdate,
  tryMigrate,
  tryUpgrade,
  type MigrateOperation,
  type MigrationClient,
  type MigrationUpgradeClient
} from '@hcengineering/model'
import core, { DOMAIN_SPACE } from '@hcengineering/model-core'
import tags from '@hcengineering/model-tags'
import { getEmbeddedLabel } from '@hcengineering/platform'
import { taskId, type TaskType } from '@hcengineering/task'
import { DOMAIN_TASK } from '.'
import task from './plugin'

/**
 * @public
 */
export async function createSequence (tx: TxOperations, _class: Ref<Class<Doc>>): Promise<void> {
  if ((await tx.findOne(task.class.Sequence, { attachedTo: _class })) === undefined) {
    await tx.createDoc(task.class.Sequence, task.space.Sequence, {
      attachedTo: _class,
      sequence: 0
    })
  }
}

async function reorderStates (_client: MigrationUpgradeClient): Promise<void> {
  const client = new TxOperations(_client, core.account.System)
  const states = toIdMap(await client.findAll(core.class.Status, {}))
  const order = [
    task.statusCategory.UnStarted,
    task.statusCategory.ToDo,
    task.statusCategory.Active,
    task.statusCategory.Won,
    task.statusCategory.Lost
  ]
  const taskTypes = await client.findAll(task.class.TaskType, {})
  for (const taskType of taskTypes) {
    const statuses = [...taskType.statuses].sort((a, b) => {
      const aIndex = order.indexOf(states.get(a)?.category ?? task.statusCategory.UnStarted)
      const bIndex = order.indexOf(states.get(b)?.category ?? task.statusCategory.UnStarted)
      return aIndex - bIndex
    })
    try {
      await client.diffUpdate(taskType, { statuses })
    } catch (err: any) {
      console.error(err)
    }
  }
}

async function createDefaultSequence (tx: TxOperations): Promise<void> {
  const current = await tx.findOne(core.class.Space, {
    _id: task.space.Sequence
  })
  if (current === undefined) {
    await tx.createDoc(
      core.class.Space,
      core.space.Space,
      {
        name: 'Sequences',
        description: 'Internal space to store sequence numbers',
        members: [],
        private: false,
        archived: false
      },
      task.space.Sequence
    )
  }
}

async function createDefaultStatesSpace (tx: TxOperations): Promise<void> {
  const current = await tx.findOne(core.class.Space, {
    _id: task.space.Statuses
  })
  if (current === undefined) {
    await tx.createDoc(
      core.class.Space,
      core.space.Space,
      {
        name: 'Statuses',
        description: 'Internal space to store all Statuses',
        members: [],
        private: false,
        archived: false
      },
      task.space.Statuses
    )
  }
}

async function createDefaults (tx: TxOperations): Promise<void> {
  await createDefaultSequence(tx)
  await createDefaultStatesSpace(tx)
}

async function fixProjectTypeMissingClass (client: MigrationUpgradeClient): Promise<void> {
  const projectTypes = await client.findAll(task.class.ProjectType, {})
  const ops = new TxOperations(client, core.account.ConfigUser)

  const h = ops.getHierarchy()
  for (const pt of projectTypes) {
    console.log('Checking:', pt.name)
    try {
      if (!h.hasClass(pt.targetClass)) {
        const categoryObj = ops.getModel().findObject(pt.descriptor)
        if (categoryObj === undefined) {
          throw new Error('category is not found in model')
        }
        const baseClassClass = h.getClass(categoryObj.baseClass)
        await ops.createDoc(
          core.class.Class,
          core.space.Model,
          {
            extends: categoryObj.baseClass,
            kind: ClassifierKind.MIXIN,
            label: baseClassClass.label,
            icon: baseClassClass.icon
          },
          pt.targetClass,
          Date.now(),
          core.account.ConfigUser
        )
      }

      const taskTypes = await ops.findAll(task.class.TaskType, { parent: pt._id })

      for (const tt of taskTypes) {
        if (!h.hasClass(tt.targetClass)) {
          const ofClassClass = h.getClass(tt.ofClass)
          await ops.createDoc(
            core.class.Class,
            core.space.Model,
            {
              extends: tt.ofClass,
              kind: ClassifierKind.MIXIN,
              label: getEmbeddedLabel(tt.name),
              icon: ofClassClass.icon
            },
            pt.targetClass,
            Date.now(),
            core.account.ConfigUser
          )
        }
      }
    } catch (err: any) {
      //
      console.error(err)
    }
  }
}

export const taskOperation: MigrateOperation = {
  async migrate (client: MigrationClient): Promise<void> {
    await tryMigrate(client, taskId, [
      {
        state: 'projectTypeSpace',
        func: async (client) => {
          await client.update(DOMAIN_SPACE, { space: core.space.Model }, { space: core.space.Space })
        }
      },
      {
        state: 'classicProjectTypes',
        func: async (client) => {
          await client.update(
            DOMAIN_SPACE,
            { _class: task.class.ProjectType, classic: { $exists: false } },
            {
              classic: true
            }
          )
        }
      },
      {
        state: 'fixIncorrectTaskTypeSpace',
        func: async (client) => {
          const taskTypes = await client.find<TaskType>(DOMAIN_TASK, {
            _class: task.class.TaskType,
            space: core.space.Model
          })
          for (const taskType of taskTypes) {
            await client.update(DOMAIN_TASK, { _id: taskType._id }, { $set: { space: taskType.parent } })
          }
        }
      }
    ])
  },
  async upgrade (client: MigrationUpgradeClient): Promise<void> {
    const tx = new TxOperations(client, core.account.System)
    await createDefaults(tx)

    await createOrUpdate(
      tx,
      tags.class.TagCategory,
      tags.space.Tags,
      {
        icon: tags.icon.Tags,
        label: 'Text Label',
        targetClass: task.class.Task,
        tags: [],
        default: true
      },
      task.category.TaskTag
    )

    await tryUpgrade(client, taskId, [
      {
        state: 'reorderStates',
        func: reorderStates
      },
      {
        state: 'fix-project-type-missing-class',
        func: fixProjectTypeMissingClass
      }
    ])
  }
}
