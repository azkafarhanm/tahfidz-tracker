export type RecordMaterialPreference = {
  juz: number | "all";
  surah: string;
};

export function parseMeetingMonthState(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, boolean] =>
        typeof entry[1] === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

export function parseRecordMaterialPreference(
  raw: string | null,
  validSurahs: ReadonlySet<string>,
): RecordMaterialPreference | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== "object") return null;
    const { juz, surah } = value as { juz?: unknown; surah?: unknown };
    if (typeof surah !== "string" || !validSurahs.has(surah)) return null;
    if (
      juz !== "all" &&
      (typeof juz !== "number" ||
        !Number.isInteger(juz) ||
        juz < 1 ||
        juz > 30)
    ) {
      return null;
    }
    return { juz, surah };
  } catch {
    return null;
  }
}
