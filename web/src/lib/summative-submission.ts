/**
 * Orders a bulk submission so the score the teacher entered last sorts last.
 *
 * `inputOrder` is only the order the fields appear in the form, which says
 * nothing about what was typed when. `touchOrder` carries the surah ids the
 * client saw change, oldest touch first; those rows move to the end in that
 * order, and anything untouched keeps its form order in front of them.
 */
export function orderSummativeSubmission<
  T extends { inputOrder: number; surahId: string },
>(inputs: readonly T[], touchOrder: readonly string[] = []) {
  const touchRank = new Map(
    touchOrder.map((surahId, index) => [surahId, index] as const),
  );

  return [...inputs].sort((left, right) => {
    const leftTouch = touchRank.get(left.surahId);
    const rightTouch = touchRank.get(right.surahId);

    if (leftTouch !== undefined && rightTouch !== undefined) {
      return leftTouch - rightTouch;
    }
    if (leftTouch !== undefined) {
      return 1;
    }
    if (rightTouch !== undefined) {
      return -1;
    }

    return left.inputOrder - right.inputOrder;
  });
}

export function assignSequentialSummativeSubmissionTimes<T>(
  inputs: readonly T[],
  submittedAt = new Date(),
) {
  return inputs.map((input, index) => ({
    ...input,
    submittedAt: new Date(submittedAt.getTime() + index),
  }));
}
