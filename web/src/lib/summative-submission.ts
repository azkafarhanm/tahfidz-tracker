export function orderSummativeSubmission<T extends { inputOrder: number }>(
  inputs: readonly T[],
) {
  return [...inputs].sort((left, right) => left.inputOrder - right.inputOrder);
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
