type QueryResult<T> = T[] | { rows?: T[] };

export function getRows<T>(result: QueryResult<T>): T[] {
  if (Array.isArray((result as { rows?: T[] }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return result as T[];
}
