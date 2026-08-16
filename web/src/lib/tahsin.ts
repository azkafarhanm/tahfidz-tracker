import { ProgramType, RecordStatus, Semester } from "@/generated/prisma-next/enums";
import type { Prisma } from "@/generated/prisma-next/client";
import { getActiveAcademicYear, getAcademicYearForDate, getSemesterForDate } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { deriveRecordStatusFromScore } from "@/lib/record-status";

export const TAHSIN_ENABLED_GRADES = [7] as const;
export const TAHSIN_JILID_VALUES = [1, 2] as const;
export const TAHSIN_METHOD_NAME = "Ilman Wa Ruuhan";

export type TahsinMeetingContext = {
  runNumber: number;
  meetingNumber: number;
};

export function resolveTahsinMeetingContext(
  meeting: { meetingNumber: number; timeline: { runNumber: number } } | null,
): TahsinMeetingContext | null {
  return meeting
    ? { runNumber: meeting.timeline.runNumber, meetingNumber: meeting.meetingNumber }
    : null;
}

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

export type TahsinActor = {
  isAdmin: boolean;
  teacherId: string | null;
};

type TahsinQueryOptions = {
  academicYear?: string;
  semester?: Semester;
};

export type TahsinExportOptions = TahsinQueryOptions & {
  classLevel: number;
};

type TahsinCreateInput = {
  studentId: string;
  jilid: number;
  startPage: number;
  endPage: number | null;
  date: Date;
  score: number | null;
  notes: string | null;
};

const TAHSIN_RECORD_SELECT = {
  id: true,
  studentId: true,
  teacherId: true,
  jilid: true,
  startPage: true,
  endPage: true,
  date: true,
  score: true,
  status: true,
  notes: true,
  academicYear: true,
  semester: true,
  createdAt: true,
  updatedAt: true,
  meetingId: true,
  meeting: {
    select: {
      meetingNumber: true,
      timeline: { select: { runNumber: true } },
    },
  },
} as const;

const TAHSIN_TEACHER_RECORD_SELECT = {
  ...TAHSIN_RECORD_SELECT,
  student: { select: { fullName: true, academicClass: { select: { name: true } } } },
} as const;

function assertValid(result: TahsinValidationResult | { ok: true; status: RecordStatus }) {
  if (!result.ok) throw new Error(result.error);
}

function assertTeacherActor(actor: TahsinActor) {
  if (actor.isAdmin || !actor.teacherId) {
    throw new Error("Tahsin hanya dapat dibuat oleh guru yang terautentikasi.");
  }
  return actor.teacherId;
}

function tahsinStudentWhere(academicYear: string, teacherId?: string) {
  return {
    isActive: true,
    classGroup: {
      isActive: true,
      academicYear,
      programType: ProgramType.ACADEMIC,
      grade: TAHSIN_ENABLED_GRADES[0],
    },
    ...(teacherId ? { teacherId } : {}),
  };
}

async function resolveQueryContext(options?: TahsinQueryOptions) {
  return {
    academicYear: options?.academicYear ?? await getActiveAcademicYear(),
    ...(options?.semester ? { semester: options.semester } : {}),
  };
}

async function getOrCreateActiveTahsinMeeting(
  academicYear: string,
  semester: Semester,
  meetingDate: Date,
  db: Prisma.TransactionClient,
) {
  const year = await db.academicYear.findUnique({
    where: { year: academicYear },
    select: { id: true },
  });
  if (!year) throw new Error("Tahun ajaran aktif tidak ditemukan.");

  await db.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
  let timeline = await db.tahsinMeetingTimeline.findFirst({
    where: { academicYearId: year.id, semester, isActive: true },
    orderBy: { runNumber: "desc" },
  });
  if (!timeline) {
    const latest = await db.tahsinMeetingTimeline.findFirst({
      where: { academicYearId: year.id, semester },
      orderBy: { runNumber: "desc" },
      select: { runNumber: true },
    });
    timeline = await db.tahsinMeetingTimeline.create({
      data: { academicYearId: year.id, semester, runNumber: (latest?.runNumber ?? 0) + 1 },
    });
  }

  let meeting = await db.tahsinMeeting.findFirst({
    where: { timelineId: timeline.id, isActive: true },
    orderBy: { meetingNumber: "desc" },
  });
  if (!meeting) {
    meeting = await db.tahsinMeeting.create({
      data: { timelineId: timeline.id, meetingNumber: 1, meetingDate },
    });
  }
  return meeting;
}

