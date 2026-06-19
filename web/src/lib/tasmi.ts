import { TasmiGrade, TasmiStatus, Semester } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { cached, invalidateCache } from "@/lib/cache";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";

export const tasmiGradeLabels: Record<TasmiGrade, string> = {
  [TasmiGrade.MUMTAZ]: "Mumtaz",
  [TasmiGrade.JAYYID_JIDDAN]: "Jayyid Jiddan",
  [TasmiGrade.JAYYID]: "Jayyid",
  [TasmiGrade.MAQBUL]: "Maqbul",
};

export const tasmiStatusLabel: Record<TasmiStatus, string> = {
  [TasmiStatus.LULUS]: "Lulus",
  [TasmiStatus.MENGULANG]: "Mengulang",
};

export const tasmiGradeOptions = [
  { value: TasmiGrade.MUMTAZ, label: tasmiGradeLabels[TasmiGrade.MUMTAZ] },
  { value: TasmiGrade.JAYYID_JIDDAN, label: tasmiGradeLabels[TasmiGrade.JAYYID_JIDDAN] },
  { value: TasmiGrade.JAYYID, label: tasmiGradeLabels[TasmiGrade.JAYYID] },
  { value: TasmiGrade.MAQBUL, label: tasmiGradeLabels[TasmiGrade.MAQBUL] },
] as const;

export const tasmiStatusOptions = [
  { value: TasmiStatus.LULUS, label: tasmiStatusLabel[TasmiStatus.LULUS] },
  { value: TasmiStatus.MENGULANG, label: tasmiStatusLabel[TasmiStatus.MENGULANG] },
] as const;

export function formatTasmiJuzSummary(juzNumbers: number[]): string {
  if (juzNumbers.length === 0) return "";
  const sorted = [...new Set(juzNumbers)].sort((a, b) => b - a);
  return `Tasmi' Juz ${sorted.join(", ")}`;
}

export function getHighestCompletedTasmiJuz(records: Array<{ juz: number; status: TasmiStatus }>): number {
  return records
    .filter((r) => r.status === TasmiStatus.LULUS)
    .reduce((max, r) => Math.max(max, r.juz), 0);
}

export function getCompletedTasmiJuzList(records: Array<{ juz: number; status: TasmiStatus }>): number[] {
  return [...new Set(
    records
      .filter((r) => r.status === TasmiStatus.LULUS)
      .map((r) => r.juz),
  )].sort((a, b) => b - a);
}

const TASMI_CACHE_TTL = 30_000;

export async function getStudentTasmiRecords(
  studentId: string,
  academicYear?: string,
  semester?: Semester,
) {
  return cached(
    `tasmi-detail:${studentId}:${academicYear ?? "all"}:${semester ?? "all"}`,
    TASMI_CACHE_TTL,
    async () => {
      const year = academicYear ?? await getActiveAcademicYear();
      return prisma.tasmiRecord.findMany({
        where: {
          studentId,
          academicYear: year,
          ...(semester ? { semester } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          juz: true,
          grade: true,
          status: true,
          examinerName: true,
          date: true,
          notes: true,
          semester: true,
          academicYear: true,
        },
      });
    },
  );
}

export async function getTasmiRecordForEdit(tasmiId: string, teacherId: string | null) {
  return prisma.tasmiRecord.findFirst({
    where: {
      id: tasmiId,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          classGroup: { select: { name: true, level: true, grade: true, programType: true } },
          academicClass: { select: { name: true } },
        },
      },
    },
  });
}

export async function createTasmiRecord(input: {
  studentId: string;
  teacherId: string;
  juz: number;
  grade: TasmiGrade;
  status: TasmiStatus;
  examinerName: string;
  date: Date;
  notes: string | null;
}) {
  const academicYear = await getActiveAcademicYear();
  const semester = getSemesterForDate(input.date);

  return prisma.tasmiRecord.create({
    data: {
      studentId: input.studentId,
      teacherId: input.teacherId,
      juz: input.juz,
      grade: input.grade,
      status: input.status,
      examinerName: input.examinerName,
      date: input.date,
      notes: input.notes,
      academicYear,
      semester,
    },
  });
}

export async function updateTasmiRecord(
  tasmiId: string,
  input: {
    juz: number;
    grade: TasmiGrade;
    status: TasmiStatus;
    examinerName: string;
    date: Date;
    notes: string | null;
  },
) {
  const semester = getSemesterForDate(input.date);

  return prisma.tasmiRecord.update({
    where: { id: tasmiId },
    data: {
      juz: input.juz,
      grade: input.grade,
      status: input.status,
      examinerName: input.examinerName,
      date: input.date,
      notes: input.notes,
      semester,
    },
  });
}

export async function deleteTasmiRecord(tasmiId: string, studentId: string) {
  await prisma.tasmiRecord.delete({
    where: { id: tasmiId },
  });
  invalidateTasmiCache(studentId);
}

export function invalidateTasmiCache(studentId?: string) {
  if (studentId) {
    invalidateCache(`tasmi-detail:${studentId}`);
    invalidateCache(`students:detail:${studentId}`);
    invalidateCache(`export-bundle:student:${studentId}`);
  }
  invalidateCache("tasmi-");
  invalidateCache("dashboard");
  invalidateCache("report-");
}
