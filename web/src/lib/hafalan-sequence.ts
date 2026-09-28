import { getJuz } from "@/lib/juz";
import { ayahKey, surahAyahCountByName } from "@/lib/quran-progress";
import { surahList } from "@/lib/surahs";

/**
 * Fills in hafalan the teacher forgot to record, using the Boarding memorisation
 * order: juz 30, then 29, 28 … down to 1, and within each juz its surahs from
 * first to last. Because students move strictly forward through that sequence,
 * an ayah the record skipped can be recovered when the student has since been
 * recorded further along.
 *
 * Only two inferences are made, both conservative:
 *
 * - A gap between two recorded ayat of the same juz is filled when the ayah
 *   beyond the gap was recorded later than the ayah before it. Qaf 1–42 followed
 *   days later by Adz-Dzariyat 1 means Qaf 43–45 was recited. The time check
 *   stops a surah recited out of order long ago from vouching for everything
 *   between it and the student's current place.
 * - Every juz the student has already passed counts toward the running total,
 *   but never as new hafalan, since it was memorised before the records began.
 *
 * The start of the juz currently being worked on, before its first record, is
 * never assumed: nothing distinguishes "memorised before the app" from "not
 * memorised", so the report shows only what was recorded there.
 */

/** Position of every ayah in the memorisation order, and the juz it belongs to. */
const methodIndex = new Map<string, number>();
const juzOfAyah = new Map<string, number>();
const ayatByJuz = new Map<number, string[]>();
{
  for (const surah of surahList) {
    for (let ayah = 1; ayah <= surah.ayahs; ayah += 1) {
      const juz = getJuz(surah.name, ayah);
      if (!juz) continue;
      const key = ayahKey(surah.name, ayah);
      juzOfAyah.set(key, juz);
      const bucket = ayatByJuz.get(juz) ?? [];
      bucket.push(key);
      ayatByJuz.set(juz, bucket);
    }
  }
  let index = 0;
  for (let juz = 30; juz >= 1; juz -= 1) {
    for (const key of ayatByJuz.get(juz) ?? []) {
      methodIndex.set(key, index);
      index += 1;
    }
  }
}
const orderedAyat = [...methodIndex.entries()].sort((left, right) => left[1] - right[1]).map(([key]) => key);

export type HafalanRow = {
  surah: string;
  fromAyah: number;
  toAyah: number;
  date: Date;
  createdAt?: Date;
};

export type DatedAyah = {
  /** When the ayah was first recorded, or when a later record proved it. */
  date: Date;
  inferred: boolean;
};

export type HafalanTimeline = {
  ayat: Map<string, DatedAyah>;
  /** Juz of the latest record, the one the student is working through now. */
  currentJuz: number | null;
};

function rowAyat(row: HafalanRow) {
  const maxAyah = surahAyahCountByName.get(row.surah) ?? row.toAyah;
  const from = Math.max(1, Math.min(row.fromAyah, maxAyah));
  const to = Math.max(from, Math.min(row.toAyah, maxAyah));
  return Array.from({ length: to - from + 1 }, (_, offset) => ayahKey(row.surah, from + offset));
}

export function resolveHafalanTimeline(rows: readonly HafalanRow[]): HafalanTimeline {
  const ordered = rows
    .map((row, inputOrder) => ({ row, inputOrder }))
    .sort((left, right) =>
      left.row.date.getTime() - right.row.date.getTime() ||
      (left.row.createdAt?.getTime() ?? 0) - (right.row.createdAt?.getTime() ?? 0) ||
      left.inputOrder - right.inputOrder)
    .map(({ row }) => row);

  // First sighting of each ayah; `sequence` orders sightings that share a date.
  const firstSeen = new Map<string, { date: Date; sequence: number }>();
  ordered.forEach((row, sequence) => {
    for (const key of rowAyat(row)) {
      if (!firstSeen.has(key)) firstSeen.set(key, { date: row.date, sequence });
    }
  });

  const ayat = new Map<string, DatedAyah>();
  for (const [key, seen] of firstSeen) ayat.set(key, { date: seen.date, inferred: false });

  const recorded = [...firstSeen.keys()]
    .filter((key) => methodIndex.has(key))
    .sort((left, right) => methodIndex.get(left)! - methodIndex.get(right)!);
  for (let index = 0; index + 1 < recorded.length; index += 1) {
    const before = recorded[index];
    const after = recorded[index + 1];
    const beforeIndex = methodIndex.get(before)!;
    const afterIndex = methodIndex.get(after)!;
    if (afterIndex - beforeIndex <= 1) continue;
    if (juzOfAyah.get(before) !== juzOfAyah.get(after)) continue;
    const beforeSeen = firstSeen.get(before)!;
    const afterSeen = firstSeen.get(after)!;
    if (afterSeen.sequence <= beforeSeen.sequence) continue;
    for (let gap = beforeIndex + 1; gap < afterIndex; gap += 1) {
      ayat.set(orderedAyat[gap], { date: afterSeen.date, inferred: true });
    }
  }

  // A record spanning two juz (Adz-Dzariyat 1–60) places the student at the
  // earlier of them in the memorisation order, never past where they are.
  const latest = ordered.at(-1);
  const latestIndexes = latest ? rowAyat(latest).map((key) => methodIndex.get(key)).filter((value): value is number => value !== undefined) : [];
  const currentJuz = latestIndexes.length > 0 ? juzOfAyah.get(orderedAyat[Math.min(...latestIndexes)]) ?? null : null;

  return { ayat, currentJuz };
}

/**
 * Everything counted as memorised: recorded and filled-in ayat, plus every juz
 * already passed in the memorisation order.
 */
export function totalHafalanAyat(timeline: HafalanTimeline) {
  const ayat = new Set(timeline.ayat.keys());
  if (timeline.currentJuz !== null) {
    for (let juz = 30; juz > timeline.currentJuz; juz -= 1) {
      for (const key of ayatByJuz.get(juz) ?? []) ayat.add(key);
    }
  }
  return ayat;
}
