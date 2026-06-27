import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma-next/client";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function main() {
  console.log("=".repeat(60));
  console.log("  UAT DATA RESET — removes all operational and demo data");
  console.log("=".repeat(60));

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("\nAdmin accounts to preserve:\n");
  for (const a of admins) {
    console.log(`    ${a.email.padEnd(35)} ${a.name}`);
  }

  if (admins.length === 0) {
    console.error("\nNo admin account found — aborting to prevent lockout.");
    process.exit(1);
  }

  console.log("\n" + "-".repeat(60));
  console.log("  BEFORE RESET");
  console.log("-".repeat(60) + "\n");

  const before = {
    MemorizationRecord: await prisma.memorizationRecord.count(),
    RevisionRecord: await prisma.revisionRecord.count(),
    Target: await prisma.target.count(),
    SummativeScore: await prisma.summativeScore.count(),
    TasmiRecord: await prisma.tasmiRecord.count(),
    AuditLog: await prisma.auditLog.count(),
    Student: await prisma.student.count(),
    ClassGroup: await prisma.classGroup.count(),
    AcademicClass: await prisma.academicClass.count(),
    AcademicYear: await prisma.academicYear.count(),
    Teacher: await prisma.teacher.count(),
    "User (non-admin)": await prisma.user.count({ where: { role: "TEACHER" } }),
  };

  console.log("  Operational + demo data:");
  for (const [table, count] of Object.entries(before)) {
    if (count > 0) console.log(`    ${table.padEnd(25)} ${count}`);
  }

  const surahBefore = await prisma.surah.count();
  const targetSurahBefore = await prisma.targetSurah.count();

  console.log("\n  Preserved (must survive):");
  console.log(`    ${"Surah".padEnd(25)} ${surahBefore}`);
  console.log(`    ${"TargetSurah".padEnd(25)} ${targetSurahBefore}`);

  const totalToDelete = Object.values(before).reduce((a, b) => a + b, 0);
  if (totalToDelete === 0) {
    console.log("\nAll operational data already empty — nothing to reset.");
    await prisma.$disconnect();
    return;
  }

  console.log("\n" + "-".repeat(60));
  console.log("  DELETING");
  console.log("-".repeat(60) + "\n");

  const deleted = await prisma.$transaction(
    async (tx) => {
      const r: Record<string, number> = {};

      r["MemorizationRecord"] = (
        await tx.memorizationRecord.deleteMany()
      ).count;
      r["RevisionRecord"] = (await tx.revisionRecord.deleteMany()).count;
      r["Target"] = (await tx.target.deleteMany()).count;
      r["SummativeScore"] = (await tx.summativeScore.deleteMany()).count;
      r["TasmiRecord"] = (await tx.tasmiRecord.deleteMany()).count;
      r["AuditLog"] = (await tx.auditLog.deleteMany()).count;

      r["Student"] = (await tx.student.deleteMany()).count;

      r["ClassGroup"] = (await tx.classGroup.deleteMany()).count;
      r["AcademicClass"] = (await tx.academicClass.deleteMany()).count;
      r["AcademicYear"] = (await tx.academicYear.deleteMany()).count;

      r["Session"] = (
        await tx.session.deleteMany({
          where: { user: { role: "TEACHER" } },
        })
      ).count;
      r["Account"] = (
        await tx.account.deleteMany({
          where: { user: { role: "TEACHER" } },
        })
      ).count;
      r["Teacher"] = (await tx.teacher.deleteMany()).count;
      r["User (non-admin)"] = (
        await tx.user.deleteMany({ where: { role: "TEACHER" } })
      ).count;

      return r;
    },
    { timeout: 60_000 },
  );

  for (const [table, count] of Object.entries(deleted)) {
    console.log(`    ${table.padEnd(25)} deleted ${count}`);
  }

  console.log("\n" + "-".repeat(60));
  console.log("  AFTER RESET");
  console.log("-".repeat(60) + "\n");

  const after = {
    MemorizationRecord: await prisma.memorizationRecord.count(),
    RevisionRecord: await prisma.revisionRecord.count(),
    Target: await prisma.target.count(),
    SummativeScore: await prisma.summativeScore.count(),
    TasmiRecord: await prisma.tasmiRecord.count(),
    AuditLog: await prisma.auditLog.count(),
    Student: await prisma.student.count(),
    ClassGroup: await prisma.classGroup.count(),
    AcademicClass: await prisma.academicClass.count(),
    AcademicYear: await prisma.academicYear.count(),
    Teacher: await prisma.teacher.count(),
    "User (non-admin)": await prisma.user.count({
      where: { role: "TEACHER" },
    }),
  };

  let allClean = true;

  console.log("  Operational + demo data:");
  for (const [table, count] of Object.entries(after)) {
    const ok = count === 0;
    if (!ok) allClean = false;
    console.log(`    ${ok ? "PASS" : "FAIL"} ${table.padEnd(21)} ${count}`);
  }

  const adminAfter = await prisma.user.count({ where: { role: "ADMIN" } });
  const surahAfter = await prisma.surah.count();
  const targetSurahAfter = await prisma.targetSurah.count();

  console.log("\n  Preserved data:");
  const adminOk = adminAfter === admins.length;
  const surahOk = surahAfter === surahBefore;
  const targetSurahOk = targetSurahAfter === targetSurahBefore;
  if (!adminOk || !surahOk || !targetSurahOk) allClean = false;
  console.log(
    `    ${adminOk ? "PASS" : "FAIL"} ${"User (admin)".padEnd(21)} ${adminAfter}  (was ${admins.length})`,
  );
  console.log(
    `    ${surahOk ? "PASS" : "FAIL"} ${"Surah".padEnd(21)} ${surahAfter}  (was ${surahBefore})`,
  );
  console.log(
    `    ${targetSurahOk ? "PASS" : "FAIL"} ${"TargetSurah".padEnd(21)} ${targetSurahAfter}  (was ${targetSurahBefore})`,
  );

  console.log("\n" + "=".repeat(60));
  if (allClean) {
    console.log("  RESET SUCCESSFUL — clean UAT state");
  } else {
    console.log("  RESET INCOMPLETE — check errors above");
  }
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("\nReset failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
