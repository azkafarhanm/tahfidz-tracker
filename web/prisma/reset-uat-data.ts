import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const client = new Client({ connectionString });

const OPS_TABLES = [
  "MemorizationRecord",
  "RevisionRecord",
  "Target",
  "SummativeScore",
  "TasmiRecord",
  "AuditLog",
  "Student",
] as const;

const MASTER_TABLES = [
  "User",
  "Teacher",
  "AcademicYear",
  "AcademicClass",
  "ClassGroup",
  "Surah",
  "TargetSurah",
] as const;

async function countRow(table: string): Promise<number> {
  const res = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  return res.rows[0].count;
}

async function countAll(tables: readonly string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const table of tables) {
    result[table] = await countRow(table);
  }
  return result;
}

async function main() {
  await client.connect();

  console.log("=".repeat(60));
  console.log("  UAT DATA RESET — removes operational data only");
  console.log("=".repeat(60));

  // ── BEFORE ──────────────────────────────────────────────
  console.log("\n📋 BEFORE RESET\n");

  const opsBefore = await countAll(OPS_TABLES);
  const masterBefore = await countAll(MASTER_TABLES);

  console.log("  Operational data:");
  for (const [table, count] of Object.entries(opsBefore)) {
    if (count > 0) console.log(`    ${table.padEnd(25)} ${count}`);
  }

  console.log("\n  Master data (must survive):");
  for (const [table, count] of Object.entries(masterBefore)) {
    console.log(`    ${table.padEnd(25)} ${count}`);
  }

  const totalOps = Object.values(opsBefore).reduce((a, b) => a + b, 0);
  if (totalOps === 0) {
    console.log("\n✅ Operational data already empty — nothing to reset.");
    await client.end();
    return;
  }

  // ── DELETE (child → parent FK order) ────────────────────
  //
  // Deletion order respects FK dependencies:
  //   1. MemorizationRecord  (FK studentId → Student, onDelete: Cascade)
  //   2. RevisionRecord       (FK studentId → Student, onDelete: Cascade)
  //   3. Target               (FK studentId → Student, onDelete: Cascade)
  //   4. SummativeScore       (FK studentId → Student, onDelete: Cascade)
  //   5. TasmiRecord          (FK studentId → Student, onDelete: Cascade)
  //   6. AuditLog             (no FK to Student; standalone operational log)
  //   7. Student              (parent of 1–5)
  //
  // Tables NOT touched (master data):
  //   User, Teacher, AcademicYear, AcademicClass,
  //   ClassGroup, Surah, TargetSurah, Account, Session

  console.log("\n🗑️  DELETING OPERATIONAL DATA\n");

  // Wrap in transaction so we can roll back on error
  await client.query("BEGIN");

  try {
    for (const table of OPS_TABLES) {
      const res = await client.query(`DELETE FROM "${table}"`);
      console.log(`    ${table.padEnd(25)} deleted ${res.rowCount} rows`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  // ── AFTER ───────────────────────────────────────────────
  console.log("\n📋 AFTER RESET\n");

  const opsAfter = await countAll(OPS_TABLES);
  const masterAfter = await countAll(MASTER_TABLES);

  console.log("  Operational data:");
  for (const [table, count] of Object.entries(opsAfter)) {
    const status = count === 0 ? "✅" : "❌";
    console.log(`    ${status} ${table.padEnd(23)} ${count}`);
  }

  console.log("\n  Master data (must survive):");
  let masterOk = true;
  for (const [table, count] of Object.entries(masterAfter)) {
    const before = masterBefore[table];
    const unchanged = count === before;
    if (!unchanged) masterOk = false;
    const status = unchanged ? "✅" : "❌";
    console.log(`    ${status} ${table.padEnd(23)} ${count}  (was ${before})`);
  }

  // ── VERDICT ─────────────────────────────────────────────
  const allOpsZero = Object.values(opsAfter).every((v) => v === 0);

  console.log("\n" + "=".repeat(60));
  if (allOpsZero && masterOk) {
    console.log("  ✅ RESET SUCCESSFUL — ready for UAT");
  } else {
    console.log("  ❌ RESET INCOMPLETE — check errors above");
  }
  console.log("=".repeat(60));

  await client.end();
}

main().catch((e) => {
  console.error("\n❌ Reset failed:", e);
  client.end();
  process.exitCode = 1;
});
