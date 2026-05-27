export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export function hasLetterAndNumber(value: string) {
  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function getPasswordChecks(value: string) {
  return {
    minLength: value.length >= MIN_PASSWORD_LENGTH,
    hasLetter: /[A-Za-z]/.test(value),
    hasNumber: /\d/.test(value),
  };
}
