import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma-next/client";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function main() {
  console.log("Starting testing data reset...\n");

  // Step 1: Delete in foreign-key-safe order (no transaction — avoids Neon timeout)
  console.log("Deleting testing data...");

  let result = await prisma.summativeScore.deleteMany();
  console.log(`  SummativeScore:       ${result.count} deleted`);

  result = await prisma.target.deleteMany();
  console.log(`  Target:               ${result.count} deleted`);

  result = await prisma.memorizationRecord.deleteMany();
  console.log(`  MemorizationRecord:   ${result.count} deleted`);

  result = await prisma.revisionRecord.deleteMany();
  console.log(`  RevisionRecord:       ${result.count} deleted`);

  result = await prisma.student.deleteMany();
  console.log(`  Student:              ${result.count} deleted`);

  result = await prisma.classGroup.deleteMany();
  console.log(`  ClassGroup:           ${result.count} deleted`);

  result = await prisma.academicClass.deleteMany();
  console.log(`  AcademicClass:        ${result.count} deleted`);

  result = await prisma.targetSurah.deleteMany();
  console.log(`  TargetSurah:          ${result.count} deleted`);

  // Step 2: Delete Teachers (CASCADE will delete linked non-admin Users)
  console.log("\nDeleting teachers...");
  const teachers = await prisma.teacher.findMany({
    include: { user: { select: { role: true } } },
  });

  let teacherCount = 0;
  for (const teacher of teachers) {
    if (teacher.user.role === "TEACHER") {
      await prisma.teacher.delete({ where: { id: teacher.id } });
      teacherCount++;
    }
  }
  console.log(`  Teacher:              ${teacherCount} deleted`);

  // Step 3: Clean up orphaned non-admin Users
  console.log("\nCleaning orphaned users...");
  const orphaned = await prisma.user.deleteMany({
    where: {
      role: "TEACHER",
      teacher: null,
    },
  });
  console.log(`  Orphaned User:        ${orphaned.count} deleted`);

  // Step 4: Verify final state
  const [adminCount, yearCount, surahCount, remainingTeachers, remainingStudents] =
    await Promise.all([
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.academicYear.count(),
      prisma.surah.count(),
      prisma.teacher.count(),
      prisma.student.count(),
    ]);

  console.log("\n--- Verification ---");
  console.log(`Admin accounts:  ${adminCount}`);
  console.log(`Academic years:  ${yearCount}`);
  console.log(`Surahs:          ${surahCount}`);
  console.log(`Teachers:        ${remainingTeachers}`);
  console.log(`Students:        ${remainingStudents}`);
  console.log("\nReset complete.");
}

main()
  .catch((error) => {
    console.error("Reset failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
