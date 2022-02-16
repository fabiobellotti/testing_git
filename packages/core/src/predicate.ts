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

import type { Doc } from './classes'
import { getObjectValue } from './objvalue'
import { escapeLikeForRegexp } from './utils'

type Predicate = (docs: Doc[]) => Doc[]
type PredicateFactory = (pred: any, propertyKey: string) => Predicate

type ExecPredicate = (value: any) => boolean

function execPredicate (docs: Doc[], propertyKey: string, pred: ExecPredicate): Doc[] {
  const result: Doc[] = []
  for (const doc of docs) {
    const value = getObjectValue(propertyKey, doc)
    if (pred(value)) {
      result.push(doc)
    }
  }
  return result
}

const predicates: Record<string, PredicateFactory> = {
  $in: (o, propertyKey) => {
    if (!Array.isArray(o)) {
      throw new Error('$in predicate requires array')
    }
    return (docs) => execPredicate(docs, propertyKey, (value) => o.includes(value))
  },

  $like: (query: string, propertyKey: string): Predicate => {
    const searchString = query.split('%').map(it => escapeLikeForRegexp(it)).join('.*')
    const regex = RegExp(`^${searchString}$`, 'i')

    return (docs) => execPredicate(docs, propertyKey, (value) => regex.test(value))
  },

  $regex: (o: { $regex: string, $options: string }, propertyKey: string): Predicate => {
    const re = new RegExp(o.$regex, o.$options)
    return (docs) => execPredicate(docs, propertyKey, (value) => value.match(re) !== null)
  }
}

export function isPredicate (o: Record<string, any>): boolean {
  if (o === null || typeof o !== 'object') { return false }
  const keys = Object.keys(o)
  return keys.length > 0 && keys.every((key) => key.startsWith('$'))
}

export function createPredicates (o: Record<string, any>, propertyKey: string): Predicate[] {
  const keys = Object.keys(o)
  const result: Predicate[] = []
  for (const key of keys) {
    const factory = predicates[key]
    if (factory === undefined) throw new Error('unknown predicate: ' + keys[0])
    result.push(factory(o[key], propertyKey))
  }
  return result
}
