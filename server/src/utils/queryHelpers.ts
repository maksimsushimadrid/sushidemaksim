/**
 * Safely coerce an Express query parameter (string | string[] | undefined) to a string.
 * Prevents "Type confusion through parameter tampering" (CodeQL critical).
 *
 * Express allows ?key=a&key=b which results in string[], but our code expects string.
 * If an array is passed, takes the first element. Always returns a string.
 */
export function toStr(val: unknown): string {
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return String(val[0] ?? '');
    return String(val);
}
