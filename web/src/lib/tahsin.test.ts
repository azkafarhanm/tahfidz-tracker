import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramType, RecordStatus, Semester } from "@/generated/prisma-next/enums";

const mocks = vi.hoisted(() => ({
  getActiveAcademicYear: vi.fn(),
  studentFindFirst: vi.fn(),
  studentFindMany: vi.fn(),
  tahsinCreate: vi.fn(),
  tahsinFindMany: vi.fn(),
  tahsinFindFirst: vi.fn(),
  academicYearFindUnique: vi.fn(),
  timelineFindFirst: vi.fn(),
  timelineCreate: vi.fn(),
  meetingFindFirst: vi.fn(),
  meetingCreate: vi.fn(),
}));

vi.mock("./academic-year", async () => {
  const actual = await vi.importActual<typeof import("./academic-year")>("./academic-year");
  return { ...actual, getActiveAcademicYear: mocks.getActiveAcademicYear };
});

vi.mock("./prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    student: { findFirst: mocks.studentFindFirst, findMany: mocks.studentFindMany },
    academicYear: { findUnique: mocks.academicYearFindUnique },
    tahsinMeetingTimeline: { findFirst: mocks.timelineFindFirst, create: mocks.timelineCreate },
    tahsinMeeting: { findFirst: mocks.meetingFindFirst, create: mocks.meetingCreate },
    tahsinRecord: { create: mocks.tahsinCreate, findMany: mocks.tahsinFindMany, findFirst: mocks.tahsinFindFirst },
  },
}));

import {
  createTahsinRecord,
  advanceTahsinMeeting,
  formatTahsinPageRange,
  getLatestTahsinForStudent,
  getTahsinSmartDefaultForStudent,
  getTahsinForStudent,
  getTahsinForTeacher,
  getTahsinStudents,
  resetTahsinMeetingTimeline,
  normalizeTahsinPageRange,
  resolveTahsinMeetingContext,
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
  mocks.academicYearFindUnique.mockResolvedValue({ id: "year-1" });
  mocks.timelineFindFirst.mockResolvedValue({ id: "timeline-1", runNumber: 1 });
  mocks.meetingFindFirst.mockResolvedValue({ id: "meeting-1", meetingNumber: 1 });
});

