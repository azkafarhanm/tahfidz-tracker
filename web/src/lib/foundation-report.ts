import { resolveHafalanTimeline, totalHafalanAyat } from "@/lib/hafalan-sequence";
import { getJakartaDayKey } from "@/lib/jakarta-date";
import {
  addRecitation,
  ayahKey,
  formatHafalanSummary,
  formatMurojaahSummary,
  surahAyahCountByName,
  surahNumberOf,
} from "@/lib/quran-progress";

/**
 * The Boarding progress report handed to the foundation (yayasan).
 *
 * Unlike the semester report, it covers one reporting period: from the day
 * after the previous report was handed in up to the chosen end date. Each report
 * therefore shows only what is new since the last one, never a running merge.
 */

export type ReportRecitation = {
  surah: string;
  fromAyah: number;
  toAyah: number;
  date: Date;
  createdAt?: Date;
};

export type SurahDetail = {
  /** Complete surahs by name, in mushaf order. A finished juz appears as its surahs. */
  penuh: string[];
  /** Partial surahs with their ayah ranges, in mushaf order. */
  sebagian: string[];
};

export type FoundationStudentReport = {
  hafalanSetoran: number;
  hafalanBaru: string;
  rincianHafalan: SurahDetail;
  murojaahSetoran: number;
  murojaahProgress: string;
  rincianMurojaah: SurahDetail;
  totalHafalan: string;
  rincianTotal: SurahDetail;
};

