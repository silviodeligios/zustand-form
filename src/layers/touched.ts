import type { Enhancer } from '../core/types'
import * as A from '../core/actions'
import { reindexPathKeyedRecord } from '../core/arrayReindex'

export function touchedEnhancer<TValues>(): Enhancer<TValues> {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case A.FOCUS: {
        if (!ctx.path) return { ...draft, focusedField: null }
        const touched = { ...(draft.touchedFields ?? prev.touchedFields), [ctx.path]: true }
        return { ...draft, touchedFields: touched, focusedField: ctx.path }
      }
      case A.BLUR: {
        if (!ctx.path) return draft
        const focus = prev.focusedField === ctx.path ? null : (draft.focusedField ?? prev.focusedField)
        return { ...draft, focusedField: focus }
      }
      case A.SET_TOUCHED: {
        if (!ctx.path) return draft
        const val = ctx.value !== false
        const touched = { ...(draft.touchedFields ?? prev.touchedFields), [ctx.path]: val }
        return { ...draft, touchedFields: touched }
      }
      case A.ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft
        const base = draft.touchedFields ?? prev.touchedFields
        return { ...draft, touchedFields: reindexPathKeyedRecord(base, ctx.path, { type: 'remove', index: ctx.index }) }
      }
      case A.ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft
        const base = draft.touchedFields ?? prev.touchedFields
        return { ...draft, touchedFields: reindexPathKeyedRecord(base, ctx.path, { type: 'insert', index: ctx.index }) }
      }
      case A.ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft
        const base = draft.touchedFields ?? prev.touchedFields
        return { ...draft, touchedFields: reindexPathKeyedRecord(base, ctx.path, { type: 'move', from: ctx.from, to: ctx.to }) }
      }
      case A.ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft
        const base = draft.touchedFields ?? prev.touchedFields
        return { ...draft, touchedFields: reindexPathKeyedRecord(base, ctx.path, { type: 'swap', from: ctx.from, to: ctx.to }) }
      }
      case A.RESET_FORM:
        return { ...draft, touchedFields: {}, focusedField: null }
      case A.RESET_FIELD: {
        if (!ctx.path) return draft
        const { [ctx.path]: _, ...rest } = draft.touchedFields ?? prev.touchedFields
        return { ...draft, touchedFields: rest }
      }
      default:
        return draft
    }
  }
}