describe("Tahsin domain validation", () => {
  it("resolves meeting-aware history context and preserves legacy records", () => {
    expect(resolveTahsinMeetingContext({ meetingNumber: 2, timeline: { runNumber: 3 } })).toEqual({ runNumber: 3, meetingNumber: 2 });
    expect(resolveTahsinMeetingContext(null)).toBeNull();
  });
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
  function meetingTransaction() {
    const meetings = [
      { id: "meeting-1", meetingNumber: 1, isActive: true },
    ];
    const timelines = [{ id: "timeline-1", runNumber: 1, isActive: true }];
    const records: Array<{ id: string; meetingId: string | null }> = [{ id: "legacy-record", meetingId: null }];
    const tx = {
      $queryRaw: vi.fn(),
      academicYear: { findUnique: vi.fn().mockResolvedValue({ id: "year-1" }) },
      tahsinMeetingTimeline: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: { isActive?: boolean; id?: string } }) =>
          timelines.find((timeline) => (!where.isActive || timeline.isActive) && (!where.id || timeline.id === where.id)) ?? null),
        create: vi.fn().mockImplementation(async ({ data }: { data: { runNumber: number } }) => {
          const timeline = { id: `timeline-${timelines.length + 1}`, ...data, isActive: true };
          timelines.push(timeline);
          return timeline;
        }),
        update: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          const timeline = timelines.find((item) => item.id === where.id)!;
          timeline.isActive = false;
          return timeline;
        }),
      },
      tahsinMeeting: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: { timelineId: string; isActive?: boolean } }) =>
          meetings.find((meeting) => meeting.isActive === (where.isActive === undefined ? meeting.isActive : where.isActive) && where.timelineId === "timeline-1") ?? null),
        update: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          const meeting = meetings.find((item) => item.id === where.id)!;
          meeting.isActive = false;
          return meeting;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: { timelineId: string; meetingNumber: number } }) => {
          const meeting = { id: `meeting-${meetings.length + 1}`, ...data, isActive: true };
          meetings.push(meeting);
          return meeting;
        }),
      },
      tahsinRecord: { findMany: vi.fn().mockResolvedValue(records) },
      state: { meetings, timelines, records },
    };
    return tx;
  }

  it("proves P1 to P2 to P3 state transitions and sequential numbers", async () => {
    const tx = meetingTransaction();
    const first = await advanceTahsinMeeting(admin, new Date("2026-08-16"), tx as never);
    const second = await advanceTahsinMeeting(admin, new Date("2027-01-15"), tx as never);
    expect(first.meetingNumber).toBe(2);
    expect(second.meetingNumber).toBe(3);
    expect(tx.state.meetings.map((meeting) => [meeting.meetingNumber, meeting.isActive])).toEqual([[1, false], [2, false], [3, true]]);
  });

  it("proves reset preserves Run 1 meetings and records while creating Run 2 P1", async () => {
    const tx = meetingTransaction();
    tx.state.meetings.push({ id: "meeting-2", meetingNumber: 2, isActive: false });
    tx.state.records.push({ id: "record-1", meetingId: "meeting-1" });
    const oldMeetingId = tx.state.records[1].meetingId;
    const created = await resetTahsinMeetingTimeline(admin, new Date("2026-08-20"), tx as never);
    expect(created.meetingNumber).toBe(1);
    expect(tx.state.timelines.map((timeline) => [timeline.runNumber, timeline.isActive])).toEqual([[1, false], [2, true]]);
    expect(tx.state.meetings.some((meeting) => meeting.id === "meeting-1")).toBe(true);
    expect(tx.state.meetings.some((meeting) => meeting.id === "meeting-2")).toBe(true);
    expect(tx.state.records.find((record) => record.id === "record-1")?.meetingId).toBe(oldMeetingId);
  });

  it("keeps legacy records readable without assigning a meeting number", async () => {
    const legacy = { id: "legacy-record", meetingId: null };
    mocks.tahsinFindMany.mockResolvedValueOnce([legacy]);
    await expect(getTahsinForStudent(admin, "student-a", { academicYear: "2026/2027" })).resolves.toEqual([legacy]);
    expect(legacy.meetingId).toBeNull();
  });

  it.each(["advance", "reset"] as const)("rejects teacher %s", async (operation) => {
    const tx = meetingTransaction();
    const mutation = operation === "advance" ? advanceTahsinMeeting : resetTahsinMeetingTimeline;
    await expect(mutation(teacher, new Date("2026-08-16"), tx as never)).rejects.toThrow("Hanya admin");
    expect(tx.tahsinMeeting.update).not.toHaveBeenCalled();
  });

  it("locks academic-year context before determining active meeting", async () => {
    const tx = meetingTransaction();
    await advanceTahsinMeeting(admin, new Date("2026-08-16"), tx as never);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

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

  it("uses an explicit transaction client for both eligible-student lookup and record insert", async () => {
    const txStudentFindFirst = vi.fn().mockResolvedValue({ id: "student-a", teacherId: "teacher-a" });
    const txTahsinCreate = vi.fn().mockImplementation(async ({ data }) => ({ id: "tahsin-a", ...data }));
    const tx = {
      student: { findFirst: txStudentFindFirst },
      tahsinRecord: { create: txTahsinCreate },
      academicYear: { findUnique: vi.fn().mockResolvedValue({ id: "year-1" }) },
      tahsinMeetingTimeline: { findFirst: vi.fn().mockResolvedValue({ id: "timeline-1" }) },
      tahsinMeeting: { findFirst: vi.fn().mockResolvedValue({ id: "meeting-1" }) },
      $queryRaw: vi.fn(),
    };

    await createTahsinRecord(teacher, {
      studentId: "student-a", jilid: 1, startPage: 5, endPage: null, date, score: 88, notes: null,
    }, tx as never);

    expect(txStudentFindFirst).toHaveBeenCalledTimes(1);
    expect(txTahsinCreate).toHaveBeenCalledTimes(1);
    expect(mocks.studentFindFirst).not.toHaveBeenCalled();
    expect(mocks.tahsinCreate).not.toHaveBeenCalled();
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

  it("uses a minimal scoped query for Smart Default", async () => {
    await getTahsinSmartDefaultForStudent(teacher, "student-a");
    expect(mocks.tahsinFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ studentId: "student-a", academicYear: "2026/2027" }),
      select: { jilid: true, startPage: true, endPage: true },
    }));
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
