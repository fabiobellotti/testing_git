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

import type { Id, Plugin } from './platform'
import { PlatformError, Status, Severity } from './status'
import platform, { _ID_SEPARATOR } from './platform'

/**
 * @internal
 * @interface _IdInfo
 * 
 * Represents the parsed information from an ID. ID is split into a component (the plugin), a kind, and a name.
 */
export interface _IdInfo {
  component: Plugin
  kind: string
  name: string
}

/**
 * @internal
 * @function _parseId
 * 
 * Parses an ID into its component parts: the plugin, the kind, and the name. If the ID is invalid 
 * (i.e., it does not contain at least three parts), it throws a PlatformError with status of InvalidId.

 * @param id - The ID to parse.
 * @returns {_IdInfo} - The parsed ID information.
 */
export function _parseId (id: Id): _IdInfo {
  const path = id.split(_ID_SEPARATOR)
  if (path.length < 3) {
    throw new PlatformError(new Status(Severity.ERROR, platform.status.InvalidId, { id }))
  }
  return {
    component: path[0] as Plugin,
    kind: path[1],
    name: path.slice(2).join(_ID_SEPARATOR)
  }
}
