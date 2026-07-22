"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  MeetingAttendanceStatus,
  ProgramType,
  RecordStatus,
} from "@/generated/prisma-next/enums";
import { Prisma } from "@/generated/prisma-next/client";
import {
  QuickLogRecordType,
  quickLogTypeLabels,
} from "@/lib/quick-log";
import { prisma } from "@/lib/prisma";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { requireSessionScope } from "@/lib/session";
import { validateRecordFields } from "@/lib/validate-record";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { deriveRecordStatusFromScore } from "@/lib/record-status";
import {
  readString,
  readOptionalString,
  readInt,
  parseRecordDateTime,
} from "@/lib/form-helpers";
import { getJakartaDayKey } from "@/lib/jakarta-date";
import { parseMeetingDate } from "@/lib/meeting-status";

const validStatuses = new Set<string>(Object.values(RecordStatus));
const validTypes = new Set<string>(Object.keys(quickLogTypeLabels));
const validMeetingStatuses = new Set<string>(Object.values(MeetingAttendanceStatus));

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function createGuidedRecord(formData: FormData) {
  const { session } = await requireSessionScope();

  const t = await getTranslations("Validation");
  const studentId = readString(formData, "studentId");
  const typeValue = readString(formData, "type");
  const surah = readString(formData, "surah");
  const fromAyah = readInt(formData, "fromAyah");
  const toAyah = readInt(formData, "toAyah");
  const date = parseRecordDateTime(
    readString(formData, "date"),
    readString(formData, "time"),
    readString(formData, "timezoneOffset"),
  );
  const score = readInt(formData, "score");
  const notes = readOptionalString(formData, "notes");

  if (!studentId) {
    return { ok: false as const, error: t("selectStudent") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: {
      id: true,
      teacherId: true,
    },
  });

  if (!student) {
    return { ok: false as const, error: t("studentInactive") };
  }

  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return { ok: false as const, error: t("noPermissionStudent") };
  }

  if (!validTypes.has(typeValue)) {
    return { ok: false as const, error: t("recordTypeInvalid") };
  }

  const statusValue = deriveRecordStatusFromScore(score);

  try {
    await validateRecordFields({
      surah, fromAyah, toAyah, date, statusValue, score, notes, validStatuses,
      fail: (message: string) => { throw new ValidationError(message); },
      t,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return { ok: false as const, error: e.message };
    }
    throw e;
  }

  const [academicYear, semester] = await Promise.all([
    getActiveAcademicYear(),
    getSemesterForDate(date!),
  ]);

  const data = {
    studentId: student.id,
    teacherId: student.teacherId,
    surah,
    fromAyah: fromAyah!,
    toAyah: toAyah!,
    date: date!,
    status: statusValue as RecordStatus,
    score,
    notes,
    academicYear,
    semester,
  };

  const record =
    (typeValue as QuickLogRecordType) === "MUROJAAH"
      ? await prisma.revisionRecord.create({ data })
      : await prisma.memorizationRecord.create({ data });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${student.id}`);
  revalidatePath("/quick-log");
  revalidatePath("/formative");
  revalidatePath(`/formative/${student.id}`);
  invalidateStudentRelatedCaches(student.id);
  return { ok: true as const, recordId: record.id, success: t("recordSaved") };
}

export async function createQuickLogMeetingStatus(
  studentId: string,
  statusValue: string,
) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("QuickLog");

  if (!validMeetingStatuses.has(statusValue)) {
    return { ok: false as const, error: t("meetingStatusInvalid") };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: {
      id: true,
      teacherId: true,
      classGroup: { select: { programType: true } },
    },
  });

  if (!student) return { ok: false as const, error: t("meetingStudentUnavailable") };
  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return { ok: false as const, error: t("meetingNoPermission") };
  }
  if (student.classGroup.programType !== ProgramType.ACADEMIC) {
    return { ok: false as const, error: t("meetingAcademicOnly") };
  }

  const date = parseMeetingDate(getJakartaDayKey(new Date()))!;
  const status = statusValue as MeetingAttendanceStatus;

  try {
    await prisma.meetingStatus.create({
      data: {
        studentId: student.id,
        teacherId: student.teacherId,
        programType: ProgramType.ACADEMIC,
        date,
        status,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const existing = await prisma.meetingStatus.findUnique({
      where: {
        studentId_programType_date: {
          studentId: student.id,
          programType: ProgramType.ACADEMIC,
          date,
        },
      },
      select: { status: true },
    });
    if (!existing) throw error;
    return {
      ok: true as const,
      created: false as const,
      status: existing.status,
      success: t("meetingStatusAlreadyRecorded"),
    };
  }

  revalidatePath(`/students/${student.id}`);
  revalidatePath("/quick-log");
  invalidateStudentRelatedCaches(student.id);
  return {
    ok: true as const,
    created: true as const,
    status,
    success: t("meetingStatusSaved"),
  };
}
