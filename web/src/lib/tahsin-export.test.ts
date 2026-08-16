import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";

const mocks = vi.hoisted(() => ({
  studentFindMany: vi.fn(),
  tahsinRecordFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    student: { findMany: mocks.studentFindMany },
    tahsinRecord: { findMany: mocks.tahsinRecordFindMany },
  },
}));

vi.mock("@/lib/academic-year", () => ({
  getActiveAcademicYear: vi.fn(),
  getAcademicYearForDate: vi.fn(),
  getSemesterForDate: vi.fn(),
}));

import { getTahsinExportData } from "@/lib/tahsin";

describe("getTahsinExportData", () => {
  beforeEach(() => {
    mocks.studentFindMany.mockReset();
    mocks.tahsinRecordFindMany.mockReset();
    mocks.studentFindMany.mockResolvedValue([
      { id: "student-1", fullName: "Ahmad", academicClass: { name: "7A" } },
    ]);
    mocks.tahsinRecordFindMany.mockResolvedValue([{ id: "record-1" }]);
  });

  it("limits teachers to active Academic grade 7 students and matching records", async () => {
    await getTahsinExportData(
      { isAdmin: false, teacherId: "teacher-a" },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 7 },
    );

    const studentWhere = mocks.studentFindMany.mock.calls[0][0].where;
    expect(studentWhere).toMatchObject({
      teacherId: "teacher-a",
      isActive: true,
      classGroup: {
        academicYear: "2026/2027",
        isActive: true,
        programType: ProgramType.ACADEMIC,
        grade: 7,
      },
    });
    expect(mocks.tahsinRecordFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        studentId: { in: ["student-1"] },
        academicYear: "2026/2027",
        semester: Semester.GANJIL,
        teacherId: "teacher-a",
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    }));
  });

  it("allows admins to read the same Academic grade 7 scope without a teacher filter", async () => {
    await getTahsinExportData(
      { isAdmin: true, teacherId: null },
      { academicYear: "2026/2027", semester: Semester.GENAP, classLevel: 7 },
    );

    const studentWhere = mocks.studentFindMany.mock.calls[0][0].where;
    expect(studentWhere).not.toHaveProperty("teacherId");
    expect(studentWhere.classGroup).toMatchObject({
      programType: ProgramType.ACADEMIC,
      grade: 7,
    });
    expect(mocks.tahsinRecordFindMany.mock.calls[0][0].where).not.toHaveProperty("teacherId");
  });

  it("rejects the grade 8 and grade 9 rollout scopes before querying", async () => {
    await expect(getTahsinExportData(
      { isAdmin: false, teacherId: "teacher-a" },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 8 },
    )).rejects.toThrow("Export Tahsin belum tersedia untuk kelas ini.");
    await expect(getTahsinExportData(
      { isAdmin: false, teacherId: "teacher-a" },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 9 },
    )).rejects.toThrow("Export Tahsin belum tersedia untuk kelas ini.");
    expect(mocks.studentFindMany).not.toHaveBeenCalled();
  });
});
