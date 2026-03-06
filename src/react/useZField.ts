import { useMemo, useEffect, useRef } from 'react'
import type { FormHook, UseZFieldOptions, UseZFieldReturn } from './types'
import { shallow } from 'zustand/shallow'

export function useZField<TValues>(
  form: FormHook<TValues>,
  path: string,
  options?: UseZFieldOptions,
): UseZFieldReturn {
  const p = useMemo(() => form.field(path), [form, path])

  const validate = options?.validate
  const validateMode = options?.validateMode
  const asyncValidate = options?.asyncValidate
  const asyncValidateMode = options?.asyncValidateMode
  const debounce = options?.debounce

  useEffect(() => {
    if (!validate && !asyncValidate) return
    form.registerField(path, {
      validate, validateMode, asyncValidate, asyncValidateMode, debounce,
    })
    return () => form.unregisterField(path)
  }, [form, path, validate, validateMode, asyncValidate, asyncValidateMode, debounce])

  const fieldState = form(p.select.fieldState, shallow)
  const elRef = useRef<HTMLElement | null>(null)

  return {
    field: {
      value: fieldState.value,
      onChange: p.setValue,
      onBlur: p.blur,
      onFocus: p.focus,
      ref: (el: HTMLElement | null) => { elRef.current = el },
    },
    fieldState,
  }
}
