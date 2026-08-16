import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramType, RecordStatus, Semester } from "@/generated/prisma-next/enums";

const mocks = vi.hoisted(() => ({
  getActiveAcademicYear: vi.fn(),
  studentFindFirst: vi.fn(),
  studentFindMany: vi.fn(),
  tahsinCreate: vi.fn(),
  tahsinFindMany: vi.fn(),
  tahsinFindFirst: vi.fn(),
}));

vi.mock("./academic-year", async () => {
  const actual = await vi.importActual<typeof import("./academic-year")>("./academic-year");
  return { ...actual, getActiveAcademicYear: mocks.getActiveAcademicYear };
});

vi.mock("./prisma", () => ({
  prisma: {
    student: { findFirst: mocks.studentFindFirst, findMany: mocks.studentFindMany },
    tahsinRecord: { create: mocks.tahsinCreate, findMany: mocks.tahsinFindMany, findFirst: mocks.tahsinFindFirst },
  },
}));

import {
  createTahsinRecord,
  formatTahsinPageRange,
  getLatestTahsinForStudent,
  getTahsinForStudent,
  getTahsinForTeacher,
  getTahsinStudents,
  normalizeTahsinPageRange,
  TAHSIN_METHOD_NAME,
  validateJilid,
  validatePageRange,
  validateTahsinAcademicScope,
  validateTahsinScore,
} from "./tahsin";

const teacher = { isAdmin: false, teacherId: "teacher-a" };
const admin = { isAdmin: true, teacherId: null };
const date = new Date(2026, 7, 16);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getActiveAcademicYear.mockResolvedValue("2026/2027");
  mocks.studentFindFirst.mockResolvedValue({ id: "student-a", teacherId: "teacher-a" });
  mocks.studentFindMany.mockResolvedValue([]);
  mocks.tahsinCreate.mockImplementation(async ({ data }) => ({ id: "tahsin-a", ...data }));
  mocks.tahsinFindMany.mockResolvedValue([]);
  mocks.tahsinFindFirst.mockResolvedValue(null);
});

describe("Tahsin domain validation", () => {
  it("uses the fixed Ilman Wa Ruuhan method without persisting it per record", () => {
    expect(TAHSIN_METHOD_NAME).toBe("Ilman Wa Ruuhan");
  });
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

describe("Tahsin service authorization and isolation", () => {
  it("creates only for the authenticated teacher's eligible student", async () => {
    const record = await createTahsinRecord(teacher, {
      studentId: "student-a", jilid: 1, startPage: 5, endPage: 5, date, score: 88, notes: null,
    });
    expect(record.teacherId).toBe("teacher-a");
    expect(record.status).toBe(RecordStatus.LANCAR);
    expect(record.academicYear).toBe("2026/2027");
    expect(record.semester).toBe(Semester.GANJIL);
    expect(record.endPage).toBeNull();
    expect(mocks.studentFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "student-a", teacherId: "teacher-a", isActive: true }),
    }));
  });

  it.each([
    [ProgramType.BOARDING, 7],
    [ProgramType.ACADEMIC, 8],
    [ProgramType.ACADEMIC, 9],
  ])("excludes %s grade %i from the student lookup", async (programType, grade) => {
    expect(validateTahsinAcademicScope({ programType, grade }).ok).toBe(false);
    mocks.studentFindFirst.mockResolvedValue(null);
    await expect(createTahsinRecord(teacher, {
      studentId: "student-a", jilid: 1, startPage: 5, endPage: null, date, score: 88, notes: null,
    })).rejects.toThrow("Santri tidak tersedia");
    expect(mocks.tahsinCreate).not.toHaveBeenCalled();
    const where = mocks.studentFindFirst.mock.calls[0][0].where;
    expect(where.classGroup).toMatchObject({ programType: ProgramType.ACADEMIC, grade: 7, isActive: true });
  });

  it("rejects missing, inactive, foreign, Boarding, and non-rollout students through the scoped lookup", async () => {
    mocks.studentFindFirst.mockResolvedValue(null);
    await expect(createTahsinRecord(teacher, {
      studentId: "student-b", jilid: 2, startPage: 6, endPage: null, date, score: 81, notes: null,
    })).rejects.toThrow("Santri tidak tersedia");
    expect(mocks.tahsinCreate).not.toHaveBeenCalled();
  });

  it("rejects admin create because this service is teacher-entry only", async () => {
    await expect(createTahsinRecord(admin, {
      studentId: "student-a", jilid: 1, startPage: 5, endPage: null, date, score: 88, notes: null,
    })).rejects.toThrow("guru yang terautentikasi");
  });

  it("rejects invalid score before database access", async () => {
    await expect(createTahsinRecord(teacher, {
      studentId: "student-a", jilid: 3, startPage: 5, endPage: null, date, score: 74, notes: null,
    })).rejects.toThrow();
    expect(mocks.studentFindFirst).not.toHaveBeenCalled();
  });

  it("scopes student history and latest record to the requested student, teacher, Academic context, and semester", async () => {
    await getTahsinForStudent(teacher, "student-a", { academicYear: "2026/2027", semester: Semester.GANJIL });
    await getLatestTahsinForStudent(teacher, "student-a", { academicYear: "2026/2027", semester: Semester.GANJIL });
    for (const call of [mocks.tahsinFindMany.mock.calls[0][0], mocks.tahsinFindFirst.mock.calls[0][0]]) {
      expect(call.where).toMatchObject({ studentId: "student-a", academicYear: "2026/2027", semester: Semester.GANJIL });
      expect(call.where.student).toMatchObject({ teacherId: "teacher-a", classGroup: { programType: ProgramType.ACADEMIC, grade: 7 } });
    }
  });

  it("scopes teacher records and eligible students to the authenticated teacher", async () => {
    await getTahsinForTeacher(teacher, { semester: Semester.GENAP });
    await getTahsinStudents(teacher);
    expect(mocks.tahsinFindMany.mock.calls[0][0].where).toMatchObject({ teacherId: "teacher-a", semester: Semester.GENAP });
    expect(mocks.studentFindMany.mock.calls[0][0].where).toMatchObject({ teacherId: "teacher-a", classGroup: { academicYear: "2026/2027", programType: ProgramType.ACADEMIC, grade: 7 } });
  });

  it("allows admin read-only student history without assigning a teacher ownership filter", async () => {
    await getTahsinForStudent(admin, "student-a", { semester: Semester.GANJIL });
    expect(mocks.tahsinFindMany.mock.calls[0][0].where.student).not.toHaveProperty("teacherId");
  });
});
