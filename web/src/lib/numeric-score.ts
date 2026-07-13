export function resolveNumericScoreValue(candidate: string, current: string) {
  const digits = candidate.replace(/\D/g, "");
  if (digits === "") return "";
  if (digits.length > 3 || Number(digits) > 100) return current;
  return digits;
}
