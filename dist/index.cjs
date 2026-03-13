'use strict';

var vanilla = require('zustand/vanilla');

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/core/actions.ts
var actions_exports = {};
__export(actions_exports, {
  ARRAY_APPEND: () => ARRAY_APPEND,
  ARRAY_INSERT: () => ARRAY_INSERT,
  ARRAY_MOVE: () => ARRAY_MOVE,
  ARRAY_REMOVE: () => ARRAY_REMOVE,
  ARRAY_REPLACE: () => ARRAY_REPLACE,
  ARRAY_SWAP: () => ARRAY_SWAP,
  ASYNC_RESOLVE: () => ASYNC_RESOLVE,
  BLUR: () => BLUR,
  CLEAR_ERROR: () => CLEAR_ERROR,
  CLEAR_ERRORS_BRANCH: () => CLEAR_ERRORS_BRANCH,
  FOCUS: () => FOCUS,
  RESET_BRANCH: () => RESET_BRANCH,
  RESET_FIELD: () => RESET_FIELD,
  RESET_FORM: () => RESET_FORM,
  SET_DIRTY: () => SET_DIRTY,
  SET_ERROR: () => SET_ERROR,
  SET_TOUCHED: () => SET_TOUCHED,
  SET_TREE_VALUE: () => SET_TREE_VALUE,
  SET_VALUE: () => SET_VALUE,
  SUBMIT: () => SUBMIT,
  SUBMIT_FAILURE: () => SUBMIT_FAILURE,
  SUBMIT_SUCCESS: () => SUBMIT_SUCCESS,
  VALIDATE_BRANCH: () => VALIDATE_BRANCH,
  VALIDATE_FIELD: () => VALIDATE_FIELD
});
var SET_VALUE = "SET_VALUE";
var SET_ERROR = "SET_ERROR";
var CLEAR_ERROR = "CLEAR_ERROR";
var SET_TOUCHED = "SET_TOUCHED";
var SET_DIRTY = "SET_DIRTY";
var FOCUS = "FOCUS";
var BLUR = "BLUR";
var VALIDATE_FIELD = "VALIDATE_FIELD";
var RESET_FIELD = "RESET_FIELD";
var CLEAR_ERRORS_BRANCH = "CLEAR_ERRORS_BRANCH";
var RESET_BRANCH = "RESET_BRANCH";
var VALIDATE_BRANCH = "VALIDATE_BRANCH";
var SET_TREE_VALUE = "SET_TREE_VALUE";
var ASYNC_RESOLVE = "ASYNC_RESOLVE";
var ARRAY_APPEND = "ARRAY_APPEND";
var ARRAY_REMOVE = "ARRAY_REMOVE";
var ARRAY_INSERT = "ARRAY_INSERT";
var ARRAY_MOVE = "ARRAY_MOVE";
var ARRAY_SWAP = "ARRAY_SWAP";
var ARRAY_REPLACE = "ARRAY_REPLACE";
var RESET_FORM = "RESET_FORM";
var SUBMIT = "SUBMIT";
var SUBMIT_SUCCESS = "SUBMIT_SUCCESS";
var SUBMIT_FAILURE = "SUBMIT_FAILURE";

// src/utils/paths.ts
function hasPath(obj, path) {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return false;
    if (!(key in current)) return false;
    current = current[key];
  }
  return true;
}
function getIn(obj, path) {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null) return void 0;
    current = current[key];
  }
  return current;
}
function getInArray(obj, path) {
  const val = getIn(obj, path);
  return Array.isArray(val) ? val : [];
}
function setIn(obj, path, value) {
  const keys = path.split(".");
  if (keys.length === 0) return value;
  return setAtKeys(obj, keys, 0, value);
}
function setAtKeys(obj, keys, i, value) {
  if (i === keys.length) return value;
  const key = keys[i];
  const current = obj != null ? obj[key] : void 0;
  const next = setAtKeys(current, keys, i + 1, value);
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[Number(key)] = next;
    return copy;
  }
  return { ...obj, [key]: next };
}

// src/utils/cache.ts
function cached(map, key, factory) {
  let entry = map.get(key);
  if (!entry) {
    entry = factory();
    map.set(key, entry);
  }
  return entry;
}

// src/field/selectors.ts
function createFieldSelectors(dispatch) {
  const cache = {
    value: /* @__PURE__ */ new Map(),
    error: /* @__PURE__ */ new Map(),
    dirty: /* @__PURE__ */ new Map(),
    touched: /* @__PURE__ */ new Map(),
    pending: /* @__PURE__ */ new Map(),
    focused: /* @__PURE__ */ new Map(),
    fieldState: /* @__PURE__ */ new Map(),
    inputProps: /* @__PURE__ */ new Map()
  };
  return {
    value: (path) => cached(cache.value, path, () => (s) => getIn(s.values, path)),
    error: (path) => cached(cache.error, path, () => (s) => s.errors[path]),
    dirty: (path) => cached(cache.dirty, path, () => (s) => s.dirtyFields[path] ?? false),
    touched: (path) => cached(cache.touched, path, () => (s) => s.touchedFields[path] ?? false),
    pending: (path) => cached(cache.pending, path, () => (s) => s.pendingFields[path] ?? false),
    focused: (path) => cached(cache.focused, path, () => (s) => s.focusedField === path),
    fieldState: (path) => cached(cache.fieldState, path, () => (s) => ({
      dirty: s.dirtyFields[path] ?? false,
      touched: s.touchedFields[path] ?? false,
      error: s.errors[path],
      pending: s.pendingFields[path] ?? false,
      focused: s.focusedField === path
    })),
    inputProps: (path) => cached(cache.inputProps, path, () => {
      const onChange = (v) => dispatch({ type: SET_VALUE, path, value: v });
      const onBlur = () => dispatch({ type: BLUR, path });
      const onFocus = () => dispatch({ type: FOCUS, path });
      return (s) => ({
        value: getIn(s.values, path),
        onChange,
        onBlur,
        onFocus
      });
    })
  };
}

