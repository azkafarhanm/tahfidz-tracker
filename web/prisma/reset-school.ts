import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new Client({ connectionString });

// ── Deletion phases (child → parent, respecting onDelete: Restrict) ──
//
// Phase 1 — Operational records (FK → Student, Teacher)
//   MemorizationRecord   FK studentId→Student(Cascade), FK teacherId→Teacher(Restrict)
//   RevisionRecord       FK studentId→Student(Cascade), FK teacherId→Teacher(Restrict)
//   Target               FK studentId→Student(Cascade), FK teacherId→Teacher(Restrict)
//   SummativeScore       FK studentId→Student(Cascade), FK surahId→Surah(Restrict)
//   TasmiRecord          FK studentId→Student(Cascade), FK teacherId→Teacher(Restrict)
//   AuditLog             FK userId→User(SetNull)
//
// Phase 2 — Student (FK teacherId→Teacher(Restrict),
//                     FK classGroupId→ClassGroup(Restrict),
//                     FK academicClassId→AcademicClass(Restrict))
//
// Phase 3 — ClassGroup (FK teacherId→Teacher(Restrict))
//
// Phase 4 — AcademicClass (no FK to other deletable tables)
//
// Phase 5 — AcademicYear (no FK to other deletable tables)
//
// Phase 6 — Non-admin User (cascades Teacher, Account, Session)
//   Teacher              FK userId→User(Cascade)
//   Account              FK userId→User(Cascade)
//   Session              FK userId→User(Cascade)
//
// Tables PRESERVED:
//   User WHERE role='ADMIN'
//   Surah, TargetSurah  (master data)
//   VerificationToken   (auth tokens)

const ALL_TABLES = [
  "MemorizationRecord",
  "RevisionRecord",
  "Target",
  "SummativeScore",
  "TasmiRecord",
  "AuditLog",
  "Student",
  "ClassGroup",
  "AcademicClass",
  "AcademicYear",
  "Teacher",
  "Account",
  "Session",
  "User",
] as const;

const PRESERVED_TABLES = [
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

async function deleteTable(table: string, where?: string): Promise<number> {
  const sql = where ? `DELETE FROM "${table}" WHERE ${where}` : `DELETE FROM "${table}"`;
  const res = await client.query(sql);
  return res.rowCount ?? 0;
}

async function main() {
  await client.connect();

  console.log("=".repeat(60));
  console.log("  FULL SCHOOL RESET — simulate brand new installation");
  console.log("=".repeat(60));

  // ── Identify admin accounts to preserve ─────────────────
  const adminResult = await client.query(
    `SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt" ASC`,
  );

  console.log("\n🔑 Admin accounts to preserve:\n");
  for (const row of adminResult.rows) {
    console.log(`    ${row.email.padEnd(35)} ${row.name}`);
  }

  if (adminResult.rows.length === 0) {
    console.error("\n❌ No admin account found — aborting to prevent lockout.");
    await client.end();
    process.exit(1);
  }

  const adminIds = adminResult.rows.map((r: { id: string }) => `'${r.id}'`).join(", ");

  // ── BEFORE ──────────────────────────────────────────────
  console.log("\n📋 BEFORE RESET\n");

  const before = await countAll(ALL_TABLES);
  const preservedBefore = await countAll(PRESERVED_TABLES);

  for (const [table, count] of Object.entries(before)) {
    if (count > 0) console.log(`    ${table.padEnd(25)} ${count}`);
  }

  console.log("\n  Preserved (must survive):");
  for (const [table, count] of Object.entries(preservedBefore)) {
    console.log(`    ${table.padEnd(25)} ${count}`);
  }

  // ── DELETE ──────────────────────────────────────────────
  console.log("\n--- DELETING ---\n");

  await client.query("BEGIN");

  try {
    // Phase 1: operational records
    const steps: Array<[string, string | undefined]> = [
      ["MemorizationRecord", undefined],
      ["RevisionRecord", undefined],
      ["Target", undefined],
      ["SummativeScore", undefined],
      ["TasmiRecord", undefined],
      ["AuditLog", undefined],
      // Phase 2: Student (requires phase 1 cleared)
      ["Student", undefined],
      // Phase 3: ClassGroup (FK teacherId → Teacher Restrict)
      ["ClassGroup", undefined],
      // Phase 4: AcademicClass
      ["AcademicClass", undefined],
      // Phase 5: AcademicYear
      ["AcademicYear", undefined],
      // Phase 6: non-admin auth tables + users
      [`Session (non-admin)`, `"userId" NOT IN (${adminIds})`],
      [`Account (non-admin)`, `"userId" NOT IN (${adminIds})`],
      [`Teacher`, undefined],
      [`User (non-admin)`, `"id" NOT IN (${adminIds})`],
    ];

    for (const [label, where] of steps) {
      const table = label.split(" ")[0];
      const count = await deleteTable(table, where);
      console.log(`    ${label.padEnd(25)} deleted ${count}`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  // ── AFTER ───────────────────────────────────────────────
  console.log("\n📋 AFTER RESET\n");

  const after = await countAll(ALL_TABLES);
  const preservedAfter = await countAll(PRESERVED_TABLES);

  let allClean = true;

  for (const [table, count] of Object.entries(after)) {
    const isUserTable = table === "User";
    const expected = isUserTable ? adminResult.rows.length : 0;
    const ok = count === expected;
    if (!ok) allClean = false;
    const status = ok ? "✅" : "❌";
    const note = isUserTable ? ` (${adminResult.rows.length} admin preserved)` : "";
    console.log(`    ${status} ${table.padEnd(23)} ${count}${note}`);
  }

  console.log("\n  Preserved master data:");
  let preservedOk = true;
  for (const [table, count] of Object.entries(preservedAfter)) {
    const unchanged = count === preservedBefore[table];
    if (!unchanged) preservedOk = false;
    const status = unchanged ? "✅" : "❌";
    console.log(`    ${status} ${table.padEnd(23)} ${count}  (was ${preservedBefore[table]})`);
  }

  // ── VERDICT ─────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  if (allClean && preservedOk) {
    console.log("  ✅ FULL RESET COMPLETE — brand new installation state");
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
