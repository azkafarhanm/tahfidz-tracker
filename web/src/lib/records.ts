import { prisma } from "@/lib/prisma";

export async function getRecordData(
  recordId: string,
  recordType: "hafalan" | "murojaah",
  teacherId?: string | null,
) {
  const include = {
    student: {
      select: {
        id: true,
        fullName: true,
        teacherId: true,
        isActive: true,
      },
    },
  };

  const record =
    recordType === "murojaah"
      ? await prisma.revisionRecord.findUnique({
          where: { id: recordId },
          include,
        })
      : await prisma.memorizationRecord.findUnique({
          where: { id: recordId },
          include,
        });

  if (!record || !record.student.isActive) return null;

  if (teacherId && record.student.teacherId !== teacherId) return null;

  return {
    id: record.id,
    studentId: record.student.id,
    studentName: record.student.fullName,
    surah: record.surah,
    fromAyah: record.fromAyah,
    toAyah: record.toAyah,
    date: record.date.toISOString().split("T")[0],
    time: `${String(record.date.getHours()).padStart(2, "0")}:${String(record.date.getMinutes()).padStart(2, "0")}`,
    status: record.status,
    score: record.score,
    notes: record.notes ?? "",
  };
}