// src/field/createField.ts
function createFieldNamespace(store, dispatch) {
  const s = () => store.getState();
  return {
    getValue: (path) => getIn(s().values, path),
    isDirty: (path) => s().dirtyFields[path] === true,
    isTouched: (path) => s().touchedFields[path] === true,
    isPending: (path) => s().pendingFields[path] === true,
    getError: (path) => s().errors[path],
    setValue: (path, v, opts) => dispatch({ type: SET_VALUE, path, value: v, options: opts }),
    setError: (path, msg, opts) => dispatch({ type: SET_ERROR, path, value: msg, options: opts }),
    clearError: (path, opts) => dispatch({ type: CLEAR_ERROR, path, options: opts }),
    setTouched: (path, v = true, opts) => dispatch({ type: SET_TOUCHED, path, value: v, options: opts }),
    setDirty: (path, v = true, opts) => dispatch({ type: SET_DIRTY, path, value: v, options: opts }),
    focus: (path, opts) => dispatch({ type: FOCUS, path, options: opts }),
    blur: (path, opts) => dispatch({ type: BLUR, path, options: opts }),
    validate: (path, opts) => dispatch({ type: VALIDATE_FIELD, path, options: opts }),
    reset: (path, opts) => dispatch({ type: RESET_FIELD, path, options: opts }),
    select: createFieldSelectors(dispatch)
  };
}

// src/fieldArray/createFieldArray.ts
function createFieldArrayNamespace(store, dispatch) {
  const s = () => store.getState();
  const lengthCache = /* @__PURE__ */ new Map();
  return {
    getLength: (path) => getInArray(s().values, path).length,
    append: (path, v, opts) => dispatch({ type: ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (path, v, opts) => dispatch({
      type: ARRAY_INSERT,
      path,
      index: 0,
      value: v,
      options: opts
    }),
    remove: (path, i, opts) => dispatch({ type: ARRAY_REMOVE, path, index: i, options: opts }),
    insert: (path, i, v, opts) => dispatch({
      type: ARRAY_INSERT,
      path,
      index: i,
      value: v,
      options: opts
    }),
    move: (path, f, t, opts) => dispatch({ type: ARRAY_MOVE, path, from: f, to: t, options: opts }),
    replace: (path, v, opts) => dispatch({ type: ARRAY_REPLACE, path, value: v, options: opts }),
    swap: (path, a, b, opts) => dispatch({ type: ARRAY_SWAP, path, from: a, to: b, options: opts }),
    select: {
      length: (path) => cached(
        lengthCache,
        path,
        () => (s2) => getInArray(s2.values, path).length
      )
    }
  };
}

// src/utils/tree.ts
function treeMatcher(prefix) {
  if (!prefix) return () => true;
  return (key) => key === prefix || key.startsWith(prefix + ".");
}

// src/tree/selectors.ts
function createTreeSelectors(getMatcher, filterErrors) {
  const cache = {
    dirty: /* @__PURE__ */ new Map(),
    touched: /* @__PURE__ */ new Map(),
    pending: /* @__PURE__ */ new Map(),
    valid: /* @__PURE__ */ new Map(),
    errors: /* @__PURE__ */ new Map(),
    dirtyFields: /* @__PURE__ */ new Map(),
    touchedFields: /* @__PURE__ */ new Map(),
    errorCount: /* @__PURE__ */ new Map()
  };
  const cacheKey = (path) => path ?? "";
  return {
    dirty: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirty,
        k,
        () => (s) => Object.keys(s.dirtyFields).some(match)
      );
    },
    touched: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touched,
        k,
        () => (s) => Object.keys(s.touchedFields).some(match)
      );
    },
    pending: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.pending,
        k,
        () => (s) => Object.keys(s.pendingFields).some(match)
      );
    },
    valid: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.valid,
        k,
        () => (s) => !Object.keys(s.errors).some(
          (key) => match(key) && s.errors[key] !== void 0
        )
      );
    },
    errors: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(cache.errors, k, () => (s) => filterErrors(s, match));
    },
    dirtyFields: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => Object.keys(s.dirtyFields).filter(match)
      );
    },
    touchedFields: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => Object.keys(s.touchedFields).filter(match)
      );
    },
    errorCount: (path) => {
      const k = cacheKey(path);
      const match = getMatcher(path);
      return cached(
        cache.errorCount,
        k,
        () => (s) => Object.keys(s.errors).filter(
          (key) => match(key) && s.errors[key] !== void 0
        ).length
      );
    }
  };
}

