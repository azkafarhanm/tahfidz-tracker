/**
 * Normalizes free-text search input consistently across UI search surfaces.
 * Whitespace is collapsed so accidental leading, trailing, or repeated spaces
 * do not affect a match.
 */
export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function matchesSearchText(value: string | number | null | undefined, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  return !normalizedQuery || normalizeSearchText(String(value ?? "")).includes(normalizedQuery);
}

/** Preserves punctuation-insensitive matching for inputs such as Surah names. */
export function normalizeLooseSearchText(value: string): string {
  return normalizeSearchText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
