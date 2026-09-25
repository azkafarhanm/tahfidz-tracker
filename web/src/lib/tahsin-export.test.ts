import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramType, Semester, TahsinMaterial } from "@/generated/prisma-next/enums";

const mocks = vi.hoisted(() => ({
  studentFindMany: vi.fn(),
  tahsinRecordFindMany: vi.fn(),
  tahsinMeetingFindMany: vi.fn(),
  halaqahMeetingFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    student: { findMany: mocks.studentFindMany },
    tahsinRecord: { findMany: mocks.tahsinRecordFindMany },
    tahsinMeeting: { findMany: mocks.tahsinMeetingFindMany },
    tahsinHalaqahMeeting: { findMany: mocks.halaqahMeetingFindMany },
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
    mocks.tahsinMeetingFindMany.mockReset();
    mocks.halaqahMeetingFindMany.mockReset();
    mocks.studentFindMany.mockResolvedValue([
      { id: "student-1", fullName: "Ahmad", classGroupId: "g7", academicClass: { name: "7A" } },
    ]);
    mocks.tahsinRecordFindMany.mockResolvedValue([{ id: "record-1" }]);
    mocks.tahsinMeetingFindMany.mockResolvedValue([{ meetingNumber: 1, meetingDate: new Date("2026-08-16T00:00:00.000Z") }]);
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
        material: TahsinMaterial.JILID,
        meeting: { timeline: { isActive: true } },
        teacherId: "teacher-a",
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    }));
    // Every meeting of the active timeline. Opening a meeting deactivates the
    // previous one, so filtering on the meeting's own flag used to return only
    // the latest meeting and misaligned the sheet's columns.
    expect(mocks.tahsinMeetingFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        timeline: { isActive: true, semester: Semester.GANJIL, academicYear: { year: "2026/2027" } },
      },
      orderBy: { meetingNumber: "asc" },
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

  it("rejects grades without Tahsin before querying", async () => {
    await expect(getTahsinExportData(
      { isAdmin: false, teacherId: "teacher-a" },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 10 },
    )).rejects.toThrow("Export Tahsin belum tersedia untuk kelas ini.");
    expect(mocks.studentFindMany).not.toHaveBeenCalled();
  });

  it("exports grade 8 from the halaqah's weekly meetings and Qur'an records only", async () => {
    mocks.studentFindMany.mockResolvedValue([
      { id: "student-8", fullName: "Dimas", classGroupId: "g8", academicClass: { name: "8A" } },
    ]);
    mocks.halaqahMeetingFindMany.mockResolvedValue([
      { meetingNumber: 1, meetingDate: new Date("2026-10-06T00:00:00.000Z"), classGroupId: "g8" },
    ]);

    const data = await getTahsinExportData(
      { isAdmin: false, teacherId: "teacher-a" },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 8 },
    );

    expect(data.material).toBe("QURAN");
    expect(mocks.studentFindMany.mock.calls[0][0].where.classGroup).toMatchObject({ grade: 8 });
    expect(mocks.halaqahMeetingFindMany.mock.calls[0][0].where).toEqual({ classGroupId: { in: ["g8"] }, semester: Semester.GANJIL });
    expect(mocks.tahsinRecordFindMany.mock.calls[0][0].where).toMatchObject({ material: TahsinMaterial.QURAN, teacherId: "teacher-a" });
    expect(mocks.tahsinMeetingFindMany).not.toHaveBeenCalled();
    expect(data.meetings).toEqual([{ meetingNumber: 1, meetingDate: new Date("2026-10-06T00:00:00.000Z") }]);
  });

  it("drops meeting dates when the sheet spans several halaqah", async () => {
    mocks.studentFindMany.mockResolvedValue([
      { id: "a", fullName: "A", classGroupId: "g8-a", academicClass: { name: "8A" } },
      { id: "b", fullName: "B", classGroupId: "g8-b", academicClass: { name: "8B" } },
    ]);
    mocks.halaqahMeetingFindMany.mockResolvedValue([
      { meetingNumber: 1, meetingDate: new Date("2026-10-06T00:00:00.000Z"), classGroupId: "g8-a" },
      { meetingNumber: 1, meetingDate: new Date("2026-10-08T00:00:00.000Z"), classGroupId: "g8-b" },
    ]);

    const data = await getTahsinExportData(
      { isAdmin: true, teacherId: null },
      { academicYear: "2026/2027", semester: Semester.GANJIL, classLevel: 8 },
    );

    expect(data.meetings).toEqual([{ meetingNumber: 1, meetingDate: undefined }]);
  });
});
