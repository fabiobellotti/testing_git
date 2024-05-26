//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021, 2024 Hardcore Engineering Inc.
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

import { type Attachment } from '@hcengineering/attachment'
import { type Class, type Data, type Doc, type Ref, type Space, type TxOperations as Client } from '@hcengineering/core'
import { getFileMetadata, uploadFile } from '@hcengineering/presentation'
import { setPlatformStatus, unknownError } from '@hcengineering/platform'

import attachment from './plugin'

export async function createAttachments (
  client: Client,
  list: FileList,
  attachTo: { objectClass: Ref<Class<Doc>>, space: Ref<Space>, objectId: Ref<Doc> },
  attachmentClass: Ref<Class<Attachment>> = attachment.class.Attachment,
  extraData: Partial<Data<Attachment>> = {}
): Promise<void> {
  const { objectClass, objectId, space } = attachTo
  try {
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file !== null) {
        const uuid = await uploadFile(file)
        const metadata = await getFileMetadata(file, uuid)

        await client.addCollection(attachmentClass, space, objectId, objectClass, 'attachments', {
          ...extraData,
          name: file.name,
          file: uuid,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          metadata
        })
      }
    }
  } catch (err: any) {
    await setPlatformStatus(unknownError(err))
  }
}

export function getType (type: string): 'image' | 'text' | 'json' | 'video' | 'audio' | 'pdf' | 'other' {
  if (type.startsWith('image/')) {
    return 'image'
  }
  if (type.startsWith('audio/')) {
    return 'audio'
  }
  if (type.startsWith('video/')) {
    return 'video'
  }
  if (type.includes('application/pdf')) {
    return 'pdf'
  }
  if (type === 'application/json') {
    return 'json'
  }
  if (type.startsWith('text/')) {
    return 'text'
  }

  return 'other'
}
