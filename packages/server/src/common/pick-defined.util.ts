/**
 * Returns a new object containing only the entries from `obj` whose values
 * are not `undefined`. Useful for building Prisma partial-update data objects.
 */
export function pickDefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
