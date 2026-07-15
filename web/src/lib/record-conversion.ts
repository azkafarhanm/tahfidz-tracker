import { AuditAction, RecordStatus } from "@/generated/prisma-next/enums";
import type { Prisma } from "@/generated/prisma-next/client";

export type RecordType = "hafalan" | "murojaah";

type EditableRecordData = {
  surah: string;
  fromAyah: number;
  toAyah: number;
  date: Date;
  status: RecordStatus;
  score: number | null;
  notes: string | null;
};

type ResponsibleUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export class RecordConversionSourceNotFoundError extends Error {
  constructor() {
    super("Record conversion source not found");
    this.name = "RecordConversionSourceNotFoundError";
  }
}

const recordTypeLabels: Record<RecordType, string> = {
  hafalan: "Hafalan",
  murojaah: "Murojaah",
};

export async function convertRecordType(
  tx: Prisma.TransactionClient,
  input: {
    studentId: string;
    sourceType: RecordType;
    sourceRecordId: string;
    data: EditableRecordData;
    responsibleUser: ResponsibleUser;
  },
) {
  const source = input.sourceType === "hafalan"
    ? await tx.memorizationRecord.findFirst({
        where: { id: input.sourceRecordId, studentId: input.studentId },
      })
    : await tx.revisionRecord.findFirst({
        where: { id: input.sourceRecordId, studentId: input.studentId },
      });

  if (!source) throw new RecordConversionSourceNotFoundError();

  const destinationType: RecordType = input.sourceType === "hafalan" ? "murojaah" : "hafalan";
  const destinationData = {
    studentId: source.studentId,
    teacherId: source.teacherId,
    academicYear: source.academicYear,
    semester: source.semester,
    ...input.data,
  };
  const destination = destinationType === "murojaah"
    ? await tx.revisionRecord.create({ data: destinationData })
    : await tx.memorizationRecord.create({ data: destinationData });

  const description = `Converted ${recordTypeLabels[input.sourceType]} → ${recordTypeLabels[destinationType]}`;
  await tx.auditLog.create({
    data: {
      userId: input.responsibleUser.id,
      action: AuditAction.CONVERT_RECORD_TYPE,
      academicYear: source.academicYear,
      targetType: "record_type_conversion",
      targetId: destination.id,
      targetName: description,
      metadata: {
        description,
        studentId: source.studentId,
        sourceType: input.sourceType,
        destinationType,
        sourceRecordId: source.id,
        destinationRecordId: destination.id,
        responsibleUserId: input.responsibleUser.id,
        responsibleUserName: input.responsibleUser.name ?? null,
        responsibleUserEmail: input.responsibleUser.email ?? null,
      },
    },
  });

  const deleted = input.sourceType === "hafalan"
    ? await tx.memorizationRecord.deleteMany({
        where: { id: source.id, studentId: source.studentId },
      })
    : await tx.revisionRecord.deleteMany({
        where: { id: source.id, studentId: source.studentId },
      });

  if (deleted.count !== 1) throw new RecordConversionSourceNotFoundError();

  return { destinationRecordId: destination.id, destinationType };
}
