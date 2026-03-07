import type { FormState, DispatchOptions } from '../core/types'

export interface FieldArrayItem {
  id: string
  index: number
}

export interface FieldArraySelectors<TValues> {
  length: (s: FormState<TValues>) => number
}

export interface FieldArrayApi<TValues> {
  getLength(): number
  setValue(arr: unknown[], options?: DispatchOptions): void

  append(value: unknown, options?: DispatchOptions): void
  prepend(value: unknown, options?: DispatchOptions): void
  remove(index: number, options?: DispatchOptions): void
  insert(index: number, value: unknown, options?: DispatchOptions): void
  move(from: number, to: number, options?: DispatchOptions): void
  swap(indexA: number, indexB: number, options?: DispatchOptions): void

  select: FieldArraySelectors<TValues>
}
