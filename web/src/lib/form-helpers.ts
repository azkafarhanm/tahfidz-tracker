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
    const params = new URLSearchParams(extra);
    params.set("error", message);
    redirect(`${basePath}?${params.toString()}`);
  };
}

export function parseRecordDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return null;

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseDateInput(dateValue: string) {
  if (!dateValue) return null;

  const parsed = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
