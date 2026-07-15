import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma-next/client";
import { RecordStatus, Semester } from "@/generated/prisma-next/enums";
import {
  convertRecordType,
  RecordConversionSourceNotFoundError,
} from "./record-conversion";

const sourceRecord = {
  id: "source-1",
  studentId: "student-1",
  teacherId: "teacher-1",
  surah: "Al-Fatihah",
  fromAyah: 1,
  toAyah: 7,
  date: new Date("2026-07-15T10:00:00.000Z"),
  status: RecordStatus.CUKUP,
  score: 83,
  notes: "original",
  academicYear: "2026/2027",
  semester: Semester.GANJIL,
  createdAt: new Date("2026-07-15T10:00:00.000Z"),
  updatedAt: new Date("2026-07-15T10:00:00.000Z"),
};

const editedData = {
  surah: "Al-Baqarah",
  fromAyah: 1,
  toAyah: 5,
  date: new Date("2026-07-16T10:00:00.000Z"),
  status: RecordStatus.LANCAR,
  score: 90,
  notes: "preserved edit",
};

function createTransactionMock() {
  return {
    memorizationRecord: {
      findFirst: vi.fn().mockResolvedValue(sourceRecord),
      create: vi.fn().mockResolvedValue({ ...sourceRecord, ...editedData, id: "destination-1" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    revisionRecord: {
      findFirst: vi.fn().mockResolvedValue(sourceRecord),
      create: vi.fn().mockResolvedValue({ ...sourceRecord, ...editedData, id: "destination-1" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" }),
    },
  };
}

const responsibleUser = {
  id: "user-1",
  name: "Ustadz Test",
  email: "ustadz@example.com",
};

describe("convertRecordType", () => {
  it("converts Hafalan to Murojaah while preserving immutable metadata and edited fields", async () => {
    const tx = createTransactionMock();

    const result = await convertRecordType(tx as unknown as Prisma.TransactionClient, {
      studentId: sourceRecord.studentId,
      sourceType: "hafalan",
      sourceRecordId: sourceRecord.id,
      data: editedData,
      responsibleUser,
    });

    expect(tx.revisionRecord.create).toHaveBeenCalledWith({
      data: {
        studentId: sourceRecord.studentId,
        teacherId: sourceRecord.teacherId,
        academicYear: sourceRecord.academicYear,
        semester: sourceRecord.semester,
        ...editedData,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: responsibleUser.id,
        targetId: "destination-1",
        targetName: "Converted Hafalan → Murojaah",
        metadata: expect.objectContaining({
          sourceType: "hafalan",
          destinationType: "murojaah",
          sourceRecordId: sourceRecord.id,
          destinationRecordId: "destination-1",
          responsibleUserId: responsibleUser.id,
        }),
      }),
    });
    expect(tx.memorizationRecord.deleteMany).toHaveBeenCalledWith({
      where: { id: sourceRecord.id, studentId: sourceRecord.studentId },
    });
    expect(result).toEqual({
      destinationRecordId: "destination-1",
      destinationType: "murojaah",
    });
  });

  it("converts Murojaah to Hafalan", async () => {
    const tx = createTransactionMock();

    const result = await convertRecordType(tx as unknown as Prisma.TransactionClient, {
      studentId: sourceRecord.studentId,
      sourceType: "murojaah",
      sourceRecordId: sourceRecord.id,
      data: editedData,
      responsibleUser,
    });

    expect(tx.memorizationRecord.create).toHaveBeenCalledOnce();
    expect(tx.revisionRecord.deleteMany).toHaveBeenCalledOnce();
    expect(result.destinationType).toBe("hafalan");
  });

  it("stops before deleting the source when audit creation fails", async () => {
    const tx = createTransactionMock();
    tx.auditLog.create.mockRejectedValueOnce(new Error("audit failed"));

    await expect(convertRecordType(tx as unknown as Prisma.TransactionClient, {
      studentId: sourceRecord.studentId,
      sourceType: "hafalan",
      sourceRecordId: sourceRecord.id,
      data: editedData,
      responsibleUser,
    })).rejects.toThrow("audit failed");
    expect(tx.memorizationRecord.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects the transaction when the source delete does not affect one row", async () => {
    const tx = createTransactionMock();
    tx.memorizationRecord.deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(convertRecordType(tx as unknown as Prisma.TransactionClient, {
      studentId: sourceRecord.studentId,
      sourceType: "hafalan",
      sourceRecordId: sourceRecord.id,
      data: editedData,
      responsibleUser,
    })).rejects.toBeInstanceOf(RecordConversionSourceNotFoundError);
  });
});
