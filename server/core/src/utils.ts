import { getTypeOf } from '@hcengineering/core'
import { type Hash } from 'crypto'

/**
 * Return some estimation for object size
 */
export function estimateDocSize (_obj: any): number {
  let result = 0
  const toProcess = [_obj]
  while (toProcess.length > 0) {
    const obj = toProcess.shift()
    if (typeof obj === 'undefined') {
      continue
    }
    if (typeof obj === 'function') {
      continue
    }
    for (const key in obj) {
      // include prototype properties
      const value = obj[key]
      const type = getTypeOf(value)
      result += key.length

      switch (type) {
        case 'Array':
          result += 4
          toProcess.push(value)
          break
        case 'Object':
          toProcess.push(value)
          break
        case 'Date':
          result += 24 // Some value
          break
        case 'string':
          result += (value as string).length
          break
        case 'number':
          result += 8
          break
        case 'boolean':
          result += 1
          break
        case 'symbol':
          result += (value as symbol).toString().length
          break
        case 'bigint':
          result += (value as bigint).toString().length
          break
        case 'undefined':
          result += 1
          break
        case 'null':
          result += 1
          break
        default:
          result += value.toString().length
      }
    }
  }
  return result
}
/**
 * Return some estimation for object size
 */
export function updateHashForDoc (hash: Hash, _obj: any): void {
  const toProcess = [_obj]
  while (toProcess.length > 0) {
    const obj = toProcess.shift()
    if (typeof obj === 'undefined') {
      continue
    }
    if (typeof obj === 'function') {
      continue
    }
    for (const key in obj) {
      // include prototype properties
      const value = obj[key]
      const type = getTypeOf(value)
      hash.update(key)

      switch (type) {
        case 'Array':
          toProcess.push(value)
          break
        case 'Object':
          toProcess.push(value)
          break
        case 'Date':
          hash.update(value.toString())
          break
        case 'string':
          hash.update(value)
          break
        case 'number':
          hash.update((value as number).toString(16))
          break
        case 'boolean':
          hash.update((value as boolean) ? '1' : '0')
          break
        case 'symbol':
          hash.update((value as symbol).toString())
          break
        case 'bigint':
          hash.update((value as bigint).toString())
          break
        case 'undefined':
          hash.update('und')
          break
        case 'null':
          hash.update('null')
          break
        default:
          hash.update(value.toString())
      }
    }
  }
}
