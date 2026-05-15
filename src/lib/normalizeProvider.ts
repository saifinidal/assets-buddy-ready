/**
 * Canonical normalisation for provider names → icon_key values.
 *
 * Rules (applied in order):
 *  1. Trim whitespace
 *  2. Lowercase
 *  3. Replace spaces, hyphens, and dots with underscores
 *  4. Collapse consecutive underscores
 *  5. Strip leading / trailing underscores
 *
 * Examples:
 *  "Evolution Live"       → "evolution_live"
 *  "PragmaticPlay-Asia"   → "pragmaticplay_asia"
 *  "JILIGaming"           → "jiligaming"
 *  " MAC88 "              → "mac88"
 */
export function normalizeProviderKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s\-\.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Strip all separators for fuzzy comparison (used in filename auto-matching).
 * "PragmaticPlay-Asia" → "pragmaticplayasia"
 */
export function normalizeFuzzy(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_\-\.]+/g, "");
}
