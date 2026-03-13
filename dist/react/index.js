import { createContext, useRef, useCallback, useContext, useMemo, useEffect } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { createStore } from 'zustand/vanilla';
import { shallow } from 'zustand/shallow';

// src/react/useForm.ts

// src/core/actions.ts
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
var ARRAY_SORT = "ARRAY_SORT";
var RESET_FORM = "RESET_FORM";
var SUBMIT = "SUBMIT";
var SUBMIT_SUCCESS = "SUBMIT_SUCCESS";
var SUBMIT_FAILURE = "SUBMIT_FAILURE";

// src/utils/cache.ts
function cached(map, key, factory) {
  let entry = map.get(key);
  if (!entry) {
    entry = factory();
    map.set(key, entry);
  }
  return entry;
}

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

// src/utils/arrayKeys.ts
function isArrayKey(segment) {
  return segment.length > 2 && segment.charCodeAt(0) === 95 && segment.charCodeAt(1) === 107 && /^\d+$/.test(segment.slice(2));
}
function indexPathToKeyPath(path, arrayKeys) {
  const segments = path.split(".");
  const result = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (isArrayKey(seg)) {
      result.push(seg);
    } else if (/^\d+$/.test(seg)) {
      const parentPath = result.join(".");
      const keys = arrayKeys[parentPath];
      if (keys) {
        const index = Number(seg);
        if (index >= 0 && index < keys.length) {
          result.push(keys[index]);
        } else {
          result.push(seg);
        }
      } else {
        result.push(seg);
      }
    } else {
      result.push(seg);
    }
  }
  return result.join(".");
}
function keyPathToIndexPath(path, arrayKeys) {
  const segments = path.split(".");
  const result = [];
  const keyResult = [];
  for (const seg of segments) {
    if (isArrayKey(seg)) {
      const parentKeyPath = keyResult.join(".");
      const keys = arrayKeys[parentKeyPath];
      if (keys) {
        const idx = keys.indexOf(seg);
        result.push(idx >= 0 ? String(idx) : seg);
      } else {
        result.push(seg);
      }
      keyResult.push(seg);
    } else {
      result.push(seg);
      keyResult.push(seg);
    }
  }
  return result.join(".");
}
function scanArrayKeys(value, parentKeyPath, startCounter) {
  const arrayKeys = {};
  let counter = startCounter;
  function scan(val, keyPath) {
    if (Array.isArray(val)) {
      const keys = [];
      for (let i = 0; i < val.length; i++) {
        const key = "_k" + counter++;
        keys.push(key);
        scan(val[i], keyPath ? keyPath + "." + key : key);
      }
      arrayKeys[keyPath] = keys;
    } else if (val != null && typeof val === "object") {
      for (const [prop, child] of Object.entries(val)) {
        scan(child, keyPath ? keyPath + "." + prop : prop);
      }
    }
  }
  scan(value, parentKeyPath);
  return { arrayKeys, nextCounter: counter };
}
function generateKey(counter) {
  return { key: "_k" + counter, nextCounter: counter + 1 };
}
function removeByPrefix(record, keyPrefix) {
  const dotPrefix = keyPrefix + ".";
  let hasMatch = false;
  for (const k of Object.keys(record)) {
    if (k === keyPrefix || k.startsWith(dotPrefix)) {
      hasMatch = true;
      break;
    }
  }
  if (!hasMatch) return record;
  const next = {};
  for (const k of Object.keys(record)) {
    if (k !== keyPrefix && !k.startsWith(dotPrefix)) {
      next[k] = record[k];
    }
  }
  return next;
}
function unflattenToNested(flatEntries, arrayKeys, keyPrefix) {
  const prefixIndex = keyPrefix ? keyPathToIndexPath(keyPrefix, arrayKeys) : void 0;
  const stripLen = prefixIndex ? prefixIndex.length + 1 : 0;
  const entries = [];
  for (const [keyPath, value] of flatEntries) {
    const fullIndex = keyPathToIndexPath(keyPath, arrayKeys);
    const rel = stripLen > 0 ? fullIndex.slice(stripLen) : fullIndex;
    if (!rel) continue;
    entries.push([rel, value]);
  }
  if (entries.length === 0) return {};
  const firstSeg = entries[0][0].split(".")[0];
  const root = /^\d+$/.test(firstSeg) ? [] : {};
  for (const [path, value] of entries) {
    const segments = path.split(".");
    let current = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const key = /^\d+$/.test(seg) ? Number(seg) : seg;
      if (current[key] == null) {
        const nextSeg = segments[i + 1];
        current[key] = /^\d+$/.test(nextSeg) ? [] : {};
      }
      current = current[key];
    }
    const last = segments[segments.length - 1];
    current[/^\d+$/.test(last) ? Number(last) : last] = value;
  }
  return root;
}
function getValueAtKeyPath(values, keyPath, arrayKeys) {
  return getIn(values, keyPathToIndexPath(keyPath, arrayKeys));
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
  function memoKeyPath(path) {
    let prevAk = null;
    let prevKp = path;
    return (ak) => {
      if (ak !== prevAk) {
        prevAk = ak;
        prevKp = indexPathToKeyPath(path, ak);
      }
      return prevKp;
    };
  }
  return {
    value: (path) => cached(
      cache.value,
      path,
      () => (s) => getValueAtKeyPath(s.values, path, s.arrayKeys)
    ),
    error: (path) => cached(cache.error, path, () => {
      const kp = memoKeyPath(path);
      return (s) => s.errors[kp(s.arrayKeys)];
    }),
    dirty: (path) => cached(cache.dirty, path, () => {
      const kp = memoKeyPath(path);
      return (s) => s.dirtyFields[kp(s.arrayKeys)] ?? false;
    }),
    touched: (path) => cached(cache.touched, path, () => {
      const kp = memoKeyPath(path);
      return (s) => s.touchedFields[kp(s.arrayKeys)] ?? false;
    }),
    pending: (path) => cached(cache.pending, path, () => {
      const kp = memoKeyPath(path);
      return (s) => s.pendingFields[kp(s.arrayKeys)] ?? false;
    }),
    focused: (path) => cached(cache.focused, path, () => {
      const kp = memoKeyPath(path);
      return (s) => s.focusedField === kp(s.arrayKeys);
    }),
    fieldState: (path) => cached(cache.fieldState, path, () => {
      const kp = memoKeyPath(path);
      return (s) => {
        const k = kp(s.arrayKeys);
        return {
          dirty: s.dirtyFields[k] ?? false,
          touched: s.touchedFields[k] ?? false,
          error: s.errors[k],
          pending: s.pendingFields[k] ?? false,
          focused: s.focusedField === k
        };
      };
    }),
    inputProps: (path) => cached(cache.inputProps, path, () => {
      const onChange = (v) => dispatch({ type: SET_VALUE, path, value: v });
      const onBlur = () => dispatch({ type: BLUR, path });
      const onFocus = () => dispatch({ type: FOCUS, path });
      let prevValues = null;
      let prevAk = null;
      let prevResult = null;
      return (s) => {
        if (s.values === prevValues && s.arrayKeys === prevAk)
          return prevResult;
        prevValues = s.values;
        prevAk = s.arrayKeys;
        prevResult = {
          value: getValueAtKeyPath(s.values, path, s.arrayKeys),
          onChange,
          onBlur,
          onFocus
        };
        return prevResult;
      };
    })
  };
}