// src/tree/createTree.ts
function createTreeNamespace(store, dispatch) {
  const s = () => store.getState();
  const matcherCache = /* @__PURE__ */ new Map();
  function getMatcher(path) {
    const key = path ?? "";
    let m = matcherCache.get(key);
    if (!m) {
      m = treeMatcher(path);
      matcherCache.set(key, m);
    }
    return m;
  }
  function filterErrors(state, match) {
    const result = {};
    for (const k of Object.keys(state.errors)) {
      const v = state.errors[k];
      if (match(k) && v !== void 0) result[k] = v;
    }
    return result;
  }
  return {
    isDirty: (path) => Object.keys(s().dirtyFields).some(getMatcher(path)),
    isTouched: (path) => Object.keys(s().touchedFields).some(getMatcher(path)),
    isPending: (path) => Object.keys(s().pendingFields).some(getMatcher(path)),
    isValid: (path) => !Object.keys(s().errors).some(
      (k) => getMatcher(path)(k) && s().errors[k] !== void 0
    ),
    getErrors: (path) => filterErrors(s(), getMatcher(path)),
    getDirtyFields: (path) => Object.keys(s().dirtyFields).filter(getMatcher(path)),
    getTouchedFields: (path) => Object.keys(s().touchedFields).filter(getMatcher(path)),
    setValue: (...args) => {
      if (typeof args[0] === "string") {
        dispatch({ type: SET_TREE_VALUE, path: args[0], value: args[1] });
      } else {
        dispatch({ type: SET_TREE_VALUE, value: args[0] });
      }
    },
    clearErrors: (path, opts) => dispatch({ type: CLEAR_ERRORS_BRANCH, path, options: opts }),
    reset: (path, opts) => dispatch({ type: RESET_BRANCH, path, options: opts }),
    validate: (path, opts) => dispatch({ type: VALIDATE_BRANCH, path, options: opts }),
    select: createTreeSelectors(getMatcher, filterErrors)
  };
}

// src/utils/arrayReindex.ts
function computeNewIndex(index, op) {
  if (op.type === "remove") {
    if (index === op.index) return null;
    return index > op.index ? index - 1 : index;
  }
  if (op.type === "insert") {
    return index >= op.index ? index + 1 : index;
  }
  if (op.type === "move") {
    const { from: from2, to: to2 } = op;
    if (from2 === to2) return index;
    if (index === from2) return to2;
    if (from2 < to2) return index > from2 && index <= to2 ? index - 1 : index;
    return index >= to2 && index < from2 ? index + 1 : index;
  }
  const { from, to } = op;
  if (from === to) return index;
  if (index === from) return to;
  if (index === to) return from;
  return index;
}
function parsePathIndex(key, prefix) {
  if (!key.startsWith(prefix)) return null;
  const rest = key.slice(prefix.length);
  const firstDot = rest.indexOf(".");
  const indexStr = firstDot === -1 ? rest : rest.slice(0, firstDot);
  const index = Number(indexStr);
  if (Number.isNaN(index) || index < 0) return null;
  const suffix = firstDot === -1 ? "" : rest.slice(firstDot);
  return { index, suffix };
}
function reindexPathKeyedRecord(record, arrayPath, op) {
  const prefix = arrayPath + ".";
  const result = {};
  for (const key of Object.keys(record)) {
    if (key === arrayPath || !key.startsWith(prefix)) {
      result[key] = record[key];
      continue;
    }
    const parsed = parsePathIndex(key, prefix);
    if (!parsed) {
      result[key] = record[key];
      continue;
    }
    const newIndex = computeNewIndex(parsed.index, op);
    if (newIndex !== null) {
      result[prefix + String(newIndex) + parsed.suffix] = record[key];
    }
  }
  return result;
}
function reindexMap(map, arrayPath, op, onRemove, onMove) {
  const prefix = arrayPath + ".";
  const toDelete = [];
  const toSet = [];
  for (const [key, value] of map) {
    if (key === arrayPath || !key.startsWith(prefix)) continue;
    const parsed = parsePathIndex(key, prefix);
    if (!parsed) continue;
    const newIndex = computeNewIndex(parsed.index, op);
    toDelete.push(key);
    if (newIndex === null) {
      onRemove?.(key, value);
    } else {
      const newKey = prefix + String(newIndex) + parsed.suffix;
      toSet.push([newKey, value]);
      if (onMove && newKey !== key) onMove(key, newKey);
    }
  }
  for (const key of toDelete) map.delete(key);
  for (const [key, value] of toSet) map.set(key, value);
}

