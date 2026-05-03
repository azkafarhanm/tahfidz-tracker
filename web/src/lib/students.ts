import {
  Gender,
  RecordStatus,
  TargetStatus,
  TargetType,
} from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import {
  dateFormatter,
  statusLabels,
  halaqahLevelLabels,
  formatRange,
  formatClassSummary,
} from "@/lib/format";

function formatLatestRecord(
  record:
    | {
        surah: string;
        fromAyah: number;
        toAyah: number;
        date: Date;
        status: RecordStatus;
      }
    | undefined,
) {
  if (!record) {
    return null;
  }

  return {
    range: formatRange(record.surah, record.fromAyah, record.toAyah),
    date: dateFormatter.format(record.date),
    status: statusLabels[record.status],
    needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
  };
}

function formatRecord(
  record: {
    id: string;
    surah: string;
    fromAyah: number;
    toAyah: number;
    date: Date;
    status: RecordStatus;
    score: number | null;
    notes: string | null;
  },
  type: "Hafalan" | "Murojaah",
) {
  return {
    id: record.id,
    type,
    range: formatRange(record.surah, record.fromAyah, record.toAyah),
    date: dateFormatter.format(record.date),
    status: statusLabels[record.status],
    score: record.score,
    notes: record.notes,
    needsReview: record.status === RecordStatus.PERLU_MUROJAAH,
    timestamp: record.date.getTime(),
  };
}

function formatTarget(target: {
  id: string;
  type: TargetType;
  surah: string;
  fromAyah: number;
  toAyah: number;
  startDate: Date;
  endDate: Date;
  notes: string | null;
}) {
  return {
    id: target.id,
    type: targetTypeLabels[target.type],
    range: formatRange(target.surah, target.fromAyah, target.toAyah),
    startDate: dateFormatter.format(target.startDate),
    endDate: dateFormatter.format(target.endDate),
    notes: target.notes,
  };
}

const targetTypeLabels: Record<TargetType, string> = {
  [TargetType.HAFALAN]: "Hafalan",
  [TargetType.MUROJAAH]: "Murojaah",
};

const genderLabels: Record<Gender, string> = {
  [Gender.MALE]: "Laki-laki",
  [Gender.FEMALE]: "Perempuan",
};

export async function getStudentsData(query = "", teacherId?: string | null) {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      classGroup: {
        select: { name: true, level: true },
      },
      academicClass: {
        select: { name: true },
      },
      memorizationRecords: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
        },
      },
      revisionRecords: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
        },
      },
      targets: {
        where: { status: TargetStatus.ACTIVE },
        select: { id: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStudents = normalizedQuery
    ? students.filter((student) =>
        [
          student.fullName,
          student.academicClass?.name,
          student.classGroup.name,
          halaqahLevelLabels[student.classGroup.level],
          student.notes,
          student.memorizationRecords[0]?.surah,
          student.revisionRecords[0]?.surah,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : students;

  return filteredStudents.map((student) => {
    const latestHafalan = formatLatestRecord(student.memorizationRecords[0]);
    const latestMurojaah = formatLatestRecord(student.revisionRecords[0]);
    const needsReview = Boolean(
      latestHafalan?.needsReview || latestMurojaah?.needsReview,
    );
    const classInfo = formatClassSummary(student);

    return {
      id: student.id,
      fullName: student.fullName,
      ...classInfo,
      notes: student.notes,
      activeTargetCount: student.targets.length,
      latestHafalan,
      latestMurojaah,
      needsReview,
    };
  });
}

export async function getStudentDetailData(studentId: string, teacherId?: string | null) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    include: {
      classGroup: {
        select: { name: true, level: true },
      },
      academicClass: {
        select: { name: true },
      },
      memorizationRecords: {
        orderBy: { date: "desc" },
        take: 8,
        select: {
          id: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
          score: true,
          notes: true,
        },
      },
      revisionRecords: {
        orderBy: { date: "desc" },
        take: 8,
        select: {
          id: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          date: true,
          status: true,
          score: true,
          notes: true,
        },
      },
      targets: {
        where: { status: TargetStatus.ACTIVE },
        orderBy: { endDate: "asc" },
        select: {
          id: true,
          type: true,
          surah: true,
          fromAyah: true,
          toAyah: true,
          startDate: true,
          endDate: true,
          notes: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const hafalanRecords = student.memorizationRecords.map((record) =>
    formatRecord(record, "Hafalan"),
  );
  const murojaahRecords = student.revisionRecords.map((record) =>
    formatRecord(record, "Murojaah"),
  );
  const recentActivity = [...hafalanRecords, ...murojaahRecords]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);
  const needsReviewCount = recentActivity.filter(
    (record) => record.needsReview,
  ).length;
  const classInfo = formatClassSummary(student);

  return {
    id: student.id,
    fullName: student.fullName,
    ...classInfo,
    gender: student.gender ? genderLabels[student.gender] : "Belum diisi",
    joinDate: dateFormatter.format(student.joinDate),
    notes: student.notes,
    activeTargets: student.targets.map(formatTarget),
    latestHafalan: hafalanRecords[0] ?? null,
    latestMurojaah: murojaahRecords[0] ?? null,
    hafalanRecords,
    murojaahRecords,
    recentActivity,
    needsReviewCount,
  };
}

export async function getStudentFormContext(studentId: string, teacherId?: string | null) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(teacherId ? { teacherId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      classGroup: {
        select: { name: true, level: true },
      },
      academicClass: {
        select: { name: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  return {
    id: student.id,
    fullName: student.fullName,
    ...formatClassSummary(student),
  };
}
