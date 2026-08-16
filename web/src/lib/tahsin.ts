import { ProgramType, RecordStatus, Semester } from "@/generated/prisma-next/enums";
import type { Prisma } from "@/generated/prisma-next/client";
import { getActiveAcademicYear, getAcademicYearForDate, getSemesterForDate } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { deriveRecordStatusFromScore } from "@/lib/record-status";

export const TAHSIN_ENABLED_GRADES = [7] as const;
export const TAHSIN_JILID_VALUES = [1, 2] as const;
export const TAHSIN_METHOD_NAME = "Ilman Wa Ruuhan";

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
      semester: getSemesterForDate(input.date),
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
    select: TAHSIN_RECORD_SELECT,
  });
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
