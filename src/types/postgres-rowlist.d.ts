// Temporary shim to support legacy `.rows` access on drizzle/postgres results.
// Drizzle's `db.execute` returns a RowList (array-like). Older code expects
// a `{ rows: [...] }` shape. This augmentation provides that alias for type safety.
import 'postgres';

declare module 'postgres' {
  export interface RowList<T = Record<string, unknown>> extends Array<T> {
    rows: T[];
  }
}