// src/validation/registry.ts
function createFieldRegistry(dispatch) {
  const validators = /* @__PURE__ */ new Map();
  const asyncVersions = /* @__PURE__ */ new Map();
  const asyncTimers = /* @__PURE__ */ new Map();
  const reindexedPaths = /* @__PURE__ */ new Set();
  const asyncSessions = /* @__PURE__ */ new Map();
  let sessionCounter = 0;
  return {
    register(path, entry) {
      validators.set(path, entry);
      if (!asyncVersions.has(path)) asyncVersions.set(path, 0);
    },
    unregister(path) {
      if (reindexedPaths.delete(path)) return;
      validators.delete(path);
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
      asyncVersions.set(path, (asyncVersions.get(path) ?? 0) + 1);
      dispatch({ type: ASYNC_RESOLVE, path });
    },
    get: (path) => validators.get(path),
    getAll: () => validators,
    nextVersion(path) {
      const next = (asyncVersions.get(path) ?? 0) + 1;
      asyncVersions.set(path, next);
      return next;
    },
    getVersion: (path) => asyncVersions.get(path) ?? 0,
    setTimer(path, timer) {
      const prev = asyncTimers.get(path);
      if (prev) clearTimeout(prev);
      asyncTimers.set(path, timer);
    },
    clearTimer(path) {
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
    },
    reindex(arrayPath, op) {
      const prefix = arrayPath + ".";
      reindexMap(validators, arrayPath, op, void 0, (oldKey) => {
        reindexedPaths.add(oldKey);
      });
      setTimeout(() => reindexedPaths.clear(), 0);
      reindexMap(asyncTimers, arrayPath, op, (_key, timer) => {
        clearTimeout(timer);
      });
      reindexMap(asyncVersions, arrayPath, op);
      for (const [id, session] of asyncSessions) {
        const parsed = parsePathIndex(session.path, prefix);
        if (!parsed) continue;
        const newIdx = computeNewIndex(parsed.index, op);
        if (newIdx === null) {
          asyncSessions.delete(id);
        } else {
          session.path = prefix + String(newIdx) + parsed.suffix;
        }
      }
    },
    createSession(path, version) {
      const id = ++sessionCounter;
      asyncSessions.set(id, { path, version });
      return id;
    },
    getSession: (id) => asyncSessions.get(id),
    deleteSession: (id) => {
      asyncSessions.delete(id);
    }
  };
}

// src/utils/compare.ts
function isThenable(value) {
  return value != null && typeof value.then === "function";
}
function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const objA = a;
  const objB = b;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!isEqual(objA[key], objB[key])) return false;
  }
  return true;
}

// src/layers/values.ts
function valuesEnhancer(defaultValues) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        return {
          ...draft,
          values: setIn(base, ctx.path, ctx.value)
        };
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const arr = getInArray(base, ctx.path);
        return {
          ...draft,
          values: setIn(base, ctx.path, [...arr, ctx.value])
        };
      }
      case ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = getInArray(base, ctx.path);
        const next = arr.filter((_, i) => i !== ctx.index);
        return { ...draft, values: setIn(base, ctx.path, next) };
      }
      case ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        arr.splice(ctx.index, 0, ctx.value);
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        const [item] = arr.splice(ctx.from, 1);
        arr.splice(ctx.to, 0, item);
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const arr = [...getInArray(base, ctx.path)];
        const tmp = arr[ctx.from];
        arr[ctx.from] = arr[ctx.to];
        arr[ctx.to] = tmp;
        return { ...draft, values: setIn(base, ctx.path, arr) };
      }
      case ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        return { ...draft, values: setIn(base, ctx.path, ctx.value) };
      }
      case RESET_FORM: {
        const next = ctx.value ? { ...defaultValues, ...ctx.value } : defaultValues;
        return { ...draft, values: next };
      }
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const initial = getIn(defaultValues, ctx.path);
        return { ...draft, values: setIn(base, ctx.path, initial) };
      }
      case SET_TREE_VALUE: {
        const base = draft.values ?? prev.values;
        if (!ctx.path) return { ...draft, values: ctx.value };
        return { ...draft, values: setIn(base, ctx.path, ctx.value) };
      }
      case RESET_BRANCH: {
        if (!ctx.path) return { ...draft, values: defaultValues };
        const base = draft.values ?? prev.values;
        const initial = getIn(defaultValues, ctx.path);
        return { ...draft, values: setIn(base, ctx.path, initial) };
      }
      default:
        return draft;
    }
  };
}

// src/layers/touched.ts
function touchedEnhancer() {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case FOCUS: {
        if (!ctx.path) return { ...draft, focusedField: null };
        const touched = {
          ...draft.touchedFields ?? prev.touchedFields,
          [ctx.path]: true
        };
        return { ...draft, touchedFields: touched, focusedField: ctx.path };
      }
      case BLUR: {
        if (!ctx.path) return draft;
        const focus = prev.focusedField === ctx.path ? null : draft.focusedField ?? prev.focusedField;
        return { ...draft, focusedField: focus };
      }
      case SET_TOUCHED: {
        if (!ctx.path) return draft;
        const val = ctx.value !== false;
        const touched = {
          ...draft.touchedFields ?? prev.touchedFields,
          [ctx.path]: val
        };
        return { ...draft, touchedFields: touched };
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "remove", index: ctx.index }
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "insert", index: ctx.index }
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "move", from: ctx.from, to: ctx.to }
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.touchedFields ?? prev.touchedFields,
          ctx.path,
          { type: "swap", from: ctx.from, to: ctx.to }
        );
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let base = draft.touchedFields ?? prev.touchedFields;
        if (Object.keys(base).some((k) => k.startsWith(prefix))) {
          const next = {};
          for (const k of Object.keys(base)) {
            if (!k.startsWith(prefix) && base[k] !== void 0)
              next[k] = base[k];
          }
          base = next;
        }
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case RESET_FORM:
        return { ...draft, touchedFields: {}, focusedField: null };
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: rest };
      }
      case SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.touchedFields ?? prev.touchedFields;
        const newValues = draft.values ?? prev.values;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else if (hasPath(newValues, k) && base[k] !== void 0) {
            next[k] = base[k];
          }
        }
        return { ...draft, touchedFields: next };
      }
      case RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.touchedFields ?? prev.touchedFields;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== void 0) next[k] = base[k];
        }
        return { ...draft, touchedFields: next };
      }
      default:
        return draft;
    }
  };
}