// src/field/createField.ts
function createFieldNamespace(store, dispatch) {
  const s = () => store.getState();
  const kp = (path) => indexPathToKeyPath(path, s().arrayKeys);
  return {
    getValue: (path) => {
      const state = s();
      return getValueAtKeyPath(state.values, path, state.arrayKeys);
    },
    isDirty: (path) => s().dirtyFields[kp(path)] === true,
    isTouched: (path) => s().touchedFields[kp(path)] === true,
    isPending: (path) => s().pendingFields[kp(path)] === true,
    getError: (path) => s().errors[kp(path)],
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
  const kp = (path) => indexPathToKeyPath(path, s().arrayKeys);
  const lengthCache = /* @__PURE__ */ new Map();
  const keysCache = /* @__PURE__ */ new Map();
  return {
    getLength: (path) => (s().arrayKeys[kp(path)] ?? []).length,
    getKeys: (path) => s().arrayKeys[kp(path)] ?? [],
    append: (path, v, opts) => dispatch({ type: ARRAY_APPEND, path, value: v, options: opts }),
    prepend: (path, v, opts) => dispatch({ type: ARRAY_INSERT, path, index: 0, value: v, options: opts }),
    remove: (path, i, opts) => dispatch({ type: ARRAY_REMOVE, path, index: i, options: opts }),
    insert: (path, i, v, opts) => dispatch({ type: ARRAY_INSERT, path, index: i, value: v, options: opts }),
    move: (path, f, t, opts) => dispatch({ type: ARRAY_MOVE, path, from: f, to: t, options: opts }),
    replace: (path, v, opts) => dispatch({ type: SET_TREE_VALUE, path, value: v, options: opts }),
    swap: (path, a, b, opts) => dispatch({ type: ARRAY_SWAP, path, from: a, to: b, options: opts }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort: (path, comparator, opts) => {
      const state = s();
      const arr = getInArray(state.values, path);
      const indices = arr.map((_, i) => i);
      indices.sort((a, b) => comparator(arr[a], arr[b]));
      dispatch({ type: ARRAY_SORT, path, permutation: indices, options: opts });
    },
    reorder: (path, permutation, opts) => dispatch({ type: ARRAY_SORT, path, permutation, options: opts }),
    select: {
      length: (path) => cached(
        lengthCache,
        path,
        () => (s2) => {
          const keyPath = indexPathToKeyPath(path, s2.arrayKeys);
          return (s2.arrayKeys[keyPath] ?? []).length;
        }
      ),
      keys: (path) => cached(
        keysCache,
        path,
        () => (s2) => {
          const keyPath = indexPathToKeyPath(path, s2.arrayKeys);
          return s2.arrayKeys[keyPath] ?? [];
        }
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
  function keyPrefixFor(path, ak) {
    return path ? indexPathToKeyPath(path, ak) : void 0;
  }
  function matchFor(path, ak) {
    return getMatcher(keyPrefixFor(path, ak));
  }
  function* boolEntries(record, match) {
    for (const k of Object.keys(record)) {
      if (match(k)) yield [k, true];
    }
  }
  return {
    dirty: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.dirty,
        k,
        () => (s) => Object.keys(s.dirtyFields).some(matchFor(path, s.arrayKeys))
      );
    },
    touched: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.touched,
        k,
        () => (s) => Object.keys(s.touchedFields).some(matchFor(path, s.arrayKeys))
      );
    },
    pending: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.pending,
        k,
        () => (s) => Object.keys(s.pendingFields).some(matchFor(path, s.arrayKeys))
      );
    },
    valid: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.valid,
        k,
        () => (s) => {
          const match = matchFor(path, s.arrayKeys);
          return !Object.keys(s.errors).some(
            (key) => match(key) && s.errors[key] !== void 0
          );
        }
      );
    },
    errors: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.errors,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          const flat = filterErrors(s, match);
          return unflattenToNested(
            Object.entries(flat),
            s.arrayKeys,
            kp
          );
        }
      );
    },
    dirtyFields: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.dirtyFields,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          return unflattenToNested(
            boolEntries(s.dirtyFields, match),
            s.arrayKeys,
            kp
          );
        }
      );
    },
    touchedFields: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.touchedFields,
        k,
        () => (s) => {
          const kp = keyPrefixFor(path, s.arrayKeys);
          const match = getMatcher(kp);
          return unflattenToNested(
            boolEntries(s.touchedFields, match),
            s.arrayKeys,
            kp
          );
        }
      );
    },
    errorCount: (path) => {
      const k = cacheKey(path);
      return cached(
        cache.errorCount,
        k,
        () => (s) => {
          const match = matchFor(path, s.arrayKeys);
          return Object.keys(s.errors).filter(
            (key) => match(key) && s.errors[key] !== void 0
          ).length;
        }
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
  function keyPrefixFor(path, ak) {
    return path ? indexPathToKeyPath(path, ak) : void 0;
  }
  function matchFor(path, ak) {
    return getMatcher(keyPrefixFor(path, ak));
  }
  function filterErrors(state, match) {
    const result = {};
    for (const k of Object.keys(state.errors)) {
      const v = state.errors[k];
      if (match(k) && v !== void 0) result[k] = v;
    }
    return result;
  }
  function* boolEntries(record, match) {
    for (const k of Object.keys(record)) {
      if (match(k)) yield [k, true];
    }
  }
  return {
    isDirty: (path) => {
      const state = s();
      return Object.keys(state.dirtyFields).some(matchFor(path, state.arrayKeys));
    },
    isTouched: (path) => {
      const state = s();
      return Object.keys(state.touchedFields).some(matchFor(path, state.arrayKeys));
    },
    isPending: (path) => {
      const state = s();
      return Object.keys(state.pendingFields).some(matchFor(path, state.arrayKeys));
    },
    isValid: (path) => {
      const state = s();
      const match = matchFor(path, state.arrayKeys);
      return !Object.keys(state.errors).some(
        (k) => match(k) && state.errors[k] !== void 0
      );
    },
    getErrors: (path) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      const flat = filterErrors(state, match);
      return unflattenToNested(
        Object.entries(flat),
        state.arrayKeys,
        kp
      );
    },
    getDirtyFields: (path) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      return unflattenToNested(
        boolEntries(state.dirtyFields, match),
        state.arrayKeys,
        kp
      );
    },
    getTouchedFields: (path) => {
      const state = s();
      const kp = keyPrefixFor(path, state.arrayKeys);
      const match = getMatcher(kp);
      return unflattenToNested(
        boolEntries(state.touchedFields, match),
        state.arrayKeys,
        kp
      );
    },
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

// src/validation/registry.ts
function createFieldRegistry(dispatch) {
  const validators = /* @__PURE__ */ new Map();
  const asyncVersions = /* @__PURE__ */ new Map();
  const asyncTimers = /* @__PURE__ */ new Map();
  return {
    register(path, entry) {
      validators.set(path, entry);
      if (!asyncVersions.has(path)) asyncVersions.set(path, 0);
    },
    unregister(path) {
      validators.delete(path);
      const timer = asyncTimers.get(path);
      if (timer) clearTimeout(timer);
      asyncTimers.delete(path);
      if (asyncVersions.has(path)) {
        asyncVersions.set(path, asyncVersions.get(path) + 1);
      }
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
    removeByPrefix(prefix) {
      const dotPrefix = prefix + ".";
      for (const [p] of validators) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          validators.delete(p);
        }
      }
      for (const [p, timer] of asyncTimers) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          clearTimeout(timer);
          asyncTimers.delete(p);
        }
      }
      for (const [p] of asyncVersions) {
        if (p === prefix || p.startsWith(dotPrefix)) {
          asyncVersions.delete(p);
        }
      }
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

// src/core/initialState.ts
function buildInitialState(configInitialState, previewEnhancers) {
  const base = {
    values: {},
    arrayKeys: {},
    _keyCounter: 0,
    dirtyFields: {},
    touchedFields: {},
    errors: {},
    pendingFields: {},
    focusedField: null,
    isSubmitting: false,
    submitCount: 0,
    isSubmitSuccessful: false,
    ...configInitialState
  };
  let merged = base;
  for (const e of previewEnhancers) {
    if (e.initialState) {
      const patch = typeof e.initialState === "function" ? e.initialState(merged) : e.initialState;
      merged = { ...merged, ...patch };
    }
  }
  const defaultValues = merged.values;
  const { arrayKeys: initAk, nextCounter: initCounter } = scanArrayKeys(merged.values, "", merged._keyCounter);
  const initialState = {
    ...merged,
    arrayKeys: initAk,
    _keyCounter: initCounter
  };
  return {
    initialState,
    defaultValues,
    initialArrayKeys: initAk
  };
}

// src/layers/values.ts
function rescanSubtree(ak, keyPath, value, counter) {
  let newAk = removeByPrefix(ak, keyPath);
  if (newAk === ak) newAk = { ...ak };
  const scanned = scanArrayKeys(value, keyPath, counter);
  return {
    arrayKeys: { ...newAk, ...scanned.arrayKeys },
    counter: scanned.nextCounter
  };
}
function valuesEnhancer(defaultValues, initialArrayKeys) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const newValues = setIn(base, indexPath, ctx.value);
        let newAk = ak;
        if (ctx.value != null && typeof ctx.value === "object") {
          const cleaned = removeByPrefix(ak, ctx.path);
          const scanned = scanArrayKeys(ctx.value, ctx.path, counter);
          if (Object.keys(scanned.arrayKeys).length > 0 || cleaned !== ak) {
            newAk = { ...cleaned === ak ? ak : cleaned, ...scanned.arrayKeys };
            counter = scanned.nextCounter;
          }
        }
        const result = { ...draft, values: newValues };
        if (newAk !== ak) {
          result.arrayKeys = newAk;
          result._keyCounter = counter;
        }
        return result;
      }
      case ARRAY_APPEND: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = [...getInArray(base, indexPath), ctx.value];
        const newValues = setIn(base, indexPath, arr);
        const { key, nextCounter } = generateKey(counter);
        counter = nextCounter;
        const elementKeyPath = ctx.path + "." + key;
        const scanned = scanArrayKeys(ctx.value, elementKeyPath, counter);
        counter = scanned.nextCounter;
        const keys = [...ak[ctx.path] ?? [], key];
        return {
          ...draft,
          values: newValues,
          arrayKeys: { ...ak, ...scanned.arrayKeys, [ctx.path]: keys },
          _keyCounter: counter
        };
      }
      case ARRAY_REMOVE: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = getInArray(base, indexPath).filter(
          (_, i) => i !== ctx.index
        );
        const newValues = setIn(base, indexPath, arr);
        const keys = ak[ctx.path] ?? [];
        const removedKey = keys[ctx.index];
        const newKeys = keys.filter((_, i) => i !== ctx.index);
        let newAk = { ...ak, [ctx.path]: newKeys };
        if (removedKey) {
          newAk = removeByPrefix(newAk, ctx.path + "." + removedKey);
        }
        return { ...draft, values: newValues, arrayKeys: newAk };
      }
      case ARRAY_INSERT: {
        if (!ctx.path || ctx.index == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = [...getInArray(base, indexPath)];
        arr.splice(ctx.index, 0, ctx.value);
        const newValues = setIn(base, indexPath, arr);
        const { key, nextCounter } = generateKey(counter);
        counter = nextCounter;
        const elementKeyPath = ctx.path + "." + key;
        const scanned = scanArrayKeys(ctx.value, elementKeyPath, counter);
        counter = scanned.nextCounter;
        const keys = [...ak[ctx.path] ?? []];
        keys.splice(ctx.index, 0, key);
        return {
          ...draft,
          values: newValues,
          arrayKeys: { ...ak, ...scanned.arrayKeys, [ctx.path]: keys },
          _keyCounter: counter
        };
      }
      case ARRAY_MOVE: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = [...getInArray(base, indexPath)];
        const [item] = arr.splice(ctx.from, 1);
        arr.splice(ctx.to, 0, item);
        const keys = [...ak[ctx.path] ?? []];
        const [movedKey] = keys.splice(ctx.from, 1);
        keys.splice(ctx.to, 0, movedKey);
        return {
          ...draft,
          values: setIn(base, indexPath, arr),
          arrayKeys: { ...ak, [ctx.path]: keys }
        };
      }
      case ARRAY_SWAP: {
        if (!ctx.path || ctx.from == null || ctx.to == null) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = [...getInArray(base, indexPath)];
        const tmp = arr[ctx.from];
        arr[ctx.from] = arr[ctx.to];
        arr[ctx.to] = tmp;
        const keys = [...ak[ctx.path] ?? []];
        const tmpKey = keys[ctx.from];
        keys[ctx.from] = keys[ctx.to];
        keys[ctx.to] = tmpKey;
        return {
          ...draft,
          values: setIn(base, indexPath, arr),
          arrayKeys: { ...ak, [ctx.path]: keys }
        };
      }
      case ARRAY_SORT: {
        if (!ctx.path || !ctx.permutation) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const indexPath = keyPathToIndexPath(ctx.path, ak);
        const arr = getInArray(base, indexPath);
        const sortedArr = ctx.permutation.map((i) => arr[i]);
        const keys = ak[ctx.path] ?? [];
        const sortedKeys = ctx.permutation.map((i) => keys[i]);
        return {
          ...draft,
          values: setIn(base, indexPath, sortedArr),
          arrayKeys: { ...ak, [ctx.path]: sortedKeys }
        };
      }
      case RESET_FORM: {
        const next = ctx.value ? { ...defaultValues, ...ctx.value } : defaultValues;
        const counter = draft._keyCounter ?? prev._keyCounter;
        const scanned = scanArrayKeys(next, "", counter);
        return {
          ...draft,
          values: next,
          arrayKeys: scanned.arrayKeys,
          _keyCounter: scanned.nextCounter
        };
      }
      case RESET_FIELD: {
        if (!ctx.path) return draft;
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const initial = getIn(defaultValues, originalIndexPath);
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const sub = rescanSubtree(ak, ctx.path, initial, counter);
        counter = sub.counter;
        return {
          ...draft,
          values: setIn(base, currentIndexPath, initial),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter
        };
      }
      case SET_TREE_VALUE: {
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        if (!ctx.path) {
          const scanned = scanArrayKeys(ctx.value, "", counter);
          return {
            ...draft,
            values: ctx.value,
            arrayKeys: scanned.arrayKeys,
            _keyCounter: scanned.nextCounter
          };
        }
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const sub = rescanSubtree(ak, ctx.path, ctx.value, counter);
        counter = sub.counter;
        return {
          ...draft,
          values: setIn(base, currentIndexPath, ctx.value),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter
        };
      }
      case RESET_BRANCH: {
        const base = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let counter = draft._keyCounter ?? prev._keyCounter;
        if (!ctx.path) {
          const scanned = scanArrayKeys(defaultValues, "", counter);
          return {
            ...draft,
            values: defaultValues,
            arrayKeys: scanned.arrayKeys,
            _keyCounter: scanned.nextCounter
          };
        }
        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const initial = getIn(defaultValues, originalIndexPath);
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const sub = rescanSubtree(ak, ctx.path, initial, counter);
        counter = sub.counter;
        return {
          ...draft,
          values: setIn(base, currentIndexPath, initial),
          arrayKeys: sub.arrayKeys,
          _keyCounter: counter
        };
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
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index];
        let base = draft.touchedFields ?? prev.touchedFields;
        if (removedKey) {
          base = removeByPrefix(base, ctx.path + "." + removedKey);
        }
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
        return { ...draft, touchedFields: { ...base, [ctx.path]: true } };
      }
      case ARRAY_MOVE:
      case ARRAY_SWAP:
      case ARRAY_SORT: {
        if (!ctx.path) return draft;
        const base = draft.touchedFields ?? prev.touchedFields;
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath) && base[k] !== void 0) {
              next[k] = base[k];
            }
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
function arrayDirtyCheck(dirtyFields, draft, prev, path, defaultValues, initialArrayKeys) {
  const values = draft.values ?? prev.values;
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const currentIndexPath = keyPathToIndexPath(path, ak);
  const originalIndexPath = keyPathToIndexPath(path, initialArrayKeys);
  const currentVal = getIn(values, currentIndexPath);
  const initialVal = getIn(defaultValues, originalIndexPath);
  if (!isEqual(currentVal, initialVal)) {
    return { ...draft, dirtyFields: { ...dirtyFields, [path]: true } };
  }
  const { [path]: _, ...rest } = dirtyFields;
  return { ...draft, dirtyFields: rest };
}
function dirtyEnhancer(defaultValues, initialArrayKeys) {
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path) return draft;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const currentIndexPath = keyPathToIndexPath(ctx.path, ak);
        const originalIndexPath = keyPathToIndexPath(ctx.path, initialArrayKeys);
        const current = getIn(values, currentIndexPath);
        const initial = getIn(defaultValues, originalIndexPath);
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
          defaultValues,
          initialArrayKeys
        );
      }
      case ARRAY_REMOVE: {
        if (!ctx.path) return draft;
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index];
        let base = draft.dirtyFields ?? prev.dirtyFields;
        if (removedKey) {
          base = removeByPrefix(base, ctx.path + "." + removedKey);
        }
        return arrayDirtyCheck(
          base,
          draft,
          prev,
          ctx.path,
          defaultValues,
          initialArrayKeys
        );
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft,
          prev,
          ctx.path,
          defaultValues,
          initialArrayKeys
        );
      }
      case ARRAY_MOVE:
      case ARRAY_SWAP:
      case ARRAY_SORT: {
        if (!ctx.path) return draft;
        return arrayDirtyCheck(
          draft.dirtyFields ?? prev.dirtyFields,
          draft,
          prev,
          ctx.path,
          defaultValues,
          initialArrayKeys
        );
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath)) {
              const current = getIn(newValues, idxPath);
              const origIdx = keyPathToIndexPath(k, initialArrayKeys);
              const initial = getIn(defaultValues, origIdx);
              if (!isEqual(current, initial)) next[k] = true;
            }
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
    const ak = draft.arrayKeys ?? prev.arrayKeys;
    const error = entry.validate(getValueAtKeyPath(values, path, ak));
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
        const base = draft.errors ?? prev.errors;
        return { ...draft, errors: { ...base, [ctx.path]: error } };
      }
      case BLUR: {
        if (!ctx.path) return draft;
        const entry = registry.get(ctx.path);
        if (!entry?.validate || entry.validateMode !== "onBlur") return draft;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
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
        const base = draft.errors ?? prev.errors;
        if (ctx.value) {
          if (!pending[ctx.path]) return draft;
          return {
            ...draft,
            errors: { ...base, [ctx.path]: ctx.value }
          };
        }
        if (base[ctx.path] === void 0) return draft;
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const error = entry.validate(getValueAtKeyPath(values, ctx.path, ak));
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
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index];
        let errors = draft.errors ?? prev.errors;
        if (removedKey) {
          errors = removeByPrefix(errors, ctx.path + "." + removedKey);
        }
        return validateArrayPath(errors, draft, prev, ctx.path, registry);
      }
      case ARRAY_INSERT: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry
        );
      }
      case ARRAY_MOVE:
      case ARRAY_SWAP:
      case ARRAY_SORT: {
        if (!ctx.path) return draft;
        return validateArrayPath(
          draft.errors ?? prev.errors,
          draft,
          prev,
          ctx.path,
          registry
        );
      }
      case SUBMIT: {
        let errors = draft.errors ?? prev.errors;
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        all.forEach((entry, path) => {
          const error = entry.validate ? entry.validate(getValueAtKeyPath(values, path, ak)) : void 0;
          errors = { ...errors, [path]: error };
        });
        return { ...draft, errors };
      }
      case SET_TREE_VALUE: {
        const match = treeMatcher(ctx.path);
        const base = draft.errors ?? prev.errors;
        const newValues = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath)) {
              next[k] = base[k];
            }
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path)) continue;
          const error = entry.validate ? entry.validate(getValueAtKeyPath(values, path, ak)) : void 0;
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
function translateAllErrors(allErrors, arrayKeys) {
  const translated = {};
  for (const [p, error] of Object.entries(allErrors)) {
    translated[indexPathToKeyPath(p, arrayKeys)] = error;
  }
  return translated;
}
function resolverErrorForPath(resolver, values, keyPath, arrayKeys) {
  const allErrors = resolver.validate(values);
  const indexPath = keyPathToIndexPath(keyPath, arrayKeys);
  return allErrors[indexPath];
}
function schemaValidateSinglePath(ctx, prev, draft, resolver) {
  if (!ctx.path) return draft;
  if (draft.errors?.[ctx.path]) return draft;
  const values = draft.values ?? prev.values;
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const error = resolverErrorForPath(resolver, values, ctx.path, ak);
  const base = draft.errors ?? prev.errors;
  return { ...draft, errors: { ...base, [ctx.path]: error } };
}
function schemaValidationEnhancer(resolver, mode) {
  const resolverMode = mode ?? "onChange";
  return (ctx, prev, draft) => {
    switch (ctx.type) {
      case SET_VALUE: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case BLUR: {
        if (!ctx.path || resolverMode !== "onBlur") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case VALIDATE_FIELD:
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      case ARRAY_APPEND:
      case ARRAY_REMOVE:
      case ARRAY_INSERT:
      case ARRAY_MOVE:
      case ARRAY_SWAP:
      case ARRAY_SORT: {
        if (!ctx.path || resolverMode !== "onChange") return draft;
        return schemaValidateSinglePath(ctx, prev, draft, resolver);
      }
      case SUBMIT: {
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case SET_TREE_VALUE: {
        if (resolverMode !== "onChange") return draft;
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
        }
        return { ...draft, errors };
      }
      case VALIDATE_BRANCH: {
        const match = treeMatcher(ctx.path);
        const values = draft.values ?? prev.values;
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const allErrors = translateAllErrors(resolver.validate(values), ak);
        let errors = draft.errors ?? prev.errors;
        for (const [path, error] of Object.entries(allErrors)) {
          if (!match(path)) continue;
          if (errors[path]) continue;
          errors = { ...errors, [path]: error };
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
  const ak = draft.arrayKeys ?? prev.arrayKeys;
  const value = getValueAtKeyPath(draft.values ?? prev.values, path, ak);
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
    registry.nextVersion(path);
    registry.setTimer(
      path,
      setTimeout(() => {
        const version = registry.nextVersion(path);
        void entry.asyncValidate(value).then((error) => {
          if (registry.getVersion(path) !== version) return;
          dispatch({ type: ASYNC_RESOLVE, path, value: error });
        });
      }, entry.debounce)
    );
  } else {
    const version = registry.nextVersion(path);
    void entry.asyncValidate(value).then((error) => {
      if (registry.getVersion(path) !== version) return;
      dispatch({ type: ASYNC_RESOLVE, path, value: error });
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const value = getValueAtKeyPath(draft.values ?? prev.values, ctx.path, ak);
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const value = getValueAtKeyPath(draft.values ?? prev.values, ctx.path, ak);
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
        const prevKeys = prev.arrayKeys[ctx.path] ?? [];
        const removedKey = prevKeys[ctx.index];
        if (removedKey) {
          registry.removeByPrefix(ctx.path + "." + removedKey);
        }
        let pendingBase = draft.pendingFields ?? prev.pendingFields;
        if (removedKey) {
          pendingBase = removeByPrefix(pendingBase, ctx.path + "." + removedKey);
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
      case ARRAY_INSERT: {
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
      case ARRAY_MOVE:
      case ARRAY_SWAP:
      case ARRAY_SORT: {
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        const all = registry.getAll();
        for (const [path] of all) {
          if (match(path)) {
            const idxPath = keyPathToIndexPath(path, ak);
            if (!hasPath(newValues, idxPath)) {
              registry.nextVersion(path);
              registry.clearTimer(path);
            }
          }
        }
        const base = draft.pendingFields ?? prev.pendingFields;
        const next = {};
        for (const k of Object.keys(base)) {
          if (!match(k)) {
            if (base[k] !== void 0) next[k] = base[k];
          } else {
            const idxPath = keyPathToIndexPath(k, ak);
            if (hasPath(newValues, idxPath) && base[k] !== void 0) {
              next[k] = base[k];
            }
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
        const ak = draft.arrayKeys ?? prev.arrayKeys;
        let errors = draft.errors ?? prev.errors;
        let pending = draft.pendingFields ?? prev.pendingFields;
        const all = registry.getAll();
        for (const [path, entry] of all) {
          if (!match(path) || !entry.asyncValidate) continue;
          if (errors[path]) continue;
          const value = getValueAtKeyPath(values, path, ak);
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
  const previewEnhancers = config.enhancers ? config.enhancers([]) : [];
  const { initialState, defaultValues, initialArrayKeys } = buildInitialState(config.initialState, previewEnhancers);
  const initializer = () => initialState;
  const store = createStore()(
    config.middleware ? config.middleware(initializer) : initializer
  );
  const registry = createFieldRegistry(dispatch);
  const defaultEnhancers = [
    {
      name: "values",
      enhancer: valuesEnhancer(defaultValues, initialArrayKeys)
    },
    { name: "touched", enhancer: touchedEnhancer() },
    {
      name: "dirty",
      enhancer: dirtyEnhancer(defaultValues, initialArrayKeys)
    },
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
    if (ctx.path) {
      const normalized = indexPathToKeyPath(ctx.path, store.getState().arrayKeys);
      if (normalized !== ctx.path) ctx = { ...ctx, path: normalized };
    }
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
    registerField: (path, entry) => {
      const kp = indexPathToKeyPath(path, store.getState().arrayKeys);
      registry.register(kp, entry);
    },
    unregisterField: (path) => {
      const kp = indexPathToKeyPath(path, store.getState().arrayKeys);
      registry.unregister(kp);
    },
    select
  };
}

// src/react/useForm.ts
function useForm(config) {
  const formRef = useRef();
  if (!formRef.current) {
    const initialState = {
      values: config.defaultValues
    };
    formRef.current = createForm({
      initialState,
      resolver: config.resolver,
      resolverMode: config.resolverMode,
      enhancers: config.enhancers,
      middleware: config.middleware
    });
  }
  const form = formRef.current;
  const hook = useCallback(
    (selector, equalityFn) => {
      return useStoreWithEqualityFn(form, selector, equalityFn);
    },
    [form]
  );
  return Object.assign(hook, form);
}
var FormContext = createContext(null);
var FormProvider = FormContext.Provider;
function useFormContext() {
  const form = useContext(FormContext);
  if (!form) throw new Error("useFormContext must be used within FormProvider");
  return form;
}
function useOptionalFormContext() {
  return useContext(FormContext);
}
function missingProvider() {
  throw new Error("useFormContext must be used within FormProvider");
}
function useFieldValidation(formOrPath, pathOrOptions, maybeOptions) {
  const contextForm = useOptionalFormContext();
  const form = typeof formOrPath === "string" ? contextForm ?? missingProvider() : formOrPath;
  const path = typeof formOrPath === "string" ? formOrPath : pathOrOptions;
  const options = typeof formOrPath === "string" ? pathOrOptions : maybeOptions;
  const keyPath = useMemo(
    () => indexPathToKeyPath(path, form.getState().arrayKeys),
    [form, path]
  );
  const validate = options?.validate;
  const validateMode = options?.validateMode;
  const asyncValidate = options?.asyncValidate;
  const asyncValidateMode = options?.asyncValidateMode;
  const debounce = options?.debounce;
  useEffect(() => {
    if (!validate && !asyncValidate) return;
    form.registerField(keyPath, {
      validate,
      validateMode,
      asyncValidate,
      asyncValidateMode,
      debounce
    });
    return () => form.unregisterField(keyPath);
  }, [
    form,
    keyPath,
    validate,
    validateMode,
    asyncValidate,
    asyncValidateMode,
    debounce
  ]);
}

// src/react/useField.ts
function useField(formOrPath, pathOrOptions, maybeOptions) {
  const contextForm = useOptionalFormContext();
  const form = typeof formOrPath === "string" ? contextForm ?? missingProvider() : formOrPath;
  const path = typeof formOrPath === "string" ? formOrPath : pathOrOptions;
  const options = typeof formOrPath === "string" ? pathOrOptions : maybeOptions;
  useFieldValidation(form, path, options);
  const inputProps = form(form.field.select.inputProps(path), shallow);
  const fieldState = form(form.field.select.fieldState(path), shallow);
  const elRef = useRef(null);
  useEffect(() => {
    if (fieldState.focused && elRef.current) elRef.current.focus();
  }, [fieldState.focused]);
  const ref = useCallback((el) => {
    elRef.current = el;
  }, []);
  const field = useMemo(
    () => ({ ...inputProps, ref }),
    [inputProps, ref]
  );
  return { field, fieldState };
}

// src/react/useWatch.ts
function useWatch(formOrPath, maybePath) {
  const contextForm = useOptionalFormContext();
  const form = typeof formOrPath === "string" ? contextForm ?? missingProvider() : formOrPath;
  const path = typeof formOrPath === "string" ? formOrPath : maybePath;
  return form(form.field.select.value(path));
}
function useFieldArray(formOrPath, pathOrOptions, maybeOptions) {
  const contextForm = useOptionalFormContext();
  const form = typeof formOrPath === "string" ? contextForm ?? missingProvider() : formOrPath;
  const path = typeof formOrPath === "string" ? formOrPath : pathOrOptions;
  const options = typeof formOrPath === "string" ? pathOrOptions : maybeOptions;
  useFieldValidation(form, path, options);
  const fieldState = form(form.field.select.fieldState(path), shallow);
  const keys = form(form.fieldArray.select.keys(path), shallow);
  const fields = useMemo(
    () => keys.map((id, index) => ({ id, index })),
    [keys]
  );
  const actions = useMemo(() => {
    const fa = form.fieldArray;
    return {
      append: (value, opts) => fa.append(path, value, opts),
      prepend: (value, opts) => fa.prepend(path, value, opts),
      remove: (index, opts) => fa.remove(path, index, opts),
      insert: (index, value, opts) => fa.insert(path, index, value, opts),
      move: (from, to, opts) => fa.move(path, from, to, opts),
      swap: (a, b, opts) => fa.swap(path, a, b, opts),
      replace: (arr, opts) => fa.replace(path, arr, opts),
      sort: (comparator, opts) => fa.sort(path, comparator, opts),
      reorder: (permutation, opts) => fa.reorder(path, permutation, opts)
    };
  }, [form.fieldArray, path]);
  return { fields, fieldState, ...actions };
}

export { FormProvider, useField, useFieldArray, useFieldValidation, useForm, useFormContext, useWatch };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map