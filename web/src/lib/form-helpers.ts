import { redirect } from "next/navigation";

export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

export function readInt(formData: FormData, key: string) {
  const value = readString(formData, key);
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createFailFn(basePath: string) {
  return (message: string, extra?: Record<string, string>): never => {
    const [pathname, existingSearch = ""] = basePath.split("?", 2);
    const params = new URLSearchParams(existingSearch);

    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        params.set(key, value);
      }
    }

    params.set("error", message);
    redirect(`${pathname}?${params.toString()}`);
  };
}

export function parseRecordDateTime(
  dateValue: string,
  timeValue: string,
  timezoneOffsetValue?: string,
) {
  if (!dateValue || !timeValue) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;

  const [, yearValue, monthValue, dayValue] = dateMatch;
  const [, hourValue, minuteValue] = timeMatch;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  const wallClockDate = new Date(wallClockUtc);

  const validWallClock =
    wallClockDate.getUTCFullYear() === year &&
    wallClockDate.getUTCMonth() === month - 1 &&
    wallClockDate.getUTCDate() === day &&
    wallClockDate.getUTCHours() === hour &&
    wallClockDate.getUTCMinutes() === minute;

  if (!validWallClock) return null;

  const timezoneOffset = /^-?\d+$/.test(timezoneOffsetValue ?? "")
    ? Number(timezoneOffsetValue)
    : Number.NaN;
  if (Number.isFinite(timezoneOffset) && Math.abs(timezoneOffset) <= 14 * 60) {
    return new Date(wallClockUtc + timezoneOffset * 60_000);
  }

  return new Date(wallClockUtc);
}

export function parseDateInput(dateValue: string) {
  if (!dateValue) return null;

  const parsed = new Date(`${dateValue}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
