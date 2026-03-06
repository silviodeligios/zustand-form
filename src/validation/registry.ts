import type { Dispatch } from '../core/types'
import * as A from '../core/actions'
import type { FieldValidatorEntry } from './types'

export interface FieldRegistry {
  register(path: string, entry: FieldValidatorEntry): void
  unregister(path: string): void
  get(path: string): FieldValidatorEntry | undefined
  getAll(): Map<string, FieldValidatorEntry>
  /** Get and increment the async version for a path (for stale cancellation) */
  nextVersion(path: string): number
  /** Get current async version for a path */
  getVersion(path: string): number
  /** Store a debounce timer for a path */
  setTimer(path: string, timer: ReturnType<typeof setTimeout>): void
  /** Clear debounce timer for a path */
  clearTimer(path: string): void
}

export function createFieldRegistry(dispatch: Dispatch): FieldRegistry {
  const validators = new Map<string, FieldValidatorEntry>()
  const asyncVersions = new Map<string, number>()
  const asyncTimers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    register(path, entry) {
      validators.set(path, entry)
      if (!asyncVersions.has(path)) asyncVersions.set(path, 0)
    },

    unregister(path) {
      validators.delete(path)
      // Cancel in-flight async validation
      const timer = asyncTimers.get(path)
      if (timer) clearTimeout(timer)
      asyncTimers.delete(path)
      // Invalidate any pending promise
      asyncVersions.set(path, (asyncVersions.get(path) ?? 0) + 1)
      // Clear pending state
      dispatch({ type: A.PENDING_END, path })
    },

    get: (path) => validators.get(path),
    getAll: () => validators,

    nextVersion(path) {
      const next = (asyncVersions.get(path) ?? 0) + 1
      asyncVersions.set(path, next)
      return next
    },

    getVersion: (path) => asyncVersions.get(path) ?? 0,

    setTimer(path, timer) {
      const prev = asyncTimers.get(path)
      if (prev) clearTimeout(prev)
      asyncTimers.set(path, timer)
    },

    clearTimer(path) {
      const timer = asyncTimers.get(path)
      if (timer) clearTimeout(timer)
      asyncTimers.delete(path)
    },
  }
}
