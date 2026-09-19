export type SummativeLatestCandidate = {
  surahNumber: number;
  updatedAt: Date;
};

/**
 * Decides which summative score counts as the student's most recent one.
 *
 * "Terakhir" means the entry the teacher made last, so the save timestamp
 * decides. Saves stamp each changed row a millisecond apart in the order the
 * teacher touched them, which keeps ties rare; when two rows still land on the
 * same instant the higher surah number wins, purely so the answer is stable
 * across reloads instead of following whatever order the database returns.
 */
export function isMoreRecentSummativeScore(
  candidate: SummativeLatestCandidate,
  current: SummativeLatestCandidate,
): boolean {
  const byUpdatedAt = candidate.updatedAt.getTime() - current.updatedAt.getTime();
  if (byUpdatedAt !== 0) {
    return byUpdatedAt > 0;
  }
  return candidate.surahNumber > current.surahNumber;
}
