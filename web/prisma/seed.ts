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
    { grade: 7, section: "C" },
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

  async function upsertClassGroup({
    teacherId,
    academicYear,
    grade,
    name,
    level,
    description,
    lookupNames,
  }: {
    teacherId: string;
    academicYear: string;
    grade: number;
    name: string;
    level: HalaqahLevel;
    description: string;
    lookupNames: string[];
  }) {
    const existingHalaqah = await prisma.classGroup.findFirst({
      where: {
        OR: [
          {
            teacherId,
            academicYear,
            grade,
          },
          {
            teacherId,
            OR: lookupNames.map((groupName) => ({ name: groupName })),
          },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return existingHalaqah
      ? prisma.classGroup.update({
          where: { id: existingHalaqah.id },
          data: {
            name,
            level,
            description,
            academicYear,
            grade,
            teacherId,
            isActive: true,
          },
        })
      : prisma.classGroup.create({
          data: {
            teacherId,
            academicYear,
            grade,
            name,
            level,
            description,
          },
        });
  }

  async function upsertStudent({
    teacherId,
    classGroupId,
    lookupNames,
    fullName,
    gender,
    academicClassName,
  }: {
    teacherId: string;
    classGroupId: string;
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
        teacherId,
        fullName: {
          in: lookupNames,
        },
      },
    });

    const data = {
      teacherId,
      classGroupId,
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

  const primaryClassGroup = await upsertClassGroup({
    teacherId: teacher.id,
    academicYear,
    grade: 9,
    name: "Ustadzah Nur Aisyah - Kelas 9",
    level: HalaqahLevel.MEDIUM,
    description: "Halaqah Kelas 9 bersama Ustadzah Nur Aisyah untuk santri dari beberapa rombel kelas 9.",
    lookupNames: ["Halaqoh Ust Azka", "Halaqah 9C", "Halaqah Pagi", "Ustadzah Nur Aisyah - Kelas 9"],
  });

  const secondPrimaryClassGroup = await upsertClassGroup({
    teacherId: teacher.id,
    academicYear,
    grade: 8,
    name: "Ustadzah Nur Aisyah - Kelas 8",
    level: HalaqahLevel.HIGH,
    description: "Halaqah Kelas 8 bersama Ustadzah Nur Aisyah untuk santri dari beberapa rombel kelas 8.",
    lookupNames: ["Halaqah 8A", "Ustadzah Nur Aisyah - Kelas 8"],
  });

  const thirdPrimaryClassGroup = await upsertClassGroup({
    teacherId: teacher.id,
    academicYear,
    grade: 7,
    name: "Ustadzah Nur Aisyah - Kelas 7",
    level: HalaqahLevel.HIGH,
    description: "Halaqah Kelas 7 bersama Ustadzah Nur Aisyah untuk santri dari beberapa rombel kelas 7.",
    lookupNames: ["Halaqah 7B", "Ustadzah Nur Aisyah - Kelas 7"],
  });

  const secondUser = await prisma.user.upsert({
    where: { email: "teacher.salwa@tahfidzflow.local" },
    update: {
      name: "Ustadzah Salwa Rahmah",
      role: UserRole.TEACHER,
      locale: "id",
      isActive: true,
      passwordHash,
    },
    create: {
      name: "Ustadzah Salwa Rahmah",
      email: "teacher.salwa@tahfidzflow.local",
      role: UserRole.TEACHER,
      locale: "id",
      passwordHash,
    },
  });

  const secondTeacher = await prisma.teacher.upsert({
    where: { userId: secondUser.id },
    update: {
      fullName: "Ustadzah Salwa Rahmah",
      phoneNumber: "080000000001",
      isActive: true,
    },
    create: {
      userId: secondUser.id,
      fullName: "Ustadzah Salwa Rahmah",
      phoneNumber: "080000000001",
    },
  });

  const secondClassGroup = await upsertClassGroup({
    teacherId: secondTeacher.id,
    academicYear,
    grade: 8,
    name: "Ustadzah Salwa Rahmah - Kelas 8",
    level: HalaqahLevel.MEDIUM,
    description: "Halaqah Kelas 8 bersama Ustadzah Salwa Rahmah untuk santri dari beberapa rombel kelas 8.",
    lookupNames: [
      "Halaqah Ustadzah Salwa",
      "Halaqah Salwa",
      "Halaqah Sore",
      "Ustadzah Salwa Rahmah - Kelas 8",
    ],
  });

  const thirdClassGroup = await upsertClassGroup({
    teacherId: secondTeacher.id,
    academicYear,
    grade: 7,
    name: "Ustadzah Salwa Rahmah - Kelas 7",
    level: HalaqahLevel.LOW,
    description: "Halaqah Kelas 7 bersama Ustadzah Salwa Rahmah untuk santri dari beberapa rombel kelas 7.",
    lookupNames: ["Halaqah 7A", "Ustadzah Salwa Rahmah - Kelas 7"],
  });

  await upsertClassGroup({
    teacherId: secondTeacher.id,
    academicYear,
    grade: 9,
    name: "Ustadzah Salwa Rahmah - Kelas 9",
    level: HalaqahLevel.HIGH,
    description: "Halaqah Kelas 9 bersama Ustadzah Salwa Rahmah untuk santri dari beberapa rombel kelas 9.",
    lookupNames: ["Ustadzah Salwa Rahmah - Kelas 9"],
  });

  const [afdal, nasuha, jureid, naila, maryam] = await Promise.all([
    upsertStudent({
      teacherId: teacher.id,
      classGroupId: primaryClassGroup.id,
      lookupNames: ["Ahmad F.", "Afdal Fauzan Nurrohman"],
      fullName: "Afdal Fauzan Nurrohman",
      gender: Gender.MALE,
      academicClassName: "9C",
    }),
    upsertStudent({
      teacherId: teacher.id,
      classGroupId: secondPrimaryClassGroup.id,
      lookupNames: ["Zahra A.", "Muhammad Nasuha"],
      fullName: "Muhammad Nasuha",
      gender: Gender.MALE,
      academicClassName: "8A",
    }),
    upsertStudent({
      teacherId: teacher.id,
      classGroupId: thirdPrimaryClassGroup.id,
      lookupNames: ["Bilal R.", "Jureid Sholahuddin"],
      fullName: "Jureid Sholahuddin",
      gender: Gender.MALE,
      academicClassName: "7B",
    }),
    upsertStudent({
      teacherId: secondTeacher.id,
      classGroupId: secondClassGroup.id,
      lookupNames: ["Naila Z.", "Naila Azzahra Putri"],
      fullName: "Naila Azzahra Putri",
      gender: Gender.FEMALE,
      academicClassName: "8B",
    }),
    upsertStudent({
      teacherId: secondTeacher.id,
      classGroupId: thirdClassGroup.id,
      lookupNames: ["Maryam S.", "Maryam Safitri"],
      fullName: "Maryam Safitri",
      gender: Gender.FEMALE,
      academicClassName: "7A",
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
    ensureMemorizationRecord({
      studentId: naila.id,
      teacherId: secondTeacher.id,
      surah: "Ar-Rahman",
      fromAyah: 1,
      toAyah: 13,
      date: atTime(0, 9, 20),
      status: RecordStatus.LANCAR,
      score: 95,
      notes: "Setoran baru sangat rapi dan stabil.",
    }),
    ensureRevisionRecord({
      studentId: maryam.id,
      teacherId: secondTeacher.id,
      surah: "Al-Waqi'ah",
      fromAyah: 1,
      toAyah: 20,
      date: atTime(-1, 10, 5),
      status: RecordStatus.CUKUP,
      score: 84,
      notes: "Perlu penguatan transisi antar ayat.",
    }),
    ensureTarget({
      studentId: naila.id,
      teacherId: secondTeacher.id,
      type: TargetType.HAFALAN,
      surah: "Ar-Rahman",
      fromAyah: 1,
      toAyah: 24,
      startDate: atTime(-2, 0, 0),
      endDate: atTime(6, 23, 59),
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
