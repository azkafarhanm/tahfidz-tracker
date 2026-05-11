import { getTranslations } from "next-intl/server";

export async function validateRecordFields(input: {
  surah: string;
  fromAyah: number | null;
  toAyah: number | null;
  date: Date | null;
  statusValue: string;
  score: number | null;
  notes: string | null;
  validStatuses: Set<string>;
  fail: (message: string) => never;
}): Promise<void> {
  const { surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail } = input;
  const t = await getTranslations("Validation");

  if (!surah || surah.length > 80) {
    fail(t("surahRequired"));
  }

  if (fromAyah === null || toAyah === null || fromAyah < 1 || toAyah < 1) {
    fail(t("ayahPositive"));
  }

  if (toAyah! < fromAyah!) {
    fail(t("ayahRange"));
  }

  if (toAyah! > 286) {
    fail(t("ayahTooLarge"));
  }

  if (!date) {
    fail(t("dateInvalid"));
  }

  if (!validStatuses.has(statusValue)) {
    fail(t("statusInvalid"));
  }

  if (score !== null && (score < 0 || score > 100)) {
    fail(t("scoreRange"));
  }

  if (notes && notes.length > 1500) {
    fail(t("notesTooLong"));
  }
}
