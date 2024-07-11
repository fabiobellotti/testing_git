//
// Copyright © 2022-2024 Hardcore Engineering Inc.
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

import { type Blob, type Ref, DOMAIN_BLOB, generateId } from '@hcengineering/core'
import type { File, FileVersion } from '@hcengineering/drive'
import {
  type MigrateOperation,
  type MigrationClient,
  type MigrationUpgradeClient,
  tryMigrate,
  tryUpgrade
} from '@hcengineering/model'

import drive, { DOMAIN_DRIVE, driveId } from './index'

async function migrateFileVersions (client: MigrationClient): Promise<void> {
  type ExFile = Omit<File, 'file'> & {
    file: Ref<Blob>
    metadata?: Record<string, any>
  }

  const files = await client.find<File>(DOMAIN_DRIVE, { version: { $exists: false } })
  for (const file of files) {
    const exfile = file as unknown as ExFile

    const blob = (await client.find<Blob>(DOMAIN_BLOB, { _id: exfile.file }))[0]
    if (blob === undefined) continue

    const fileVersionId: Ref<FileVersion> = generateId()

    await client.create<FileVersion>(DOMAIN_DRIVE, {
      _id: fileVersionId,
      _class: drive.class.FileVersion,
      attachedTo: file._id,
      attachedToClass: file._class,
      collection: 'versions',
      modifiedOn: file.modifiedOn,
      modifiedBy: file.modifiedBy,
      space: file.space,
      name: exfile.name,
      file: blob._id,
      size: blob.size,
      lastModified: blob.modifiedOn,
      type: blob.contentType,
      metadata: exfile.metadata,
      version: 1
    })

    await client.update<File>(
      DOMAIN_DRIVE,
      file._id,
      {
        version: 1,
        versions: 1,
        file: fileVersionId,
        $unset: {
          metadata: 1
        }
      }
    )
  }
}

export const driveOperation: MigrateOperation = {
  async migrate (client: MigrationClient): Promise<void> {
    await tryMigrate(client, driveId, [
      {
        state: 'file-versions',
        func: migrateFileVersions
      }
    ])
  },

  async upgrade (state: Map<string, Set<string>>, client: () => Promise<MigrationUpgradeClient>): Promise<void> {
    await tryUpgrade(state, client, driveId, [])
  }
}
