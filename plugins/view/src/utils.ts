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

import { Doc } from '@hcengineering/core'
import { ActionWithAvailability } from './types'

export function focusActionWithAvailability<T extends Doc, E extends Event = Event, P = never> (
  isAvailable: (doc: T) => Promise<boolean>,
  action: (doc: T, event?: E, params?: P) => Promise<any>
): ActionWithAvailability<T, P> {
  return {
    isAvailable: async function (doc: T | T[] | undefined): Promise<boolean> {
      if (doc === undefined) {
        return false
      }
      if (Array.isArray(doc) && doc.length !== 1) {
        return false
      }
      doc = Array.isArray(doc) ? doc[0] : doc
      return await isAvailable(doc)
    },
    action: async function (doc: T | T[] | undefined, evt?: Event, params?: P): Promise<void> {
      if (doc === undefined) {
        throw new Error('Action requires a document')
      }
      if (Array.isArray(doc) && doc.length !== 1) {
        throw new Error('Action requires exactly one document')
      }
      doc = Array.isArray(doc) ? doc[0] : doc
      if (!(await isAvailable(doc))) {
        throw new Error('Action not available')
      }
      await action(doc, evt as E, params)
    }
  }
}

export function noneActionWithAvailability<T extends Doc = Doc, E extends Event = Event, P = never> (
  isAvailable: () => Promise<boolean>,
  action: (event?: E, params?: P) => Promise<any>
): ActionWithAvailability<T, P> {
  return {
    isAvailable: async function (doc: T | T[] | undefined): Promise<boolean> {
      return await isAvailable()
    },
    action: async function (doc: T | T[] | undefined, evt?: Event, params?: P): Promise<void> {
      if (!(await isAvailable())) {
        throw new Error('Action not available')
      }
      await action(evt as E, params)
    }
  }
}

export function anyActionWithAvailability<T extends Doc, E extends Event = Event, P = never> (
  isAvailable: (doc: T | T[]) => Promise<boolean>,
  action: (doc: T | T[], event?: E, params?: P) => Promise<any>
): ActionWithAvailability<T, P> {
  return {
    isAvailable: async function (doc: T | T[] | undefined): Promise<boolean> {
      if (doc === undefined) {
        return false
      }
      return await isAvailable(doc)
    },
    action: async function (doc: T | T[] | undefined, evt?: Event, params?: P): Promise<void> {
      if (doc === undefined) {
        throw new Error('Action requires at least one document')
      }
      if (!(await isAvailable(doc))) {
        throw new Error('Action not available')
      }
      await action(doc, evt as E, params)
    }
  }
}

/**
 * A special case of `any` action that performs an individual independent operation on each item,
 * and only if it is available for all items. Very opinionated about how to iterate items during
 * availability check and action invocation.
 *
 * If you're building an action different from that, consider using a general purpose
 * {@link anyActionWithAvailability()} and implementing your own iteration logic.
 *
 * @param isAvailable
 * @param action
 * @param isParallel Whether to run {@link action} in parallel for all items, or sequentially one by one.
 *  Note that {@link isAvailable} always runs in parallel.
 *
 * @see ViewActionInput
 */
export function eachItemActionWithAvailability<T extends Doc, E extends Event = Event, P = never> (
  isAvailable: (doc: T) => Promise<boolean>,
  action: (doc: T, event?: E, params?: P) => Promise<any>,
  isParallel: boolean
): ActionWithAvailability<T, P> {
  return {
    isAvailable: async function (doc: T | T[] | undefined): Promise<boolean> {
      if (doc === undefined) {
        return false
      }
      if (Array.isArray(doc) && doc.length < 1) {
        return false
      }
      const docs = Array.isArray(doc) ? doc : [doc]
      const results = await Promise.all(docs.map(async (doc) => await isAvailable(doc)))
      return results.every(Boolean)
    },
    action: async function (doc: T | T[] | undefined, evt?: Event, params?: P): Promise<void> {
      if (doc === undefined) {
        throw new Error('Action requires a document')
      }
      if (Array.isArray(doc) && doc.length < 1) {
        throw new Error('Action requires at least one document')
      }
      const docs = Array.isArray(doc) ? doc : [doc]
      if (isParallel) {
        await Promise.all(
          docs.map(async (doc) => {
            if (!(await isAvailable(doc))) {
              throw new Error('Action not available')
            }
            await action(doc, evt as E, params)
          })
        )
      } else {
        for (const doc of docs) {
          if (!(await isAvailable(doc))) {
            throw new Error('Action not available')
          }
          await action(doc, evt as E, params)
        }
      }
    }
  }
}
