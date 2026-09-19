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

/**
 * Search predicate shared by the formative and summative list pages.
 *
 * Both pages paginate on the server, so a client-side filter would only ever
 * see the current page. Matching happens in the query instead, against the
 * student name and the academic class label (7A, 7B) so a teacher can narrow to
 * a single rombel by typing it. Halaqah name is deliberately excluded: a teacher
 * holding one halaqah would see it repeated on every row, so it never narrows
 * anything.
 */
export function buildStudentSearchWhere(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return {};
  }

  return {
    OR: [
      { fullName: { contains: normalizedQuery, mode: "insensitive" as const } },
      {
        academicClass: {
          name: { contains: normalizedQuery, mode: "insensitive" as const },
        },
      },
    ],
  };
}
