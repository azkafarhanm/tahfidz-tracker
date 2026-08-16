"use server";

import { revalidatePath } from "next/cache";
import { AuditAction } from "@/generated/prisma-next/enums";
import { readInt, readOptionalString } from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { advanceTahsinMeeting, createTahsinRecord, getTahsinSmartDefaultForStudent, resetTahsinMeetingTimeline } from "@/lib/tahsin";

export type TahsinActionResult =
  | { ok: true; recordId: string; success: string }
  | { ok: false; error: string };

function actorFromScope(scope: Awaited<ReturnType<typeof requireSessionScope>>) {
  return { isAdmin: scope.isAdmin, teacherId: scope.teacherId };
}

export async function createTahsinAction(formData: FormData): Promise<TahsinActionResult> {
  const scope = await requireSessionScope();
  try {
    const notes = readOptionalString(formData, "notes");
    if (notes && notes.length > 1500) return { ok: false, error: "Catatan maksimal 1500 karakter." };
    const record = await prisma.$transaction(async (tx) => {
      const created = await createTahsinRecord(actorFromScope(scope), {
        studentId: String(formData.get("studentId") ?? ""),
        jilid: readInt(formData, "jilid") ?? 0,
        startPage: readInt(formData, "startPage") ?? 0,
        endPage: readInt(formData, "endPage"),
        score: readInt(formData, "score"),
        notes,
        date: new Date(),
      }, tx);
      await tx.auditLog.create({
        data: {
          userId: scope.session.user.id,
          action: AuditAction.CREATE_TAHSIN,
          academicYear: created.academicYear,
          targetType: "tahsin",
          targetId: created.id,
          metadata: { studentId: created.studentId, meetingId: created.meetingId, jilid: created.jilid, startPage: created.startPage, endPage: created.endPage, score: created.score },
        },
      });
      return created;
    });
    revalidatePath("/tahsin");
    return { ok: true, recordId: record.id, success: "Penilaian Tahsin tersimpan." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal menyimpan Tahsin." };
  }
}

export async function getTahsinSmartDefaultAction(studentId: string) {
  const scope = await requireSessionScope();
  const record = await getTahsinSmartDefaultForStudent(actorFromScope(scope), studentId);
  return record
    ? { jilid: record.jilid, startPage: record.startPage, endPage: record.endPage }
    : { jilid: 1, startPage: null, endPage: null };
}

function readMeetingDate(formData: FormData) {
  const raw = String(formData.get("meetingDate") ?? "");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime())) {
    throw new Error("Tanggal Pertemuan Tahsin tidak valid.");
  }
  return date;
}

export async function advanceTahsinMeetingAction(formData: FormData) {
  const scope = await requireSessionScope();
  if (!scope.isAdmin) return { ok: false, error: "Hanya admin yang dapat melanjutkan Pertemuan Tahsin." };
  try {
    const meeting = await prisma.$transaction(async (tx) => {
      const created = await advanceTahsinMeeting(actorFromScope(scope), readMeetingDate(formData), tx);
      await tx.auditLog.create({ data: { userId: scope.session.user.id, action: AuditAction.ADVANCE_TAHSIN_MEETING, targetType: "tahsin_meeting", targetId: created.id, metadata: { meetingNumber: created.meetingNumber } } });
      return created;
    });
    revalidatePath("/tahsin");
    return { ok: true, meetingId: meeting.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal melanjutkan Pertemuan Tahsin." };
  }
}

export async function resetTahsinMeetingTimelineAction(formData: FormData) {
  const scope = await requireSessionScope();
  if (!scope.isAdmin) return { ok: false, error: "Hanya admin yang dapat mereset timeline Tahsin." };
  try {
    const meeting = await prisma.$transaction(async (tx) => {
      const created = await resetTahsinMeetingTimeline(actorFromScope(scope), readMeetingDate(formData), tx);
      await tx.auditLog.create({ data: { userId: scope.session.user.id, action: AuditAction.RESET_TAHSIN_MEETING_TIMELINE, targetType: "tahsin_meeting_timeline", targetId: created.id, metadata: { meetingNumber: created.meetingNumber } } });
      return created;
    });
    revalidatePath("/tahsin");
    return { ok: true, meetingId: meeting.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal mereset timeline Tahsin." };
  }
}
