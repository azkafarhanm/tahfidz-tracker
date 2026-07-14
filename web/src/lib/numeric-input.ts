export function sanitizeNumericInputValue(value: string) {
  return value.replace(/\D/g, "");
}
