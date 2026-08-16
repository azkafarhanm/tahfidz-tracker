import { ProgramType, RecordStatus } from "@/generated/prisma-next/enums";
import { deriveRecordStatusFromScore } from "@/lib/record-status";

export const TAHSIN_ENABLED_GRADES = [7] as const;
export const TAHSIN_JILID_VALUES = [1, 2] as const;

export type TahsinValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateJilid(jilid: number): TahsinValidationResult {
  return TAHSIN_JILID_VALUES.includes(jilid as 1 | 2)
    ? { ok: true }
    : { ok: false, error: "Jilid Tahsin harus 1 atau 2." };
}

export function validatePageRange(startPage: number, endPage: number | null): TahsinValidationResult {
  if (!Number.isInteger(startPage) || startPage <= 0) return { ok: false, error: "Halaman awal harus berupa bilangan bulat positif." };
  if (endPage === null) return { ok: true };
  if (!Number.isInteger(endPage) || endPage <= 0) return { ok: false, error: "Halaman akhir harus berupa bilangan bulat positif." };
  if (endPage < startPage) return { ok: false, error: "Halaman akhir tidak boleh lebih kecil dari halaman awal." };
  return { ok: true };
}

export function formatTahsinPageRange(startPage: number, endPage: number | null) {
  return endPage === null || endPage === startPage ? String(startPage) : `${startPage}–${endPage}`;
}

export function normalizeTahsinPageRange(startPage: number, endPage: number | null) {
  return {
    startPage,
    endPage: endPage === startPage ? null : endPage,
  };
}

export function validateTahsinAcademicScope(input: { programType: ProgramType; grade: number }): TahsinValidationResult {
  if (input.programType !== ProgramType.ACADEMIC) return { ok: false, error: "Tahsin hanya tersedia untuk program Academic." };
  if (!TAHSIN_ENABLED_GRADES.includes(input.grade as 7)) return { ok: false, error: "Tahsin belum tersedia untuk kelas ini." };
  return { ok: true };
}

export function validateTahsinScore(score: number | null): { ok: true; status: RecordStatus } | { ok: false; error: string } {
  if (score === null || !Number.isInteger(score) || score < 0 || score > 100) return { ok: false, error: "Nilai harus berada di antara 0 sampai 100." };
  const status = deriveRecordStatusFromScore(score);
  return status ? { ok: true, status } : { ok: false, error: "Nilai harus berada dalam rentang penilaian yang berlaku." };
}
