import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma-next/client";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function getOperationalCounts() {
  return {
    SummativeScore: await prisma.summativeScore.count(),
    Target: await prisma.target.count(),
    MemorizationRecord: await prisma.memorizationRecord.count(),
    RevisionRecord: await prisma.revisionRecord.count(),
    TasmiRecord: await prisma.tasmiRecord.count(),
    AuditLog: await prisma.auditLog.count(),
    Student: await prisma.student.count(),
    "ClassGroup (Halaqah)": await prisma.classGroup.count(),
  };
}

async function getPreservedCounts() {
  return {
    User: await prisma.user.count(),
    Teacher: await prisma.teacher.count(),
    AcademicYear: await prisma.academicYear.count(),
    AcademicClass: await prisma.academicClass.count(),
    Surah: await prisma.surah.count(),
    TargetSurah: await prisma.targetSurah.count(),
    Account: await prisma.account.count(),
    Session: await prisma.session.count(),
    VerificationToken: await prisma.verificationToken.count(),
  };
}

async function getMeetingSettings() {
  return prisma.academicYear.findMany({
    select: {
      id: true,
      year: true,
      formativeMeetingGanjil: true,
      formativeMeetingGenap: true,
    },
    orderBy: { id: "asc" },
  });
}

function printCounts(title: string, counts: Record<string, number>) {
  console.log(`\n${title}`);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(24)} ${count}`);
  }
}

async function main() {
  console.log("=".repeat(64));
  console.log("  PRODUCTION CLEANUP - delete student data and all halaqah");
  console.log("=".repeat(64));
  console.log("\nPreserving users, teachers, academic classes, and configuration.");
  console.log(
    "Quick Log and archive data are covered by their Student and record tables.",
  );

  const operationalBefore = await getOperationalCounts();
  const preservedBefore = await getPreservedCounts();
  const meetingSettingsBefore = await getMeetingSettings();

  printCounts("Operational data before cleanup:", operationalBefore);
  printCounts("Preserved data before cleanup:", preservedBefore);

  const deleted = await prisma.$transaction(
    async (tx) => {
      const result: Record<string, number> = {};

      // Child records are explicit so the cleanup report remains auditable.
      result.SummativeScore = (await tx.summativeScore.deleteMany()).count;
      result.Target = (await tx.target.deleteMany()).count;
      result.MemorizationRecord = (
        await tx.memorizationRecord.deleteMany()
      ).count;
      result.RevisionRecord = (await tx.revisionRecord.deleteMany()).count;
      result.TasmiRecord = (await tx.tasmiRecord.deleteMany()).count;

      // AuditLog has no dependent foreign keys and is safe to clear.
      result.AuditLog = (await tx.auditLog.deleteMany()).count;

      // Student must be removed before its required ClassGroup relation.
      result.Student = (await tx.student.deleteMany()).count;

      // ClassGroup is the Halaqah model and is safe after Student is empty.
      result["ClassGroup (Halaqah)"] = (
        await tx.classGroup.deleteMany()
      ).count;

      return result;
    },
    { maxWait: 30_000, timeout: 120_000 },
  );

  printCounts("Deleted:", deleted);

  const operationalAfter = await getOperationalCounts();
  const preservedAfter = await getPreservedCounts();
  const meetingSettingsAfter = await getMeetingSettings();

  printCounts("Operational data after cleanup:", operationalAfter);
  printCounts("Preserved data after cleanup:", preservedAfter);

  const operationalClean = Object.values(operationalAfter).every(
    (count) => count === 0,
  );
  const preservedUnchanged = Object.entries(preservedBefore).every(
    ([table, count]) => preservedAfter[table as keyof typeof preservedAfter] === count,
  );
  const meetingSettingsUnchanged =
    JSON.stringify(meetingSettingsAfter) === JSON.stringify(meetingSettingsBefore);

  console.log("\nVerification:");
  console.log(`  Operational tables empty    ${operationalClean ? "PASS" : "FAIL"}`);
  console.log(`  Master counts unchanged     ${preservedUnchanged ? "PASS" : "FAIL"}`);
  console.log(`  Meeting settings unchanged  ${meetingSettingsUnchanged ? "PASS" : "FAIL"}`);

  if (!operationalClean || !preservedUnchanged || !meetingSettingsUnchanged) {
    throw new Error("Production cleanup verification failed.");
  }

  console.log("\nProduction cleanup completed successfully.");
}

main()
  .catch((error) => {
    console.error("\nProduction cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
