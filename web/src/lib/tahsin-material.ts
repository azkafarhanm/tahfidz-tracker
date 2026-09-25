/**
 * What each grade reads in Tahsin, and how a record's material is written out.
 *
 * Kept free of Prisma so client components can share it with the server.
 */

/** Grade 7 works through the Ilman Wa Ruuhan jilid books, page by page. */
export const TAHSIN_JILID_GRADES = [7] as const;
/** Grades 8 and 9 read the Qur'an itself, surah by surah, ayah by ayah. */
export const TAHSIN_QURAN_GRADES = [8, 9] as const;
export const TAHSIN_ENABLED_GRADES = [
  ...TAHSIN_JILID_GRADES,
  ...TAHSIN_QURAN_GRADES,
] as const;

export type TahsinMaterialKind = "JILID" | "QURAN";

export function tahsinMaterialForGrade(grade: number): TahsinMaterialKind | null {
  if ((TAHSIN_JILID_GRADES as readonly number[]).includes(grade)) return "JILID";
  if ((TAHSIN_QURAN_GRADES as readonly number[]).includes(grade)) return "QURAN";
  return null;
}

/** "5" for a single page or ayah, "5–7" for a range. */
export function formatTahsinRange(start: number, end: number | null) {
  return end === null || end === start ? String(start) : `${start}–${end}`;
}

export type TahsinMaterialFields = {
  material: TahsinMaterialKind;
  jilid: number | null;
  startPage: number | null;
  endPage: number | null;
  startAyah: number | null;
  endAyah: number | null;
  surah: { name: string } | null;
};

/**
 * One-line description of what was assessed.
 *
 * Qur'an readings use the citation form teachers already write by hand,
 * "QS. Al-Baqarah: 17–18". Jilid readings keep the labels the caller passes so
 * existing translated screens read exactly as before.
 */
export function describeTahsinMaterial(
  record: TahsinMaterialFields,
  labels: { jilid: string; page: string } = { jilid: "Jilid", page: "Halaman" },
) {
  if (record.material === "QURAN") {
    return `QS. ${record.surah?.name ?? "-"}: ${formatTahsinRange(record.startAyah ?? 0, record.endAyah)}`;
  }
  return `${labels.jilid} ${record.jilid ?? "-"} · ${labels.page} ${formatTahsinRange(record.startPage ?? 0, record.endPage)}`;
}

/** Meeting number from whichever timeline the record belongs to. */
export function tahsinRecordMeetingNumber(record: {
  meeting: { meetingNumber: number } | null;
  halaqahMeeting?: { meetingNumber: number } | null;
}) {
  return record.meeting?.meetingNumber ?? record.halaqahMeeting?.meetingNumber ?? null;
}