// src/layers/dirty.ts
function arrayDirtyCheck(dirtyFields, draft, prev, path, defaultValues) {
  const values = draft.values ?? prev.values;
  const current = getIn(values, path);
  const initial = getIn(defaultValues, path);
  if (!isEqual(current, initial)) {
    return { ...draft, dirtyFields: { ...dirtyFields, [path]: true } };
  }
  const { [path]: _, ...rest } = dirtyFields;
  return { ...draft, dirtyFields: rest };
}
function dirtyEnhancer(defaultValues) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const values = draft.values ?? prev.values;
        const current = getIn(values, ctx.path);
        const initial = getIn(defaultValues, ctx.path);
        const isDirty = !isEqual(current, initial);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        if (isDirty) {
          return { ...draft, dirtyFields: { ...base, [ctx.path]: true } };
        }
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, dirtyFields: rest };
      }
      case SET_DIRTY: {
        if (!ctx.path) return draft;
        const val = ctx.value !== false;
        const base = draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: { ...base, [ctx.path]: val } };
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft,
          prev,
          ctx.path,
          defaultValues
        );
      }
      case ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "remove", index: ctx.index }
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "insert", index: ctx.index }
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "move", from: ctx.from, to: ctx.to }
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const base = reindexPathKeyedRecord(
          draft.dirtyFields ?? prev.dirtyFields,
          ctx.path,
          { type: "swap", from: ctx.from, to: ctx.to }
        );
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let base = draft.dirtyFields ?? prev.dirtyFields;
        if (Object.keys(base).some((k) => k.startsWith(prefix))) {
          const next = {};
          for (const k of Object.keys(base)) {
            if (!k.startsWith(prefix) && base[k] !== void 0)
              next[k] = base[k];
          }
          base = next;
        }
        return arrayDirtyCheck(base, draft, prev, ctx.path, defaultValues);
      }
      case RESET_FORM:
        return { ...draft, dirtyFields: {} };
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.dirtyFields ?? prev.dirtyFields;
        return { ...draft, dirtyFields: rest };
      }
      case SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        const newValues = draft.values ?? prev.values;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else if (hasPath(newValues, k)) {
            const current = getIn(newValues, k);
            const initial = getIn(defaultValues, k);
            if (!isEqual(current, initial)) next[k] = true;
          }
        }
        return { ...draft, dirtyFields: next };
      }
      case RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.dirtyFields ?? prev.dirtyFields;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== void 0) next[k] = base[k];
        }
        return { ...draft, dirtyFields: next };
      }
      default:
        return draft;
    }
  };
}

// src/layers/validation.ts
function validateArrayPath(errors, draft, prev, path, registry) {
  const entry = registry.get(path);
  if (entry?.validate && (entry.validateMode ?? "onChange") === "onChange") {
    const values = draft.values ?? prev.values;
    const error = entry.validate(getIn(values, path));
    return { ...draft, errors: { ...errors, [path]: error } };
  }
  return { ...draft, errors };
}
function validationEnhancer(registry) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate || (entry.validateMode ?? "onChange") !== "onChange")
          return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate || entry.validateMode !== "onBlur") return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case SET_ERROR: {
        if (!ctx.path) return draft;
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: ctx.value }
        };
      }
      case CLEAR_ERROR: {
        if (!ctx.path) return draft;
        const base = draft.errors ?? prev.errors;
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, errors: rest };
      }
      case ASYNC_RESOLVE: {
        if (!ctx.path) return draft;
        const pending = draft.pendingFields ?? prev.pendingFields;
        if (!pending[ctx.path]) return draft;
        const base = draft.errors ?? prev.errors;
        if (ctx.value)
          return {
            ...draft,
            errors: { ...base, [ctx.path]: ctx.value }
          };
        const { [ctx.path]: _, ...rest } = base;
        return { ...draft, errors: rest };
      }
      case CLEAR_ERRORS_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) next[k] = base[k];
        }
        return { ...draft, errors: next };
      }
      case VALIDATE_FIELD: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate) return draft;
        const values = draft.values ?? prev.values;
        const error = entry.validate(getIn(values, ctx.path));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry
        );
      }
      case ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "remove", index: ctx.index }
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "insert", index: ctx.index }
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "move", from: ctx.from, to: ctx.to }
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const errors = reindexPathKeyedRecord(
          draft.errors ?? prev.errors,
          ctx.path,
          { type: "swap", from: ctx.from, to: ctx.to }
        );
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        let errors = draft.errors ?? prev.errors;
        if (Object.keys(errors).some((k) => k.startsWith(prefix))) {
          const next = {};
          for (const k of Object.keys(errors)) {
            if (!k.startsWith(prefix)) next[k] = errors[k];
          }
          errors = next;
        }
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case SUBMIT: {
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const all = registry.getAll();
        all.forEach((entry, path) => {
          const error = entry.validate ? entry.validate(getIn(values, path)) : void 0;
          errors = { ...errors, [path]: error };
        });
        return { ...draft, errors };
      }
      case SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const newValues = draft.values ?? prev.values;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            next[k] = base[k];
          } else if (hasPath(newValues, k)) {
            next[k] = base[k];
          }
        }
        return { ...draft, errors: next };
      }
      case RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) next[k] = base[k];
        }
        return { ...draft, errors: next };
      }
      case VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path)) continue;
          const error = entry.validate ? entry.validate(getIn(values, path)) : void 0;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case RESET_FORM:
        return { ...draft, errors: {} };
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.errors ?? prev.errors;
        return { ...draft, errors: rest };
      }
      default:
        return draft;
    }
  };
}

