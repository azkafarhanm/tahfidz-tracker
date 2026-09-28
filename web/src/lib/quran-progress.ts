import { getJuz } from "@/lib/juz";
import { surahList } from "@/lib/surahs";

/**
 * Turns recited ayat into the "N Juz + N Surah + N Ayat" lines of the reports.
 *
 * Ayat are keyed "Surah:ayah" and carry a count: 1 for hafalan, where each ayah
 * is memorised once, or the number of times recited for murojaah, where
 * repetition is the point. Both summaries are built to agree with the reports'
 * surah-by-surah listing, so a reader who adds up the listing gets the summary.
 */

export function ayahKey(surah: string, ayah: number) {
  return `${surah}:${ayah}`;
}

export const surahAyahCountByName = new Map(
  surahList.map((surah) => [surah.name, surah.ayahs]),
);

const surahNumberByName = new Map(
  surahList.map((surah) => [surah.name, surah.number]),
);

export function surahNumberOf(name: string) {
  return surahNumberByName.get(name) ?? Number.MAX_SAFE_INTEGER;
}

/** Adds one recitation of `surah` fromAyah–toAyah, clamped to the surah. */
export function addRecitation(
  counts: Map<string, number>,
  row: { surah: string; fromAyah: number; toAyah: number },
  options: { deduplicate: boolean },
) {
  const maxAyah = surahAyahCountByName.get(row.surah) ?? row.toAyah;
  const fromAyah = Math.max(1, Math.min(row.fromAyah, maxAyah));
  const toAyah = Math.max(fromAyah, Math.min(row.toAyah, maxAyah));
  for (let ayah = fromAyah; ayah <= toAyah; ayah += 1) {
    const key = ayahKey(row.surah, ayah);
    counts.set(key, options.deduplicate ? 1 : (counts.get(key) ?? 0) + 1);
  }
}

export function buildAyahCounts(
  rows: Array<{ surah: string; fromAyah: number; toAyah: number }>,
  options: { deduplicate: boolean },
) {
  const counts = new Map<string, number>();
  for (const row of rows) addRecitation(counts, row, options);
  return counts;
}

function formatProgressSummary(decomposition: { juz: number; surah: number; ayah: number }) {
  const parts = [
    decomposition.juz > 0 ? `${decomposition.juz} Juz` : null,
    decomposition.surah > 0 ? `${decomposition.surah} Surah` : null,
    decomposition.ayah > 0 ? `${decomposition.ayah} Ayat` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" + ") : "0 Ayat";
}

function ayatOfSurah(surah: { name: string; ayahs: number }) {
  return Array.from({ length: surah.ayahs }, (_, index) => ayahKey(surah.name, index + 1));
}

const ayatByJuz = new Map<number, string[]>();
const juzOfKey = new Map<string, number>();
for (const surah of surahList) {
  for (const key of ayatOfSurah(surah)) {
    const juz = getJuz(surah.name, Number(key.slice(key.lastIndexOf(":") + 1)));
    if (!juz) continue;
    juzOfKey.set(key, juz);
    const bucket = ayatByJuz.get(juz) ?? [];
    bucket.push(key);
    ayatByJuz.set(juz, bucket);
  }
}

/**
 * Hafalan summary that agrees with a surah-by-surah listing.
 *
 * Juz counts only complete juz. A finished surah always counts as one surah,
 * even when part of it sits inside a complete juz — Adz-Dzariyat spans juz 26
 * and 27, and a student who knows all of it has finished that surah. Loose ayat
 * come only from unfinished surahs, outside any complete juz.
 *
 * A juz lying wholly inside one finished surah (juz 2, inside Al-Baqarah) is
 * not counted as a juz: the surah already stands for it, and counting both
 * would read as a juz plus a separate surah.
 *
 * The older greedy summary counted juz first, which split such a surah: its
 * juz-27 half vanished into "4 Juz" and its juz-26 half became 30 loose ayat,
 * so the total read "+ 58 Ayat" while the listing showed only Al-Fath 1–28.
 */
export function formatHafalanSummary(ayat: ReadonlySet<string> | ReadonlyMap<string, unknown>) {
  const has = (key: string) => ayat.has(key);
  const surahOf = (key: string) => key.slice(0, key.lastIndexOf(":"));
  const isSurahFinished = (name: string) => {
    const surah = surahList.find((candidate) => candidate.name === name);
    return Boolean(surah) && ayatOfSurah(surah!).every(has);
  };
  const completeJuz = new Set(
    [...ayatByJuz]
      .filter(([, keys]) => keys.every(has))
      .filter(([, keys]) => {
        const surahs = new Set(keys.map(surahOf));
        return !(surahs.size === 1 && isSurahFinished([...surahs][0]));
      })
      .map(([juz]) => juz),
  );
  const insideCompleteJuz = (key: string) => completeJuz.has(juzOfKey.get(key) ?? 0);

  let surahCount = 0;
  let looseAyat = 0;
  for (const surah of surahList) {
    const keys = ayatOfSurah(surah);
    if (keys.every(has)) {
      if (keys.some((key) => !insideCompleteJuz(key))) surahCount += 1;
    } else {
      looseAyat += keys.filter((key) => has(key) && !insideCompleteJuz(key)).length;
    }
  }
  return formatProgressSummary({ juz: completeJuz.size, surah: surahCount, ayah: looseAyat });
}

/**
 * Murojaah summary that agrees with the per-surah detail: complete passes of
 * each surah added up, plus every recitation left over. No juz — murojaah is a
 * volume of repetition, and folding it into juz produced a "1 Juz" that was in
 * fact pieces of several passes and matched nothing in the listing.
 */
export function formatMurojaahSummary(counts: ReadonlyMap<string, number>) {
  const bySurah = new Map<string, number[]>();
  for (const [key, count] of counts) {
    const surah = key.slice(0, key.lastIndexOf(":"));
    bySurah.set(surah, [...(bySurah.get(surah) ?? []), count]);
  }
  let passes = 0;
  let looseAyat = 0;
  for (const [surah, surahCounts] of bySurah) {
    const complete = surahCounts.length === (surahAyahCountByName.get(surah) ?? -1);
    const surahPasses = complete ? Math.min(...surahCounts) : 0;
    passes += surahPasses;
    looseAyat += surahCounts.reduce((sum, count) => sum + count - surahPasses, 0);
  }
  return formatProgressSummary({ juz: 0, surah: passes, ayah: looseAyat });
}
