import { findSurah } from "@/lib/surahs";
import { TargetType } from "@/generated/prisma-next/enums";

type AyahRange = {
  surah: string;
  fromAyah: number;
  toAyah: number;
};

type TargetLike = {
  type: TargetType;
  surah: string;
  fromAyah: number;
  toAyah: number;
};

export function computeTargetCoverage(
  target: TargetLike,
  records: AyahRange[],
): {
  coveredAyahs: number;
  totalAyahs: number;
  percent: number;
  isComplete: boolean;
} {
  const totalAyahs = target.toAyah - target.fromAyah + 1;

  const targetSurah = findSurah(target.surah);
  if (!targetSurah) {
    return { coveredAyahs: 0, totalAyahs, percent: 0, isComplete: false };
  }

  const matchingRecords = records.filter((r) => {
    const recordSurah = findSurah(r.surah);
    if (!recordSurah) return false;
    if (recordSurah.name !== targetSurah.name) return false;
    if (r.fromAyah > target.toAyah || r.toAyah < target.fromAyah) return false;
    return true;
  });

  if (matchingRecords.length === 0) {
    return { coveredAyahs: 0, totalAyahs, percent: 0, isComplete: false };
  }

  const clipped = matchingRecords.map((r) => ({
    start: Math.max(r.fromAyah, target.fromAyah),
    end: Math.min(r.toAyah, target.toAyah),
  }));

  clipped.sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const interval of clipped) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end + 1) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }

  let coveredAyahs = 0;
  for (const m of merged) {
    coveredAyahs += m.end - m.start + 1;
  }

  const percent = totalAyahs > 0 ? Math.min(100, Math.round((coveredAyahs / totalAyahs) * 100)) : 0;
  const isComplete = coveredAyahs >= totalAyahs;

  return { coveredAyahs, totalAyahs, percent, isComplete };
}