// src/layers/schemaValidation.ts
function schemaValidateArrayPath(ctx, prev, draft, resolver, resolverMode) {
  if (!ctx.path || resolverMode !== "onChange") return draft;
  if (draft.errors?.[ctx.path]) return draft;
  const values = draft.values ?? prev.values;
  const allErrors = resolver.validate(values);
  const base = draft.errors ?? prev.errors;
  return { ...draft, errors: { ...base, [ctx.path]: allErrors[ctx.path] } };
}
function schemaValidationEnhancer(resolver, mode) {
  const resolverMode = mode ?? "onChange";
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] }
        };
      }
      case BLUR: {
        if (!ctx.path || resolverMode !== "onBlur") return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] }
        };
      }
      case VALIDATE_FIELD: {
        if (!ctx.path) return draft;
        if (draft.errors?.[ctx.path]) return draft;
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        const base = draft.errors ?? prev.errors;
        return {
          ...draft,
          errors: { ...base, [ctx.path]: allErrors[ctx.path] }
        };
      }
      case ARRAY_APPEND:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case ARRAY_REMOVE:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case ARRAY_INSERT:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case ARRAY_MOVE:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case ARRAY_SWAP:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case ARRAY_REPLACE:
        return schemaValidateArrayPath(
          ctx,
          prev,
          draft,
          resolver,
          resolverMode
        );
      case SUBMIT: {
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (errors[path]) continue;
          if (error) errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case SET_TREE_VALUE: {
        if (resolverMode !== "onChange") return draft;
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          if (error) errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const allErrors = resolver.validate(values);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          if (error) errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      default:
        return draft;
    }
  };
}

// src/layers/asyncValidation/utils.ts
function triggerArrayAsync(pendingBase, draft, prev, path, registry, dispatch) {
  const entry = registry.get(path);
  if (!entry?.asyncValidate) return { ...draft, pendingFields: pendingBase };
  if (draft.errors?.[path]) {
    registry.nextVersion(path);
    registry.clearTimer(path);
    const { [path]: _2, ...rest } = pendingBase;
    return { ...draft, pendingFields: rest };
  }
  if ((entry.asyncValidateMode ?? "onChange") !== "onChange")
    return { ...draft, pendingFields: pendingBase };
  const value = getIn(draft.values ?? prev.values, path);
  const errors = draft.errors ?? prev.errors;
  const { [path]: _, ...clearedErrors } = errors;
  const pending = { ...pendingBase, [path]: true };
  queueMicrotask(
    () => runAsync(path, value, entry, dispatch, registry)
  );
  return { ...draft, errors: clearedErrors, pendingFields: pending };
}
function runAsync(path, value, entry, dispatch, registry) {
  if (entry.debounce && entry.debounce > 0) {
    const sessionId = registry.createSession(path, 0);
    registry.nextVersion(path);
    registry.setTimer(
      path,
      setTimeout(() => {
        const session = registry.getSession(sessionId);
        if (!session) return;
        const currentPath = session.path;
        const version = registry.nextVersion(currentPath);
        session.version = version;
        void entry.asyncValidate(value).then((error) => {
          const s = registry.getSession(sessionId);
          if (!s) return;
          if (registry.getVersion(s.path) !== s.version) return;
          dispatch({ type: ASYNC_RESOLVE, path: s.path, value: error });
          registry.deleteSession(sessionId);
        });
      }, entry.debounce)
    );
  } else {
    const version = registry.nextVersion(path);
    const sessionId = registry.createSession(path, version);
    void entry.asyncValidate(value).then((error) => {
      const session = registry.getSession(sessionId);
      if (!session) return;
      if (registry.getVersion(session.path) !== session.version) return;
      dispatch({ type: ASYNC_RESOLVE, path: session.path, value: error });
      registry.deleteSession(sessionId);
    });
  }
}

