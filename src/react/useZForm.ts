import { useRef, useCallback } from 'react'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { createForm } from '../core/createForm'
import type { FormConfig } from '../core/createForm'
import type { FormState, Form } from '../core/types'
import type { FormHook } from './types'

export function useZForm<TValues>(config: FormConfig<TValues>): FormHook<TValues> {
  const formRef = useRef<Form<TValues>>()
  if (!formRef.current) {
    formRef.current = createForm(config)
  }
  const form = formRef.current

  const hook = useCallback(
    <U>(selector: (s: FormState<TValues>) => U, equalityFn?: (a: U, b: U) => boolean): U => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useStoreWithEqualityFn(form, selector, equalityFn)
    },
    [form],
  )

  return Object.assign(hook, form) as FormHook<TValues>
}
