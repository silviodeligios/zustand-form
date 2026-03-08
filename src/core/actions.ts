// Action type constants for the form pipeline

// Path-level actions (operate on exact field)
export const SET_VALUE = "SET_VALUE" as const;
export const SET_ERROR = "SET_ERROR" as const;
export const CLEAR_ERROR = "CLEAR_ERROR" as const;
export const SET_TOUCHED = "SET_TOUCHED" as const;
export const SET_DIRTY = "SET_DIRTY" as const;
export const FOCUS = "FOCUS" as const;
export const BLUR = "BLUR" as const;
export const VALIDATE_FIELD = "VALIDATE_FIELD" as const;
export const RESET_FIELD = "RESET_FIELD" as const;

// Tree-level actions (operate on subtree: path + path.*)
export const CLEAR_ERRORS_BRANCH = "CLEAR_ERRORS_BRANCH" as const;
export const RESET_BRANCH = "RESET_BRANCH" as const;
export const VALIDATE_BRANCH = "VALIDATE_BRANCH" as const;

// Async validation lifecycle
export const ASYNC_RESOLVE = "ASYNC_RESOLVE" as const;

// Array actions (operate on array at path)
export const ARRAY_APPEND = "ARRAY_APPEND" as const;
export const ARRAY_REMOVE = "ARRAY_REMOVE" as const;
export const ARRAY_INSERT = "ARRAY_INSERT" as const;
export const ARRAY_MOVE = "ARRAY_MOVE" as const;
export const ARRAY_SWAP = "ARRAY_SWAP" as const;

// Form-level actions
export const RESET_FORM = "RESET_FORM" as const;
export const SUBMIT = "SUBMIT" as const;
export const SUBMIT_SUCCESS = "SUBMIT_SUCCESS" as const;
export const SUBMIT_FAILURE = "SUBMIT_FAILURE" as const;
