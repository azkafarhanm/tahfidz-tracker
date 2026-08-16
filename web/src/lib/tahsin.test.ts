import { describe, expect, it } from "vitest";
import { ProgramType, RecordStatus } from "@/generated/prisma-next/enums";
import { formatTahsinPageRange, normalizeTahsinPageRange, validateJilid, validatePageRange, validateTahsinAcademicScope, validateTahsinScore } from "./tahsin";

describe("Tahsin domain validation", () => {
  it.each([1, 2])("accepts jilid %i", (jilid) => expect(validateJilid(jilid)).toEqual({ ok: true }));
  it.each([0, -1])("rejects invalid jilid %i", (jilid) => expect(validateJilid(jilid).ok).toBe(false));
  it("accepts a positive single page", () => {
    expect(validatePageRange(5, null)).toEqual({ ok: true });
    expect(formatTahsinPageRange(5, null)).toBe("5");
  });
  it.each([0, -1])("rejects invalid start page %i", (startPage) => expect(validatePageRange(startPage, null).ok).toBe(false));
  it("accepts an end page equal to or after the start page", () => {
    expect(validatePageRange(5, 5)).toEqual({ ok: true });
    expect(validatePageRange(5, 8)).toEqual({ ok: true });
    expect(formatTahsinPageRange(5, 5)).toBe("5");
    expect(formatTahsinPageRange(5, 8)).toBe("5–8");
    expect(normalizeTahsinPageRange(5, 5)).toEqual({ startPage: 5, endPage: null });
  });
  it("rejects an end page before the start page", () => expect(validatePageRange(8, 5).ok).toBe(false));
  it("allows Academic grade 7 only during the rollout", () => {
    expect(validateTahsinAcademicScope({ programType: ProgramType.ACADEMIC, grade: 7 })).toEqual({ ok: true });
    expect(validateTahsinAcademicScope({ programType: ProgramType.ACADEMIC, grade: 8 }).ok).toBe(false);
  });
  it("rejects Boarding regardless of grade", () => expect(validateTahsinAcademicScope({ programType: ProgramType.BOARDING, grade: 7 }).ok).toBe(false));
  it("derives the existing RecordStatus score bands", () => {
    expect(validateTahsinScore(88)).toEqual({ ok: true, status: RecordStatus.LANCAR });
    expect(validateTahsinScore(81)).toEqual({ ok: true, status: RecordStatus.CUKUP });
    expect(validateTahsinScore(75)).toEqual({ ok: true, status: RecordStatus.PERLU_MUROJAAH });
    expect(validateTahsinScore(null).ok).toBe(false);
    expect(validateTahsinScore(74).ok).toBe(false);
  });
});