export async function getActiveTahsinMeeting(academicYear: string, semester: Semester) {
  return prisma.tahsinMeeting.findFirst({
    where: { isActive: true, timeline: { academicYear: { year: academicYear }, semester, isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { timeline: { select: { runNumber: true } } },
  });
}

async function lockTahsinContext(
  academicYear: string,
  semester: Semester,
  db: Prisma.TransactionClient,
) {
  const year = await db.academicYear.findUnique({ where: { year: academicYear }, select: { id: true } });
  if (!year) throw new Error("Tahun ajaran aktif tidak ditemukan.");
  await db.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
  const timeline = await db.tahsinMeetingTimeline.findFirst({
    where: { academicYearId: year.id, semester, isActive: true },
    orderBy: { runNumber: "desc" },
  });
  if (!timeline) throw new Error("Timeline Tahsin aktif belum tersedia.");
  const meeting = await db.tahsinMeeting.findFirst({
    where: { timelineId: timeline.id, isActive: true },
    orderBy: { meetingNumber: "desc" },
  });
  if (!meeting) throw new Error("Pertemuan Tahsin aktif belum tersedia.");
  return { year, timeline, meeting };
}

export async function advanceTahsinMeeting(
  actor: TahsinActor,
  meetingDate: Date,
  db?: Prisma.TransactionClient,
) {
  if (!actor.isAdmin) throw new Error("Hanya admin yang dapat melanjutkan Pertemuan Tahsin.");
  const academicYear = await getActiveAcademicYear();
  const semester = getSemesterForDate(new Date());
  const mutate = async (tx: Prisma.TransactionClient) => {
    const { timeline, meeting } = await lockTahsinContext(academicYear, semester, tx);
    await tx.tahsinMeeting.update({ where: { id: meeting.id }, data: { isActive: false } });
    return tx.tahsinMeeting.create({
      data: { timelineId: timeline.id, meetingNumber: meeting.meetingNumber + 1, meetingDate },
    });
  };
  return db ? mutate(db) : prisma.$transaction(mutate);
}

export async function resetTahsinMeetingTimeline(
  actor: TahsinActor,
  meetingDate: Date,
  db?: Prisma.TransactionClient,
) {
  if (!actor.isAdmin) throw new Error("Hanya admin yang dapat mereset timeline Tahsin.");
  const academicYear = await getActiveAcademicYear();
  const semester = getSemesterForDate(new Date());
  const mutate = async (tx: Prisma.TransactionClient) => {
    const { year, timeline, meeting } = await lockTahsinContext(academicYear, semester, tx);
    await tx.tahsinMeeting.update({ where: { id: meeting.id }, data: { isActive: false } });
    await tx.tahsinMeetingTimeline.update({ where: { id: timeline.id }, data: { isActive: false } });
    const nextTimeline = await tx.tahsinMeetingTimeline.create({
      data: { academicYearId: year.id, semester, runNumber: timeline.runNumber + 1 },
    });
    return tx.tahsinMeeting.create({ data: { timelineId: nextTimeline.id, meetingNumber: 1, meetingDate } });
  };
  return db ? mutate(db) : prisma.$transaction(mutate);
}

export async function createTahsinRecord(
  actor: TahsinActor,
  input: TahsinCreateInput,
  db: Prisma.TransactionClient = prisma,
) {
  const teacherId = assertTeacherActor(actor);
  if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
    throw new Error("Tanggal Tahsin tidak valid.");
  }

  assertValid(validateJilid(input.jilid));
  assertValid(validatePageRange(input.startPage, input.endPage));
  const scoreResult = validateTahsinScore(input.score);
  if (!scoreResult.ok) throw new Error(scoreResult.error);

  const academicYear = await getActiveAcademicYear();
  if (getAcademicYearForDate(input.date) !== academicYear) {
    throw new Error("Tanggal Tahsin harus berada pada tahun ajaran aktif.");
  }

  const student = await db.student.findFirst({
    where: {
      id: input.studentId,
      ...tahsinStudentWhere(academicYear, teacherId),
    },
    select: { id: true, teacherId: true },
  });

  if (!student) {
    throw new Error("Santri tidak tersedia untuk penilaian Tahsin.");
  }

  const pageRange = normalizeTahsinPageRange(input.startPage, input.endPage);
  const semester = getSemesterForDate(input.date);
  const meeting = await getOrCreateActiveTahsinMeeting(academicYear, semester, input.date, db);
  return db.tahsinRecord.create({
    data: {
      studentId: student.id,
      teacherId: student.teacherId,
      jilid: input.jilid,
      ...pageRange,
      date: input.date,
      score: input.score,
      status: scoreResult.status,
      notes: input.notes,
      academicYear,
      semester,
      meetingId: meeting.id,
    },
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function getTahsinForStudent(
  actor: TahsinActor,
  studentId: string,
  options?: TahsinQueryOptions,
) {
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findMany({
    where: {
      studentId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function getLatestTahsinForStudent(
  actor: TahsinActor,
  studentId: string,
  options?: TahsinQueryOptions,
) {
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findFirst({
    where: {
      studentId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function getTahsinSmartDefaultForStudent(
  actor: TahsinActor,
  studentId: string,
) {
  const context = await resolveQueryContext();
  return prisma.tahsinRecord.findFirst({
    where: {
      studentId,
      academicYear: context.academicYear,
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { jilid: true, startPage: true, endPage: true },
  });
}

export async function getTahsinForTeacher(actor: TahsinActor, options?: TahsinQueryOptions) {
  const teacherId = assertTeacherActor(actor);
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findMany({
    where: {
      teacherId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, teacherId),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_TEACHER_RECORD_SELECT,
  });
}

export async function getTahsinExportData(
  actor: TahsinActor,
  options: TahsinExportOptions,
) {
  if (!TAHSIN_ENABLED_GRADES.includes(options.classLevel as 7)) {
    throw new Error("Export Tahsin belum tersedia untuk kelas ini.");
  }

  if (!options.semester) {
    throw new Error("Semester diperlukan untuk export Tahsin.");
  }

  const context = await resolveQueryContext(options);
  const teacherId = actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__";
  const studentWhere = tahsinStudentWhere(context.academicYear, teacherId);
  const students = await prisma.student.findMany({
    where: studentWhere,
    select: {
      id: true,
      fullName: true,
      academicClass: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const studentIds = students.map((student) => student.id);
  const records = studentIds.length > 0
    ? await prisma.tahsinRecord.findMany({
        where: {
          studentId: { in: studentIds },
          academicYear: context.academicYear,
          semester: options.semester,
          ...(teacherId ? { teacherId } : {}),
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: TAHSIN_RECORD_SELECT,
      })
    : [];

  return { students, records };
}

export async function getTahsinStudents(actor: TahsinActor) {
  const teacherId = assertTeacherActor(actor);
  const academicYear = await getActiveAcademicYear();
  return prisma.student.findMany({
    where: tahsinStudentWhere(academicYear, teacherId),
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, academicClass: { select: { name: true } } },
  });
}
