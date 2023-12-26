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

import { type ViewActionAvailabilityFunction } from '@hcengineering/view'
import { type Survey } from '@hcengineering/survey'

export const SurveyCanBeTaken: ViewActionAvailabilityFunction<Survey> = async (
  objects: Survey | Survey[] | undefined
): Promise<boolean> => {
  if (objects === undefined) {
    return false
  }
  return (Array.isArray(objects) ? objects : [objects]).every((object) => {
    // TODO: Add more checks: maxAttempts, existing unfinished results, etc.
    return !object.private && object.questions > 0
  })
}
