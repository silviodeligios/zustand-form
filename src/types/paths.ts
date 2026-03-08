/** Depth counter to limit recursion (5 levels) */
type Prev = [never, 0, 1, 2, 3, 4];

/** All valid dot-notation paths for T */
export type Path<T, D extends number = 5> = [D] extends [never]
  ? string
  : T extends readonly (infer U)[]
    ? `${number}` | `${number}.${Path<U, Prev[D]>}`
    : T extends object
      ? {
          [K in keyof T & string]: K | `${K}.${Path<T[K], Prev[D]>}`;
        }[keyof T & string]
      : never;

/** Value type at path P inside T */
export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : K extends `${number}`
      ? T extends readonly (infer U)[]
        ? PathValue<U, Rest>
        : unknown
      : unknown
  : P extends keyof T
    ? T[P]
    : P extends `${number}`
      ? T extends readonly (infer U)[]
        ? U
        : unknown
      : unknown;

/** Element type of an array */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : unknown;
