export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping falsy entries so conditionals stay readable.
 * It does not resolve conflicting Tailwind utilities: callers must not pass both.
 */
export function cn(...values: readonly ClassValue[]): string {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0).join(" ");
}
