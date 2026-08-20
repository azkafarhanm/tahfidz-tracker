"use server";

import { revalidatePath } from "next/cache";
import { AuditAction } from "@/generated/prisma-next/enums";
import { readInt, readOptionalString } from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { createTahsinRecord, deleteTahsinRecord, getTahsinSmartDefaultForStudent, resetTahsinMeetingTimeline, updateTahsinRecord } from "@/lib/tahsin";

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

function readTahsinUpdateInput(formData: FormData) {
  const notes = readOptionalString(formData, "notes");
  if (notes && notes.length > 1500) throw new Error("Catatan maksimal 1500 karakter.");
  return {
    jilid: readInt(formData, "jilid") ?? 0,
    startPage: readInt(formData, "startPage") ?? 0,
    endPage: readInt(formData, "endPage"),
    score: readInt(formData, "score"),
    notes,
  };
}

export async function updateTahsinAction(formData: FormData) {
  const scope = await requireSessionScope();
  try {
    const recordId = String(formData.get("recordId") ?? "").trim();
    if (!recordId) throw new Error("Penilaian Tahsin tidak ditemukan.");
    const record = await prisma.$transaction(async (tx) => {
      const updated = await updateTahsinRecord(actorFromScope(scope), recordId, readTahsinUpdateInput(formData), tx);
      await tx.auditLog.create({
        data: {
          userId: scope.session.user.id,
          action: AuditAction.UPDATE_TAHSIN,
          academicYear: updated.academicYear,
          targetType: "tahsin",
          targetId: updated.id,
          metadata: { studentId: updated.studentId, meetingId: updated.meetingId, jilid: updated.jilid, startPage: updated.startPage, endPage: updated.endPage, score: updated.score },
        },
      });
      return updated;
    });
    revalidatePath("/tahsin");
    return { ok: true as const, recordId: record.id, success: "Penilaian Tahsin diperbarui." };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Gagal memperbarui Tahsin." };
  }
}

export async function deleteTahsinAction(recordId: string) {
  const scope = await requireSessionScope();
  try {
    const normalizedRecordId = recordId.trim();
    if (!normalizedRecordId) throw new Error("Penilaian Tahsin tidak ditemukan.");
    const record = await prisma.$transaction(async (tx) => {
      const deleted = await deleteTahsinRecord(actorFromScope(scope), normalizedRecordId, tx);
      await tx.auditLog.create({
        data: {
          userId: scope.session.user.id,
          action: AuditAction.DELETE_TAHSIN,
          academicYear: deleted.academicYear,
          targetType: "tahsin",
          targetId: deleted.id,
          metadata: { studentId: deleted.studentId, meetingId: deleted.meetingId, jilid: deleted.jilid, startPage: deleted.startPage, endPage: deleted.endPage, score: deleted.score },
        },
      });
      return deleted;
    });
    revalidatePath("/tahsin");
    return { ok: true as const, recordId: record.id, success: "Penilaian Tahsin dihapus." };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Gagal menghapus Tahsin." };
  }
}

function readMeetingDate(formData: FormData) {
  const raw = String(formData.get("meetingDate") ?? "");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime())) {
    throw new Error("Tanggal Pertemuan Tahsin tidak valid.");
  }
  return date;
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
