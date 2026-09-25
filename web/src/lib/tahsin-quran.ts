import { RecordStatus } from "@/generated/prisma-next/enums";
import { getJakartaDayKey } from "@/lib/jakarta-date";

/** Reading for a student with no Qur'an Tahsin record yet. */
export const TAHSIN_QURAN_FIRST_SURAH_NUMBER = 2; // Al-Baqarah

/**
 * Monday of the Asia/Jakarta week containing `date`, as a UTC-midnight date.
 *
 * Grades 8 and 9 meet for Tahsin once a week, so the week — not the day — is
 * the meeting: a catch-up session on Wednesday for students who did not get a
 * turn on Tuesday still belongs to Tuesday's meeting.
 */
export function tahsinMeetingWeekStart(date: Date) {
  const day = new Date(`${getJakartaDayKey(date)}T00:00:00.000Z`);
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - daysSinceMonday);
  return day;
}

export type TahsinAyahValidation = { ok: true } | { ok: false; error: string };

export function validateTahsinAyahRange(
  startAyah: number,
  endAyah: number | null,
  totalAyahs: number,
): TahsinAyahValidation {
  if (!Number.isInteger(startAyah) || startAyah < 1) {
    return { ok: false, error: "Ayat awal harus berupa bilangan bulat positif." };
  }
  if (startAyah > totalAyahs) {
    return { ok: false, error: `Surah ini hanya memiliki ${totalAyahs} ayat.` };
  }
  if (endAyah === null) return { ok: true };
  if (!Number.isInteger(endAyah) || endAyah < 1) {
    return { ok: false, error: "Ayat akhir harus berupa bilangan bulat positif." };
  }
  if (endAyah < startAyah) {
    return { ok: false, error: "Ayat akhir tidak boleh lebih kecil dari ayat awal." };
  }
  if (endAyah > totalAyahs) {
    return { ok: false, error: `Surah ini hanya memiliki ${totalAyahs} ayat.` };
  }
  return { ok: true };
}

/** A single-ayah reading is stored with no end ayah, like single pages in jilid. */
export function normalizeTahsinAyahRange(startAyah: number, endAyah: number | null) {
  return { startAyah, endAyah: endAyah === startAyah ? null : endAyah };
}

export type TahsinSurahOption = {
  id: string;
  number: number;
  name: string;
  totalAyahs: number;
};

export type TahsinQuranLastReading = {
  surahId: string;
  startAyah: number;
  endAyah: number | null;
  status: RecordStatus;
};

export type TahsinQuranDefault = {
  surahId: string;
  startAyah: number;
  endAyah: number | null;
};

/**
 * Where the next Qur'an reading should pick up, so the teacher only types a score.
 *
 * - No reading yet: Al-Baqarah from ayah 1, end left for the teacher.
 * - Last reading marked Perlu Murojaah: the same range again.
 * - Otherwise: continue after the last ayah, the same number of ayat as last
 *   time (each student's portion tends to stay similar week to week), never past
 *   the end of the surah. A finished surah rolls over to ayah 1 of the next.
 *
 * Every value stays editable in the form; this is only the likely answer.
 */
export function resolveTahsinQuranDefault(
  last: TahsinQuranLastReading | null,
  surahs: readonly TahsinSurahOption[],
): TahsinQuranDefault | null {
  const byNumber = [...surahs].sort((left, right) => left.number - right.number);
  const first =
    byNumber.find((surah) => surah.number === TAHSIN_QURAN_FIRST_SURAH_NUMBER) ??
    byNumber[0];
  if (!first) return null;
  if (!last) return { surahId: first.id, startAyah: 1, endAyah: null };

  const current = byNumber.find((surah) => surah.id === last.surahId);
  if (!current) return { surahId: first.id, startAyah: 1, endAyah: null };

  if (last.status === RecordStatus.PERLU_MUROJAAH) {
    return { surahId: current.id, startAyah: last.startAyah, endAyah: last.endAyah };
  }

  const lastEnd = last.endAyah ?? last.startAyah;
  const portion = Math.max(1, lastEnd - last.startAyah + 1);
  const continueIn = (surah: TahsinSurahOption, startAyah: number): TahsinQuranDefault => {
    const endAyah = Math.min(startAyah + portion - 1, surah.totalAyahs);
    return { surahId: surah.id, startAyah, endAyah: endAyah > startAyah ? endAyah : null };
  };

  if (lastEnd < current.totalAyahs) return continueIn(current, lastEnd + 1);

  const next = byNumber.find((surah) => surah.number === current.number + 1);
  // Past An-Nas there is nowhere left to continue; leave the last ayah in place.
  if (!next) return { surahId: current.id, startAyah: current.totalAyahs, endAyah: null };
  return continueIn(next, 1);
}