// src/layers/asyncValidation/index.ts
function asyncValidationEnhancer(registry, dispatch) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.asyncValidate) return draft;
        if (draft.errors?.[ctx.path]) {
          registry.nextVersion(ctx.path);
          registry.clearTimer(ctx.path);
          const { [ctx.path]: _2, ...rest } = draft.pendingFields ?? prev.pendingFields;
          return { ...draft, pendingFields: rest };
        }
        if ((entry.asyncValidateMode ?? "onChange") !== "onChange")
          return draft;
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path];
        if (!dirty) return draft;
        const value = getIn(draft.values ?? prev.values, ctx.path);
        const path = ctx.path;
        const errors = draft.errors ?? prev.errors;
        const { [path]: _, ...clearedErrors } = errors;
        const pending = {
          ...draft.pendingFields ?? prev.pendingFields,
          [path]: true
        };
        queueMicrotask(
          () => runAsync(path, value, entry, dispatch, registry)
        );
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.asyncValidate) return draft;
        if (draft.errors?.[ctx.path]) {
          registry.nextVersion(ctx.path);
          registry.clearTimer(ctx.path);
          const { [ctx.path]: _2, ...rest } = draft.pendingFields ?? prev.pendingFields;
          return { ...draft, pendingFields: rest };
        }
        if (entry.asyncValidateMode !== "onBlur") return draft;
        const dirty = (draft.dirtyFields ?? prev.dirtyFields)[ctx.path];
        if (!dirty) return draft;
        const value = getIn(draft.values ?? prev.values, ctx.path);
        const path = ctx.path;
        const errors = draft.errors ?? prev.errors;
        const { [path]: _, ...clearedErrors } = errors;
        const pending = {
          ...draft.pendingFields ?? prev.pendingFields,
          [path]: true
        };
        queueMicrotask(
          () => runAsync(path, value, entry, dispatch, registry)
        );
        return { ...draft, errors: clearedErrors, pendingFields: pending };
      }
      case ASYNC_RESOLVE: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const pendingBase = draft.pendingFields ?? prev.pendingFields;
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        registry.reindex(ctx.path, { type: "remove", index: ctx.index });
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          { type: "remove", index: ctx.index }
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        registry.reindex(ctx.path, { type: "insert", index: ctx.index });
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          { type: "insert", index: ctx.index }
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case ARRAY_MOVE: {
        if (!ctx.path) return draft;
        const op = { type: "move", from: ctx.from, to: ctx.to };
        registry.reindex(ctx.path, op);
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          op
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case ARRAY_SWAP: {
        if (!ctx.path) return draft;
        const op = { type: "swap", from: ctx.from, to: ctx.to };
        registry.reindex(ctx.path, op);
        const pendingBase = reindexPathKeyedRecord(
          draft.pendingFields ?? prev.pendingFields,
          ctx.path,
          op
        );
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case ARRAY_REPLACE: {
        if (!ctx.path) return draft;
        const prefix = ctx.path + ".";
        const all = registry.getAll();
        for (const [p] of all) {
          if (p.startsWith(prefix)) {
            registry.nextVersion(p);
            registry.clearTimer(p);
          }
        }
        let pendingBase = draft.pendingFields ?? prev.pendingFields;
        if (Object.keys(pendingBase).some((k) => k.startsWith(prefix))) {
          const next = {};
          for (const k of Object.keys(pendingBase)) {
            if (!k.startsWith(prefix) && pendingBase[k] !== void 0)
              next[k] = pendingBase[k];
          }
          pendingBase = next;
        }
        return triggerArrayAsync(
          pendingBase,
          draft,
          prev,
          ctx.path,
          registry,
          dispatch
        );
      }
      case RESET_FORM:
        return { ...draft, pendingFields: {} };
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const { [ctx.path]: _, ...rest } = draft.pendingFields ?? prev.pendingFields;
        return { ...draft, pendingFields: rest };
      }
      case SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const newValues = draft.values ?? prev.values;
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path) && !hasPath(newValues, path)) {
            registry.nextVersion(path);
            registry.clearTimer(path);
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else if (hasPath(newValues, k) && base[k] !== void 0) {
            next[k] = base[k];
          }
        }
        return { ...draft, pendingFields: next };
      }
      case RESET_BRANCH: {
        const match = treeMatcher(ctx.path);
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path)) {
            registry.nextVersion(path);
            registry.clearTimer(path);
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k) && base[k] !== void 0) next[k] = base[k];
        }
        return { ...draft, pendingFields: next };
      }
      case VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        let errors = draft.errors ?? prev.errors;
        let pending = draft.pendingFields ?? prev.pendingFields;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path) || !entry.asyncValidate) continue;
          if (errors[path]) continue;
          const value = getIn(values, path);
          const { [path]: _, ...clearedErrors } = errors;
          errors = clearedErrors;
          pending = { ...pending, [path]: true };
          queueMicrotask(
            () => runAsync(path, value, entry, dispatch, registry)
          );
        }
        return { ...draft, errors, pendingFields: pending };
      }
      default:
        return draft;
    }
  };
}

// src/layers/submit.ts
function submitEnhancer() {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SUBMIT:
        return {
          ...draft,
          isSubmitting: true,
          submitCount: prev.submitCount + 1,
          isSubmitSuccessful: false
        };
      case SUBMIT_SUCCESS:
        return { ...draft, isSubmitting: false, isSubmitSuccessful: true };
      case SUBMIT_FAILURE:
        return { ...draft, isSubmitting: false, isSubmitSuccessful: false };
      case RESET_FORM:
        return {
          ...draft,
          isSubmitting: false,
          submitCount: 0,
          isSubmitSuccessful: false
        };
      default:
        return draft;
    }
  };
}

