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

import { Builder } from '@hcengineering/model'

import serverCore from '@hcengineering/server-core'
import core from '@hcengineering/core'
import serverHr from '@hcengineering/server-hr'
import serverNotification from '@hcengineering/server-notification'
import hr from '@hcengineering/hr'

export function createModel (builder: Builder): void {
  builder.createDoc(serverCore.class.Trigger, core.space.Model, {
    trigger: serverHr.trigger.OnDepartmentStaff
  })

  builder.createDoc(serverCore.class.Trigger, core.space.Model, {
    trigger: serverHr.trigger.OnRequestCreate
  })

  builder.createDoc(serverCore.class.Trigger, core.space.Model, {
    trigger: serverHr.trigger.OnRequestUpdate
  })

  builder.createDoc(serverCore.class.Trigger, core.space.Model, {
    trigger: serverHr.trigger.OnRequestRemove
  })

  builder.mixin(hr.class.Request, core.class.Class, serverNotification.mixin.HTMLPresenter, {
    presenter: serverHr.function.RequestHTMLPresenter
  })

  builder.mixin(hr.class.Request, core.class.Class, serverNotification.mixin.TextPresenter, {
    presenter: serverHr.function.RequestTextPresenter
  })
}
