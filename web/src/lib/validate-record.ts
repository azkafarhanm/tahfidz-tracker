type TFn = (key: string) => string;

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
  t: TFn;
}): Promise<void> {
  const { surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses, fail, t } = input;

  if (!surah || surah.length > 80) {
    return fail(t("surahRequired"));
  }

  if (fromAyah === null || toAyah === null || fromAyah < 1 || toAyah < 1) {
    return fail(t("ayahPositive"));
  }

  if (toAyah < fromAyah) {
    return fail(t("ayahRange"));
  }

  if (toAyah > 286) {
    return fail(t("ayahTooLarge"));
  }

  if (!date) {
    return fail(t("dateInvalid"));
  }

  if (!validStatuses.has(statusValue)) {
    return fail(t("statusInvalid"));
  }

  if (score !== null && (score < 0 || score > 100)) {
    return fail(t("scoreRange"));
  }

  if (notes && notes.length > 1500) {
    return fail(t("notesTooLong"));
  }
}
