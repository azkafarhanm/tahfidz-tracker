"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  MeetingAttendanceStatus,
  ProgramType,
} from "@/generated/prisma-next/enums";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { createFailFn, readOptionalString, readString } from "@/lib/form-helpers";
import { parseMeetingDate } from "@/lib/meeting-status";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

const validStatuses = new Set<string>(Object.values(MeetingAttendanceStatus));

export async function upsertMeetingStatus(studentId: string, formData: FormData) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("MeetingStatusForm");
  const fail = createFailFn(`/students/${studentId}/meeting-status`);

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true },
    select: {
      id: true,
      teacherId: true,
      classGroup: { select: { programType: true } },
    },
  });

  if (!student) return fail(t("studentUnavailable"));
  if (session.user.role !== "ADMIN" && student.teacherId !== session.user.teacherId) {
    return fail(t("noPermission"));
  }
  if (student.classGroup.programType !== ProgramType.ACADEMIC) {
    return fail(t("academicOnly"));
  }

  const date = parseMeetingDate(readString(formData, "date"));
  const status = readString(formData, "status");
  const note = readOptionalString(formData, "note");

  if (!date) return fail(t("invalidDate"));
  if (!validStatuses.has(status)) return fail(t("invalidStatus"));

  const meeting = await prisma.meetingStatus.upsert({
    where: {
      studentId_programType_date: {
        studentId: student.id,
        programType: ProgramType.ACADEMIC,
        date,
      },
    },
    create: {
      studentId: student.id,
      teacherId: student.teacherId,
      programType: ProgramType.ACADEMIC,
      date,
      status: status as MeetingAttendanceStatus,
      note,
    },
    update: {
      teacherId: student.teacherId,
      status: status as MeetingAttendanceStatus,
      note,
    },
  });

  revalidatePath(`/students/${student.id}`);
  invalidateStudentRelatedCaches(student.id);
  const params = new URLSearchParams({
    programType: ProgramType.ACADEMIC,
    highlight: meeting.id,
    success: t("saved"),
  });
  redirect(`/students/${student.id}?${params.toString()}`);
}
