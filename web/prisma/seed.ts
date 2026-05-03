import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma-next/client";
import {
  Gender,
  HalaqahLevel,
  RecordStatus,
  TargetStatus,
  TargetType,
  UserRole,
} from "../src/generated/prisma-next/enums";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

function atTime(daysOffset: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const academicYear = "2025/2026";
  const academicClassSeeds = [
    { grade: 7, section: "A" },
    { grade: 7, section: "B" },
    { grade: 8, section: "A" },
    { grade: 8, section: "B" },
    { grade: 9, section: "A" },
    { grade: 9, section: "B" },
    { grade: 9, section: "C" },
  ];

  const passwordHash = await bcrypt.hash("2026", 10);

  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@tahfidzflow.local" },
    update: {
      name: "Admin",
      role: UserRole.ADMIN,
      locale: "id",
      isActive: true,
      passwordHash,
    },
    create: {
      name: "Admin",
      email: "admin@tahfidzflow.local",
      role: UserRole.ADMIN,
      locale: "id",
      passwordHash,
    },
  });

  // Create teacher user
  const user = await prisma.user.upsert({
    where: { email: "teacher.demo@tahfidzflow.local" },
    update: {
      name: "Ustadzah Nur Aisyah",
      role: UserRole.TEACHER,
      locale: "id",
      isActive: true,
      passwordHash,
    },
    create: {
      name: "Ustadzah Nur Aisyah",
      email: "teacher.demo@tahfidzflow.local",
      role: UserRole.TEACHER,
      locale: "id",
      passwordHash,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: user.id },
    update: {
      fullName: "Ustadzah Nur Aisyah",
      phoneNumber: "080000000000",
      isActive: true,
    },
    create: {
      userId: user.id,
      fullName: "Ustadzah Nur Aisyah",
      phoneNumber: "080000000000",
    },
  });

  const academicClasses = await Promise.all(
    academicClassSeeds.map((academicClass) => {
      const name = `${academicClass.grade}${academicClass.section}`;

      return prisma.academicClass.upsert({
        where: {
          name_academicYear: {
            name,
            academicYear,
          },
        },
        update: {
          grade: academicClass.grade,
          section: academicClass.section,
          isActive: true,
        },
        create: {
          ...academicClass,
          name,
          academicYear,
        },
      });
    }),
  );
  const academicClassByName = new Map(
    academicClasses.map((academicClass) => [academicClass.name, academicClass]),
  );

  const existingHalaqah = await prisma.classGroup.findFirst({
    where: {
      teacherId: teacher.id,
      OR: [
        { name: "Halaqoh Ust Azka" },
        { name: "Halaqah 8" },
        { name: "Halaqah Pagi" },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  const classGroup = existingHalaqah
    ? await prisma.classGroup.update({
        where: { id: existingHalaqah.id },
        data: {
          name: "Halaqoh Ust Azka",
          level: HalaqahLevel.LOW,
          description: "Kelompok tahfidz simulasi Ust Azka dengan level low.",
          isActive: true,
        },
      })
    : await prisma.classGroup.create({
        data: {
          teacherId: teacher.id,
          name: "Halaqoh Ust Azka",
          level: HalaqahLevel.LOW,
          description: "Kelompok tahfidz simulasi Ust Azka dengan level low.",
        },
      });

  async function upsertStudent({
    lookupNames,
    fullName,
    gender,
    academicClassName,
  }: {
    lookupNames: string[];
    fullName: string;
    gender: Gender;
    academicClassName: string;
  }) {
    const academicClass = academicClassByName.get(academicClassName);

    if (!academicClass) {
      throw new Error(`Missing academic class seed: ${academicClassName}`);
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        teacherId: teacher.id,
        fullName: {
          in: lookupNames,
        },
      },
    });

    const data = {
      teacherId: teacher.id,
      classGroupId: classGroup.id,
      academicClassId: academicClass.id,
      fullName,
      gender,
      isActive: true,
    };

    return existingStudent
      ? prisma.student.update({
          where: { id: existingStudent.id },
          data,
        })
      : prisma.student.create({ data });
  }

  const [afdal, nasuha, jureid] = await Promise.all([
    upsertStudent({
      lookupNames: ["Ahmad F.", "Afdal Fauzan Nurrohman"],
      fullName: "Afdal Fauzan Nurrohman",
      gender: Gender.MALE,
      academicClassName: "9C",
    }),
    upsertStudent({
      lookupNames: ["Zahra A.", "Muhammad Nasuha"],
      fullName: "Muhammad Nasuha",
      gender: Gender.MALE,
      academicClassName: "8A",
    }),
    upsertStudent({
      lookupNames: ["Bilal R.", "Jureid Sholahuddin"],
      fullName: "Jureid Sholahuddin",
      gender: Gender.MALE,
      academicClassName: "7B",
    }),
  ]);

  async function ensureMemorizationRecord(data: {
    studentId: string;
    teacherId: string;
    surah: string;
    fromAyah: number;
    toAyah: number;
    date: Date;
    status: RecordStatus;
    score: number;
    notes: string;
  }) {
    const existingRecord = await prisma.memorizationRecord.findFirst({
      where: {
        studentId: data.studentId,
        surah: data.surah,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
      },
    });

    if (!existingRecord) {
      await prisma.memorizationRecord.create({ data });
    }
  }

  async function ensureRevisionRecord(data: {
    studentId: string;
    teacherId: string;
    surah: string;
    fromAyah: number;
    toAyah: number;
    date: Date;
    status: RecordStatus;
    score: number;
    notes: string;
  }) {
    const existingRecord = await prisma.revisionRecord.findFirst({
      where: {
        studentId: data.studentId,
        surah: data.surah,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
      },
    });

    if (!existingRecord) {
      await prisma.revisionRecord.create({ data });
    }
  }

  async function ensureTarget(data: {
    studentId: string;
    teacherId: string;
    type: TargetType;
    surah: string;
    fromAyah: number;
    toAyah: number;
    startDate: Date;
    endDate: Date;
    status: TargetStatus;
  }) {
    const existingTarget = await prisma.target.findFirst({
      where: {
        studentId: data.studentId,
        type: data.type,
        surah: data.surah,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
      },
    });

    if (!existingTarget) {
      await prisma.target.create({ data });
    }
  }

  await Promise.all([
    ensureMemorizationRecord({
      studentId: afdal.id,
      teacherId: teacher.id,
      surah: "Al-Mulk",
      fromAyah: 1,
      toAyah: 10,
      date: atTime(0, 7, 45),
      status: RecordStatus.LANCAR,
      score: 92,
      notes: "Lancar dan siap lanjut ayat berikutnya.",
    }),
    ensureRevisionRecord({
      studentId: nasuha.id,
      teacherId: teacher.id,
      surah: "An-Naba",
      fromAyah: 1,
      toAyah: 20,
      date: atTime(0, 8, 10),
      status: RecordStatus.CUKUP,
      score: 82,
      notes: "Masih perlu penguatan pada beberapa ayat.",
    }),
    ensureMemorizationRecord({
      studentId: jureid.id,
      teacherId: teacher.id,
      surah: "Al-Qalam",
      fromAyah: 5,
      toAyah: 12,
      date: atTime(-1, 8, 35),
      status: RecordStatus.PERLU_MUROJAAH,
      score: 68,
      notes: "Perlu murojaah sebelum menambah hafalan baru.",
    }),
    ensureTarget({
      studentId: afdal.id,
      teacherId: teacher.id,
      type: TargetType.HAFALAN,
      surah: "Al-Mulk",
      fromAyah: 1,
      toAyah: 20,
      startDate: atTime(-1, 0, 0),
      endDate: atTime(5, 23, 59),
      status: TargetStatus.ACTIVE,
    }),
    ensureTarget({
      studentId: nasuha.id,
      teacherId: teacher.id,
      type: TargetType.MUROJAAH,
      surah: "An-Naba",
      fromAyah: 1,
      toAyah: 40,
      startDate: atTime(-1, 0, 0),
      endDate: atTime(5, 23, 59),
      status: TargetStatus.ACTIVE,
    }),
  ]);

  console.log("Seed data is up to date.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