// src/core/createForm.ts
function createForm(config) {
  const baseInitialState = {
    values: {},
    dirtyFields: {},
    touchedFields: {},
    errors: {},
    pendingFields: {},
    focusedField: null,
    isSubmitting: false,
    submitCount: 0,
    isSubmitSuccessful: false,
    ...config.initialState
  };
  const previewEnhancers = config.enhancers ? config.enhancers([]) : [];
  let initialState = baseInitialState;
  for (const e of previewEnhancers) {
    if (e.initialState) {
      const patch = typeof e.initialState === "function" ? e.initialState(initialState) : e.initialState;
      initialState = { ...initialState, ...patch };
    }
  }
  const defaultValues = initialState.values;
  const initializer = () => initialState;
  const store = vanilla.createStore()(
    config.middleware ? config.middleware(initializer) : initializer
  );
  const registry = createFieldRegistry(dispatch);
  const defaultEnhancers = [
    {
      name: "values",
      enhancer: valuesEnhancer(defaultValues)
    },
    { name: "touched", enhancer: touchedEnhancer() },
    { name: "dirty", enhancer: dirtyEnhancer(defaultValues) },
    {
      name: "validation",
      enhancer: validationEnhancer(registry)
    },
    ...config.resolver ? [
      {
        name: "schemaValidation",
        enhancer: schemaValidationEnhancer(
          config.resolver,
          config.resolverMode
        )
      }
    ] : [],
    {
      name: "asyncValidation",
      enhancer: asyncValidationEnhancer(registry, dispatch)
    },
    { name: "submit", enhancer: submitEnhancer() }
  ];
  const enhancers = config.enhancers ? config.enhancers(defaultEnhancers) : defaultEnhancers;
  function dispatch(ctx) {
    const prev = store.getState();
    let draft = {};
    const skip = ctx.options?.disableLayers;
    for (const e of enhancers) {
      if (skip && e.name && skip.includes(e.name)) continue;
      draft = e.enhancer(ctx, prev, draft);
    }
    if (Object.keys(draft).length > 0) {
      const action = ctx.path ? `${ctx.type}:${ctx.path}` : ctx.type;
      store.setState((s) => ({ ...s, ...draft }), false, action);
    }
  }
  const select = {
    values: (s) => s.values,
    isSubmitting: (s) => s.isSubmitting,
    submitCount: (s) => s.submitCount,
    isSubmitSuccessful: (s) => s.isSubmitSuccessful,
    focusedField: (s) => s.focusedField
  };
  return {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    getInitialState: store.getInitialState,
    field: createFieldNamespace(store, dispatch),
    fieldArray: createFieldArrayNamespace(store, dispatch),
    tree: createTreeNamespace(store, dispatch),
    getValues: () => store.getState().values,
    isSubmitting: () => store.getState().isSubmitting,
    submitCount: () => store.getState().submitCount,
    isSubmitSuccessful: () => store.getState().isSubmitSuccessful,
    reset: (nextValues, opts) => dispatch({ type: RESET_FORM, value: nextValues, options: opts }),
    handleSubmit: (onValid, onInvalid) => (e) => {
      e?.preventDefault();
      dispatch({ type: SUBMIT });
      const state = store.getState();
      const errorKeys = Object.keys(state.errors).filter(
        (k) => state.errors[k] !== void 0
      );
      if (errorKeys.length > 0) {
        dispatch({ type: SUBMIT_FAILURE });
        if (onInvalid) {
          const errs = {};
          for (const k of errorKeys) errs[k] = state.errors[k];
          onInvalid(errs);
        }
        return;
      }
      const result = onValid(state.values);
      if (isThenable(result)) {
        return result.then(
          () => dispatch({ type: SUBMIT_SUCCESS }),
          () => dispatch({ type: SUBMIT_FAILURE })
        );
      } else {
        dispatch({ type: SUBMIT_SUCCESS });
      }
    },
    registerField: (path, entry) => registry.register(path, entry),
    unregisterField: (path) => registry.unregister(path),
    select
  };
}

// src/validation/standardSchemaResolver.ts
function issuePath(issue) {
  if (!issue.path) return "";
  return issue.path.map(
    (seg) => typeof seg === "object" && seg !== null && "key" in seg ? seg.key : seg
  ).join(".");
}
function standardSchemaResolver(schema) {
  return {
    validate(values) {
      const result = schema["~standard"].validate(values);
      if (result instanceof Promise) return {};
      const errors = {};
      if (result.issues) {
        for (const issue of result.issues) {
          const path = issuePath(issue);
          if (path && !errors[path]) {
            errors[path] = issue.message;
          }
        }
      }
      return errors;
    }
  };
}

exports.Actions = actions_exports;
exports.asyncValidationEnhancer = asyncValidationEnhancer;
exports.createForm = createForm;
exports.dirtyEnhancer = dirtyEnhancer;
exports.getIn = getIn;
exports.reindexPathKeyedRecord = reindexPathKeyedRecord;
exports.schemaValidationEnhancer = schemaValidationEnhancer;
exports.standardSchemaResolver = standardSchemaResolver;
exports.submitEnhancer = submitEnhancer;
exports.touchedEnhancer = touchedEnhancer;
exports.validationEnhancer = validationEnhancer;
exports.valuesEnhancer = valuesEnhancer;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map