// ── Period arithmetic on Jakarta calendar days ("YYYY-MM-DD") ──────────────

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isDayKey(value: string) {
  if (!DAY_KEY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addDays(dayKey: string, days: number) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return new Date(date.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** First instant of a Jakarta calendar day. Jakarta has no daylight saving. */
export function jakartaDayStart(dayKey: string) {
  return new Date(`${dayKey}T00:00:00.000+07:00`);
}

/** Inclusive calendar days `from`–`to` as a half-open instant range. */
export function periodBounds(from: string, to: string) {
  return { start: jakartaDayStart(from), endExclusive: jakartaDayStart(addDays(to, 1)) };
}

export function todayDayKey(now = new Date()) {
  return getJakartaDayKey(now);
}

const indonesianMonths = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

export function formatIndonesianDay(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return `${day} ${indonesianMonths[month - 1]} ${year}`;
}

export function formatPeriodLabel(from: string, to: string) {
  return `${formatIndonesianDay(from)} – ${formatIndonesianDay(to)}`;
}

/**
 * Where the next report starts: the day after the last one ended, or the first
 * recorded setoran when nothing has been reported yet. Never later than today.
 */
export function resolveDefaultPeriod(input: {
  lastPeriodEnd: string | null;
  firstActivityDay: string | null;
  today: string;
}) {
  const from = input.lastPeriodEnd
    ? addDays(input.lastPeriodEnd, 1)
    : input.firstActivityDay ?? input.today;
  return { from: from > input.today ? input.today : from, to: input.today };
}

// ── Surah detail ───────────────────────────────────────────────────────────

function formatRange(from: number, to: number) {
  return from === to ? String(from) : `${from}–${to}`;
}

/**
 * Consecutive ayat that share a count, e.g. 4–9 recited twice then 10–12 once:
 * "4–9 (2×), 10–12". Showing counts only above one keeps hafalan, where every
 * count is one, reading as plain ranges.
 */
function formatLeftoverRuns(ayat: Map<number, number>) {
  const sorted = [...ayat.entries()].sort((left, right) => left[0] - right[0]);
  const runs: string[] = [];
  let index = 0;
  while (index < sorted.length) {
    const [start, count] = sorted[index];
    let end = start;
    while (index + 1 < sorted.length && sorted[index + 1][0] === end + 1 && sorted[index + 1][1] === count) {
      index += 1;
      end = sorted[index][0];
    }
    runs.push(`${formatRange(start, end)}${count > 1 ? ` (${count}×)` : ""}`);
    index += 1;
  }
  return runs.join(", ");
}

/**
 * Surah-by-surah detail: each surah named once, complete ones under "Penuh"
 * and the rest as ayah ranges under "Sebagian", in mushaf order.
 *
 * The summary line still speaks in juz ("2 Juz + 6 Surah"), but the detail
 * always spells out the surahs so a reader sees exactly what a juz contained.
 * For murojaah it also avoids the confusion of folding surahs into juz, which
 * once listed a surah inside "Juz 29 (2×)", again on its own, and a third time
 * as partial ayat — a surah reviewed four times read as "(2×)".
 *
 * `showTimes` adds the number of complete passes, for murojaah.
 */
function describeBySurah(
  counts: Map<string, number>,
  options: { showTimes: boolean; isSurahComplete?: (surah: string) => boolean },
): SurahDetail {
  const bySurah = new Map<string, Map<number, number>>();
  for (const [key, count] of counts) {
    const separator = key.lastIndexOf(":");
    const surah = key.slice(0, separator);
    const ayat = bySurah.get(surah) ?? new Map<number, number>();
    ayat.set(Number(key.slice(separator + 1)), count);
    bySurah.set(surah, ayat);
  }

  const penuh: string[] = [];
  const sebagian: string[] = [];
  for (const [surah, ayat] of [...bySurah.entries()].sort((left, right) => surahNumberOf(left[0]) - surahNumberOf(right[0]))) {
    const ayahCount = surahAyahCountByName.get(surah) ?? 0;
    const passes = ayahCount > 0 && ayat.size === ayahCount ? Math.min(...ayat.values()) : 0;
    if (passes > 0) penuh.push(options.showTimes ? `${surah} (${passes}×)` : surah);
    const leftover = new Map([...ayat].map(([ayah, count]) => [ayah, count - passes] as const).filter(([, count]) => count > 0));
    if (leftover.size > 0) {
      const completed = options.isSurahComplete?.(surah) ? " (surah tuntas)" : "";
      sebagian.push(`${surah} ${formatLeftoverRuns(leftover)}${completed}`);
    }
  }
  return { penuh, sebagian };
}

function isWithin(date: Date, start: Date, endExclusive: Date) {
  return date.getTime() >= start.getTime() && date.getTime() < endExclusive.getTime();
}

/**
 * One student's line in the report.
 *
 * `hafalan` must include the student's whole history up to the end of the
 * period: an ayah only counts as new hafalan if it was never memorised before
 * the period started, so a re-setor of something reported last time does not
 * reappear as fresh progress.
 *
 * `murojaah` should likewise reach back to the student's first record. The
 * period's murojaah figures use only the rows inside it, repetitions included,
 * because reviewing is repetition. The total uses all of them: a student cannot
 * review what they have not memorised, so every ayah ever reviewed counts as
 * memorised — this recovers hafalan that was recited but never recorded. It
 * adds to the total only, never to new hafalan, since a review proves an ayah
 * was known but not when it was learnt.
 */
export function buildFoundationStudentReport(
  hafalan: ReportRecitation[],
  murojaah: ReportRecitation[],
  period: { start: Date; endExclusive: Date },
): FoundationStudentReport {
  const inPeriodRows = hafalan.filter((row) => isWithin(row.date, period.start, period.endExclusive));
  // Every ayah is dated by when it was first recorded, or by the later record
  // that proved a forgotten one; new hafalan is whatever that date puts inside
  // the period, so an ayah re-recited after being reported never counts twice.
  const timeline = resolveHafalanTimeline(
    hafalan.filter((row) => row.date.getTime() < period.endExclusive.getTime()),
  );
  const fresh = new Map<string, number>();
  for (const [key, entry] of timeline.ayat) {
    if (isWithin(entry.date, period.start, period.endExclusive)) fresh.set(key, 1);
  }
  const total = new Map([...totalHafalanAyat(timeline)].map((key) => [key, 1]));
  for (const row of murojaah) {
    if (row.date.getTime() < period.endExclusive.getTime()) addRecitation(total, row, { deduplicate: true });
  }

  const isSurahComplete = (surah: string) => {
    const ayahs = surahAyahCountByName.get(surah) ?? 0;
    if (ayahs === 0) return false;
    for (let ayah = 1; ayah <= ayahs; ayah += 1) {
      if (!total.has(ayahKey(surah, ayah))) return false;
    }
    return true;
  };

  const murojaahRows = murojaah.filter((row) => isWithin(row.date, period.start, period.endExclusive));
  const murojaahCounts = new Map<string, number>();
  for (const row of murojaahRows) addRecitation(murojaahCounts, row, { deduplicate: false });

  return {
    hafalanSetoran: inPeriodRows.length,
    hafalanBaru: formatHafalanSummary(fresh),
    rincianHafalan: describeBySurah(fresh, { showTimes: false, isSurahComplete }),
    murojaahSetoran: murojaahRows.length,
    murojaahProgress: formatMurojaahSummary(murojaahCounts),
    rincianMurojaah: describeBySurah(murojaahCounts, { showTimes: true }),
    totalHafalan: formatHafalanSummary(total),
    rincianTotal: describeBySurah(total, { showTimes: false }),
  };
}

/** "Penuh: …" and "Sebagian: …" on their own lines, or "-" when empty. */
export function formatSurahDetail(detail: SurahDetail) {
  const lines = [
    detail.penuh.length > 0 ? `Penuh: ${detail.penuh.join(", ")}` : null,
    detail.sebagian.length > 0 ? `Sebagian: ${detail.sebagian.join("; ")}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "-";
}
