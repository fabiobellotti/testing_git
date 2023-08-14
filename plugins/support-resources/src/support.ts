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

import { Unsubscriber, get } from 'svelte/store'

import { getCurrentAccount } from '@hcengineering/core'
import intercom from '@hcengineering/intercom'
import { getResource } from '@hcengineering/platform'
import { SupportClient, SupportWidget, SupportWidgetConfig } from '@hcengineering/support'
import { location, themeStore } from '@hcengineering/ui'

import { markHasUnreadMessages } from './utils'

class SupportClientImpl implements SupportClient {
  private config: SupportWidgetConfig
  private widget: SupportWidget | undefined = undefined
  private visible = false
  private readonly unsub: Unsubscriber | undefined = undefined

  constructor () {
    this.config = {
      account: getCurrentAccount(),
      workspace: get(location).path[1],
      language: get(themeStore).language
    }
    this.updateWidgetConfig(this.config)

    this.unsub = themeStore.subscribe((theme) => {
      const config = { ...this.config, language: theme.language }
      this.updateWidgetConfig(config)
    })
  }

  destroy (): void {
    this.unsub?.()
    this.widget?.destroy()
  }

  async showWidget (): Promise<void> {
    await this.getWidget().then((widget) => widget.showWidget())
  }

  async hideWidget (): Promise<void> {
    this.widget?.hideWidget()
  }

  async toggleWidget (): Promise<void> {
    await this.getWidget().then((widget) => widget.toggleWidget())
  }

  private updateWidgetConfig (config: SupportWidgetConfig): void {
    this.config = config
    this.widget?.configure(config)
  }

  private handleUnreadCountChanged (count: number): void {
    void markHasUnreadMessages(this.config.account._id, count > 0)
  }

  private handleVisibilityChanged (visible: boolean): void {
    this.visible = visible
  }

  private async getWidget (): Promise<SupportWidget> {
    if (this.widget === undefined) {
      const factory = await getResource(intercom.function.GetWidget)
      this.widget = factory(
        this.config,
        (count: number) => this.handleUnreadCountChanged(count),
        (visible: boolean) => this.handleVisibilityChanged(visible)
      )
    }
    return await Promise.resolve(this.widget)
  }
}

let client: SupportClient | undefined

export function createSupportClient (): SupportClient {
  client = new SupportClientImpl()
  return client
}

export function getSupportClient (): SupportClient | undefined {
  if (client === undefined) {
    console.info('support client not initialized')
  }
  return client
}
