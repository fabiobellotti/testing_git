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

import {
  Class,
  Doc,
  DocumentQuery,
  FindOptions,
  FindResult,
  Hierarchy,
  ModelDb,
  Ref,
  Tx,
  TxResult
} from '@anticrm/core'

/**
 * @public
 */
export interface DbAdapter {
  /**
   * Method called after hierarchy is ready to use.
   */
  init: (model: Tx[]) => Promise<void>
  close: () => Promise<void>
  findAll: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Promise<FindResult<T>>
  tx: (tx: Tx) => Promise<TxResult>
}

/**
 * @public
 */
export interface TxAdapter extends DbAdapter {
  getModel: () => Promise<Tx[]>
}

/**
 * @public
 */
export type DbAdapterFactory = (hierarchy: Hierarchy, url: string, db: string, modelDb: ModelDb) => Promise<DbAdapter>

/**
 * @public
 */
export interface DbAdapterConfiguration {
  factory: DbAdapterFactory
  url: string
}

class InMemoryAdapter implements DbAdapter {
  private readonly modeldb: ModelDb

  constructor (hierarchy: Hierarchy) {
    this.modeldb = new ModelDb(hierarchy)
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.modeldb.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<TxResult> {
    return await this.modeldb.tx(tx)
  }

  async init (model: Tx[]): Promise<void> {
    for (const tx of model) {
      await this.modeldb.tx(tx)
    }
  }

  async close (): Promise<void> {}
}

/**
 * @public
 */
export async function createInMemoryAdapter (hierarchy: Hierarchy, url: string, db: string): Promise<DbAdapter> {
  return new InMemoryAdapter(hierarchy)
}
