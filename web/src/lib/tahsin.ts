import { ProgramType, RecordStatus, Semester, TahsinMaterial } from "@/generated/prisma-next/enums";
import type { Prisma } from "@/generated/prisma-next/client";
import { getActiveAcademicYear, getAcademicYearForDate, getSemesterForDate } from "@/lib/academic-year";
import { getJakartaDayKey } from "@/lib/jakarta-date";
import { prisma } from "@/lib/prisma";
import { deriveRecordStatusFromScore } from "@/lib/record-status";
import {
  TAHSIN_ENABLED_GRADES,
  TAHSIN_JILID_GRADES,
  TAHSIN_QURAN_GRADES,
  tahsinMaterialForGrade,
} from "@/lib/tahsin-material";
import {
  normalizeTahsinAyahRange,
  resolveTahsinQuranDefault,
  tahsinMeetingWeekStart,
  validateTahsinAyahRange,
  type TahsinSurahOption,
} from "@/lib/tahsin-quran";

export { TAHSIN_ENABLED_GRADES } from "@/lib/tahsin-material";
export const TAHSIN_JILID_VALUES = [1, 2] as const;
export const TAHSIN_METHOD_NAME = "Ilman Wa Ruuhan";

export type TahsinMeetingContext = {
  runNumber: number;
  meetingNumber: number;
};

export function resolveTahsinMeetingContext(
  meeting: { meetingNumber: number; timeline: { runNumber: number } } | null,
): TahsinMeetingContext | null {
  return meeting
    ? { runNumber: meeting.timeline.runNumber, meetingNumber: meeting.meetingNumber }
    : null;
}

export type TahsinValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateJilid(jilid: number): TahsinValidationResult {
  return TAHSIN_JILID_VALUES.includes(jilid as 1 | 2)
    ? { ok: true }
    : { ok: false, error: "Jilid Tahsin harus 1 atau 2." };
}

export function validatePageRange(startPage: number, endPage: number | null): TahsinValidationResult {
  if (!Number.isInteger(startPage) || startPage <= 0) return { ok: false, error: "Halaman awal harus berupa bilangan bulat positif." };
  if (endPage === null) return { ok: true };
  if (!Number.isInteger(endPage) || endPage <= 0) return { ok: false, error: "Halaman akhir harus berupa bilangan bulat positif." };
  if (endPage < startPage) return { ok: false, error: "Halaman akhir tidak boleh lebih kecil dari halaman awal." };
  return { ok: true };
}

export function formatTahsinPageRange(startPage: number, endPage: number | null) {
  return endPage === null || endPage === startPage ? String(startPage) : `${startPage}–${endPage}`;
}

export function normalizeTahsinPageRange(startPage: number, endPage: number | null) {
  return {
    startPage,
    endPage: endPage === startPage ? null : endPage,
  };
}

export function validateTahsinAcademicScope(input: { programType: ProgramType; grade: number }): TahsinValidationResult {
  if (input.programType !== ProgramType.ACADEMIC) return { ok: false, error: "Tahsin hanya tersedia untuk program Academic." };
  if (!tahsinMaterialForGrade(input.grade)) return { ok: false, error: "Tahsin belum tersedia untuk kelas ini." };
  return { ok: true };
}

export function validateTahsinScore(score: number | null): { ok: true; status: RecordStatus } | { ok: false; error: string } {
  if (score === null || !Number.isInteger(score) || score < 0 || score > 100) return { ok: false, error: "Nilai harus berada di antara 0 sampai 100." };
  const status = deriveRecordStatusFromScore(score);
  return status ? { ok: true, status } : { ok: false, error: "Nilai harus berada dalam rentang penilaian yang berlaku." };
}

export type TahsinActor = {
  isAdmin: boolean;
  teacherId: string | null;
};

type TahsinQueryOptions = {
  academicYear?: string;
  semester?: Semester;
};

export type TahsinExportOptions = TahsinQueryOptions & {
  classLevel: number;
};

/**
 * What was read. Grade 7 records a jilid and pages; grades 8 and 9 record a
 * surah and ayat. Omitting `material` means jilid, which keeps every existing
 * grade 7 caller unchanged.
 */
export type TahsinMaterialInput =
  | { material?: "JILID"; jilid: number; startPage: number; endPage: number | null }
  | { material: "QURAN"; surahId: string; startAyah: number; endAyah: number | null };

type TahsinCreateInput = TahsinMaterialInput & {
  studentId: string;
  date: Date;
  score: number | null;
  notes: string | null;
};

type TahsinUpdateInput = TahsinMaterialInput & {
  score: number | null;
  notes: string | null;
};

function isQuranInput(input: TahsinMaterialInput): input is Extract<TahsinMaterialInput, { material: "QURAN" }> {
  return input.material === "QURAN";
}

function gradesForMaterial(input: TahsinMaterialInput): readonly number[] {
  return isQuranInput(input) ? TAHSIN_QURAN_GRADES : TAHSIN_JILID_GRADES;
}

function validateJilidInput(input: Extract<TahsinMaterialInput, { material?: "JILID" }>) {
  assertValid(validateJilid(input.jilid));
  assertValid(validatePageRange(input.startPage, input.endPage));
}

/** Checks the surah exists and the ayat fall inside it, returning the stored fields. */
async function resolveQuranMaterial(
  input: Extract<TahsinMaterialInput, { material: "QURAN" }>,
  db: Prisma.TransactionClient,
) {
  const surah = input.surahId
    ? await db.surah.findUnique({ where: { id: input.surahId }, select: { id: true, totalAyahs: true } })
    : null;
  if (!surah) throw new Error("Surah Tahsin tidak ditemukan.");
  assertValid(validateTahsinAyahRange(input.startAyah, input.endAyah, surah.totalAyahs));
  return { surahId: surah.id, ...normalizeTahsinAyahRange(input.startAyah, input.endAyah) };
}

/** Column values for one kind of material, clearing the other kind's columns. */
function materialColumns(
  input: TahsinMaterialInput,
  quran: { surahId: string; startAyah: number; endAyah: number | null } | null,
) {
  if (quran) {
    return {
      material: TahsinMaterial.QURAN,
      ...quran,
      jilid: null,
      startPage: null,
      endPage: null,
    };
  }
  const jilidInput = input as Extract<TahsinMaterialInput, { material?: "JILID" }>;
  return {
    material: TahsinMaterial.JILID,
    jilid: jilidInput.jilid,
    ...normalizeTahsinPageRange(jilidInput.startPage, jilidInput.endPage),
    surahId: null,
    startAyah: null,
    endAyah: null,
  };
}

const TAHSIN_RECORD_SELECT = {
  id: true,
  studentId: true,
  teacherId: true,
  material: true,
  jilid: true,
  startPage: true,
  endPage: true,
  surahId: true,
  startAyah: true,
  endAyah: true,
  surah: { select: { name: true, number: true, totalAyahs: true } },
  date: true,
  score: true,
  status: true,
  notes: true,
  academicYear: true,
  semester: true,
  createdAt: true,
  updatedAt: true,
  meetingId: true,
  meeting: {
    select: {
      meetingNumber: true,
      meetingDate: true,
      timeline: { select: { runNumber: true } },
    },
  },
  halaqahMeetingId: true,
  halaqahMeeting: {
    select: {
      meetingNumber: true,
      meetingDate: true,
      classGroupId: true,
    },
  },
} as const;

const TAHSIN_TEACHER_RECORD_SELECT = {
  ...TAHSIN_RECORD_SELECT,
  student: { select: { fullName: true, academicClass: { select: { name: true } } } },
} as const;

function assertValid(result: TahsinValidationResult | { ok: true; status: RecordStatus }) {
  if (!result.ok) throw new Error(result.error);
}

function assertTeacherActor(actor: TahsinActor) {
  if (actor.isAdmin || !actor.teacherId) {
    throw new Error("Tahsin hanya dapat dibuat oleh guru yang terautentikasi.");
  }
  return actor.teacherId;
}

function tahsinStudentWhere(
  academicYear: string,
  teacherId?: string,
  grades: readonly number[] = TAHSIN_ENABLED_GRADES,
) {
  return {
    isActive: true,
    classGroup: {
      isActive: true,
      academicYear,
      programType: ProgramType.ACADEMIC,
      grade: grades.length === 1 ? grades[0] : { in: [...grades] },
    },
    ...(teacherId ? { teacherId } : {}),
  };
}

async function resolveQueryContext(options?: TahsinQueryOptions) {
  return {
    academicYear: options?.academicYear ?? await getActiveAcademicYear(),
    ...(options?.semester ? { semester: options.semester } : {}),
  };
}

async function getOrCreateActiveTahsinMeeting(
  academicYear: string,
  semester: Semester,
  meetingDate: Date,
  db: Prisma.TransactionClient,
) {
  const year = await db.academicYear.findUnique({
    where: { year: academicYear },
    select: { id: true },
  });
  if (!year) throw new Error("Tahun ajaran aktif tidak ditemukan.");

  await db.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
  let timeline = await db.tahsinMeetingTimeline.findFirst({
    where: { academicYearId: year.id, semester, isActive: true },
    orderBy: { runNumber: "desc" },
  });
  if (!timeline) {
    const latest = await db.tahsinMeetingTimeline.findFirst({
      where: { academicYearId: year.id, semester },
      orderBy: { runNumber: "desc" },
      select: { runNumber: true },
    });
    timeline = await db.tahsinMeetingTimeline.create({
      data: { academicYearId: year.id, semester, runNumber: (latest?.runNumber ?? 0) + 1 },
    });
  }

  let meeting = await db.tahsinMeeting.findFirst({
    where: { timelineId: timeline.id, isActive: true },
    orderBy: { meetingNumber: "desc" },
  });
  if (!meeting) {
    meeting = await db.tahsinMeeting.create({
      data: { timelineId: timeline.id, meetingNumber: 1, meetingDate: meetingDateForActivity(meetingDate) },
    });
    return meeting;
  }

  const activityDay = getJakartaDayKey(meetingDate);
  const activeMeetingDay = getJakartaDayKey(meeting.meetingDate);
  if (activityDay === activeMeetingDay) return meeting;
  if (activityDay < activeMeetingDay) {
    throw new Error("Tanggal Tahsin tidak boleh lebih awal dari pertemuan Tahsin aktif.");
  }

  await db.tahsinMeeting.update({ where: { id: meeting.id }, data: { isActive: false } });
  return db.tahsinMeeting.create({
    data: {
      timelineId: timeline.id,
      meetingNumber: meeting.meetingNumber + 1,
      meetingDate: meetingDateForActivity(meetingDate),
    },
  });
}

/**
 * The weekly meeting of one halaqah that an assessment on `activityDate` belongs to.
 *
 * Grades 8 and 9 meet for Tahsin once a week, and a halaqah mixes students from
 * several rombel, so the meeting is keyed on halaqah and Jakarta week. The first
 * assessment of a new week opens the next meeting number; later assessments that
 * week, including catch-up sessions on another day, join it.
 */
async function getOrCreateHalaqahMeeting(
  classGroupId: string,
  semester: Semester,
  activityDate: Date,
  db: Prisma.TransactionClient,
) {
  // Serialises concurrent saves for the same halaqah so two first-of-the-week
  // assessments cannot both open a meeting.
  await db.$queryRaw`SELECT "id" FROM "ClassGroup" WHERE "id" = ${classGroupId} FOR UPDATE`;
  const weekStart = tahsinMeetingWeekStart(activityDate);
  const existing = await db.tahsinHalaqahMeeting.findUnique({
    where: { classGroupId_semester_weekStart: { classGroupId, semester, weekStart } },
  });
  if (existing) return existing;

  const latest = await db.tahsinHalaqahMeeting.findFirst({
    where: { classGroupId, semester },
    orderBy: { meetingNumber: "desc" },
  });
  if (latest && latest.weekStart.getTime() > weekStart.getTime()) {
    throw new Error("Tanggal Tahsin tidak boleh lebih awal dari pertemuan Tahsin terakhir.");
  }

  return db.tahsinHalaqahMeeting.create({
    data: {
      classGroupId,
      semester,
      weekStart,
      meetingDate: meetingDateForActivity(activityDate),
      meetingNumber: (latest?.meetingNumber ?? 0) + 1,
    },
  });
}

function meetingDateForActivity(date: Date) {
  return new Date(`${getJakartaDayKey(date)}T00:00:00.000Z`);
}

export async function getActiveTahsinMeeting(academicYear: string, semester: Semester) {
  return prisma.tahsinMeeting.findFirst({
    where: { isActive: true, timeline: { academicYear: { year: academicYear }, semester, isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { timeline: { select: { runNumber: true } } },
  });
}

async function lockTahsinContext(
  academicYear: string,
  semester: Semester,
  db: Prisma.TransactionClient,
) {
  const year = await db.academicYear.findUnique({ where: { year: academicYear }, select: { id: true } });
  if (!year) throw new Error("Tahun ajaran aktif tidak ditemukan.");
  await db.$queryRaw`SELECT "id" FROM "AcademicYear" WHERE "id" = ${year.id} FOR UPDATE`;
  const timeline = await db.tahsinMeetingTimeline.findFirst({
    where: { academicYearId: year.id, semester, isActive: true },
    orderBy: { runNumber: "desc" },
  });
  if (!timeline) throw new Error("Timeline Tahsin aktif belum tersedia.");
  const meeting = await db.tahsinMeeting.findFirst({
    where: { timelineId: timeline.id, isActive: true },
    orderBy: { meetingNumber: "desc" },
  });
  if (!meeting) throw new Error("Pertemuan Tahsin aktif belum tersedia.");
  return { year, timeline, meeting };
}

export async function resetTahsinMeetingTimeline(
  actor: TahsinActor,
  meetingDate: Date,
  db?: Prisma.TransactionClient,
) {
  if (!actor.isAdmin) throw new Error("Hanya admin yang dapat mereset timeline Tahsin.");
  const academicYear = await getActiveAcademicYear();
  const semester = getSemesterForDate(new Date());
  const mutate = async (tx: Prisma.TransactionClient) => {
    const { year, timeline, meeting } = await lockTahsinContext(academicYear, semester, tx);
    await tx.tahsinMeeting.update({ where: { id: meeting.id }, data: { isActive: false } });
    await tx.tahsinMeetingTimeline.update({ where: { id: timeline.id }, data: { isActive: false } });
    const nextTimeline = await tx.tahsinMeetingTimeline.create({
      data: { academicYearId: year.id, semester, runNumber: timeline.runNumber + 1 },
    });
    return tx.tahsinMeeting.create({ data: { timelineId: nextTimeline.id, meetingNumber: 1, meetingDate } });
  };
  return db ? mutate(db) : prisma.$transaction(mutate);
}

export async function createTahsinRecord(
  actor: TahsinActor,
  input: TahsinCreateInput,
  db: Prisma.TransactionClient = prisma,
) {
  const teacherId = assertTeacherActor(actor);
  if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
    throw new Error("Tanggal Tahsin tidak valid.");
  }

  if (!isQuranInput(input)) validateJilidInput(input);
  const scoreResult = validateTahsinScore(input.score);
  if (!scoreResult.ok) throw new Error(scoreResult.error);

  const academicYear = await getActiveAcademicYear();
  if (getAcademicYearForDate(input.date) !== academicYear) {
    throw new Error("Tanggal Tahsin harus berada pada tahun ajaran aktif.");
  }

  // The grade filter pairs material with class: jilid can only be recorded for
  // grade 7 students and surah/ayat only for grades 8 and 9.
  const student = await db.student.findFirst({
    where: {
      id: input.studentId,
      ...tahsinStudentWhere(academicYear, teacherId, gradesForMaterial(input)),
    },
    select: { id: true, teacherId: true, classGroupId: true },
  });

  if (!student) {
    throw new Error("Santri tidak tersedia untuk penilaian Tahsin.");
  }

  const quran = isQuranInput(input) ? await resolveQuranMaterial(input, db) : null;
  const semester = getSemesterForDate(input.date);
  const meetingLink = quran
    ? { halaqahMeetingId: (await getOrCreateHalaqahMeeting(student.classGroupId, semester, input.date, db)).id }
    : { meetingId: (await getOrCreateActiveTahsinMeeting(academicYear, semester, input.date, db)).id };
  return db.tahsinRecord.create({
    data: {
      studentId: student.id,
      teacherId: student.teacherId,
      ...materialColumns(input, quran),
      date: input.date,
      score: input.score,
      status: scoreResult.status,
      notes: input.notes,
      academicYear,
      semester,
      ...meetingLink,
    },
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function updateTahsinRecord(
  actor: TahsinActor,
  recordId: string,
  input: TahsinUpdateInput,
  db: Prisma.TransactionClient = prisma,
) {
  const teacherId = assertTeacherActor(actor);
  if (!isQuranInput(input)) validateJilidInput(input);
  const scoreResult = validateTahsinScore(input.score);
  if (!scoreResult.ok) throw new Error(scoreResult.error);

  const academicYear = await getActiveAcademicYear();
  const existing = await db.tahsinRecord.findFirst({
    where: {
      id: recordId,
      teacherId,
      academicYear,
      student: tahsinStudentWhere(academicYear, teacherId),
    },
    select: { id: true, material: true },
  });
  if (!existing) throw new Error("Penilaian Tahsin tidak tersedia.");
  // Material follows the student's grade and the meeting it was filed under, so
  // an edit may change what was read but never which kind of reading it is.
  const expected = isQuranInput(input) ? TahsinMaterial.QURAN : TahsinMaterial.JILID;
  if (existing.material !== expected) throw new Error("Jenis bacaan Tahsin tidak dapat diubah.");

  const quran = isQuranInput(input) ? await resolveQuranMaterial(input, db) : null;
  return db.tahsinRecord.update({
    where: { id: existing.id },
    data: {
      ...materialColumns(input, quran),
      score: input.score,
      status: scoreResult.status,
      notes: input.notes,
    },
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function deleteTahsinRecord(
  actor: TahsinActor,
  recordId: string,
  db: Prisma.TransactionClient = prisma,
) {
  const teacherId = assertTeacherActor(actor);
  const academicYear = await getActiveAcademicYear();
  const existing = await db.tahsinRecord.findFirst({
    where: {
      id: recordId,
      teacherId,
      academicYear,
      student: tahsinStudentWhere(academicYear, teacherId),
    },
    select: { id: true, studentId: true, meetingId: true, halaqahMeetingId: true, academicYear: true, material: true, jilid: true, startPage: true, endPage: true, surahId: true, startAyah: true, endAyah: true, score: true },
  });
  if (!existing) throw new Error("Penilaian Tahsin tidak tersedia.");

  await db.tahsinRecord.delete({ where: { id: existing.id } });
  return existing;
}

export async function getTahsinForStudent(
  actor: TahsinActor,
  studentId: string,
  options?: TahsinQueryOptions,
) {
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findMany({
    where: {
      studentId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function getLatestTahsinForStudent(
  actor: TahsinActor,
  studentId: string,
  options?: TahsinQueryOptions,
) {
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findFirst({
    where: {
      studentId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_RECORD_SELECT,
  });
}

export async function getTahsinSmartDefaultForStudent(
  actor: TahsinActor,
  studentId: string,
) {
  const context = await resolveQueryContext();
  return prisma.tahsinRecord.findFirst({
    where: {
      studentId,
      academicYear: context.academicYear,
      material: TahsinMaterial.JILID,
      student: tahsinStudentWhere(context.academicYear, actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__"),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { jilid: true, startPage: true, endPage: true },
  });
}

/**
 * The last Qur'an reading of a student and where the next one should start.
 *
 * Deliberately not limited to the current academic year: the reading runs on
 * from Al-Baqarah through grades 8 and 9, so a student starting grade 9 picks up
 * where grade 8 ended rather than going back to ayah 1. The student must still
 * be in the teacher's current Tahsin scope.
 */
export async function getTahsinQuranEntryContext(
  actor: TahsinActor,
  studentId: string,
  surahs: readonly TahsinSurahOption[],
) {
  const context = await resolveQueryContext();
  const teacherId = actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__";
  const student = await prisma.student.findFirst({
    where: { id: studentId, ...tahsinStudentWhere(context.academicYear, teacherId, TAHSIN_QURAN_GRADES) },
    select: { id: true },
  });
  if (!student) throw new Error("Santri tidak tersedia untuk penilaian Tahsin.");

  const last = await prisma.tahsinRecord.findFirst({
    where: { studentId: student.id, material: TahsinMaterial.QURAN },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_RECORD_SELECT,
  });
  const next = resolveTahsinQuranDefault(
    last?.surahId && last.startAyah !== null
      ? { surahId: last.surahId, startAyah: last.startAyah, endAyah: last.endAyah, status: last.status }
      : null,
    surahs,
  );
  return { last, next };
}

/** Surahs in mushaf order for the grade 8 and 9 reading picker. */
export async function getTahsinSurahOptions(): Promise<TahsinSurahOption[]> {
  return prisma.surah.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, name: true, totalAyahs: true },
  });
}

/**
 * The latest weekly meeting of each grade 8 or 9 halaqah the teacher holds,
 * for the meeting summary at the top of the Tahsin page.
 */
export async function getTahsinHalaqahMeetingSummaries(actor: TahsinActor, semester: Semester) {
  const teacherId = assertTeacherActor(actor);
  const academicYear = await getActiveAcademicYear();
  const halaqahs = await prisma.classGroup.findMany({
    where: {
      teacherId,
      academicYear,
      isActive: true,
      programType: ProgramType.ACADEMIC,
      grade: { in: [...TAHSIN_QURAN_GRADES] },
    },
    orderBy: { grade: "asc" },
    select: {
      id: true,
      grade: true,
      tahsinMeetings: {
        where: { semester },
        orderBy: { meetingNumber: "desc" },
        take: 1,
        select: { meetingNumber: true, meetingDate: true },
      },
    },
  });
  return halaqahs.map((halaqah) => ({
    classGroupId: halaqah.id,
    grade: halaqah.grade,
    latestMeeting: halaqah.tahsinMeetings[0] ?? null,
  }));
}

export async function getTahsinForTeacher(actor: TahsinActor, options?: TahsinQueryOptions) {
  const teacherId = assertTeacherActor(actor);
  const context = await resolveQueryContext(options);
  return prisma.tahsinRecord.findMany({
    where: {
      teacherId,
      academicYear: context.academicYear,
      ...(context.semester ? { semester: context.semester } : {}),
      student: tahsinStudentWhere(context.academicYear, teacherId),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: TAHSIN_TEACHER_RECORD_SELECT,
  });
}

export async function getTahsinExportData(
  actor: TahsinActor,
  options: TahsinExportOptions,
) {
  const material = tahsinMaterialForGrade(options.classLevel);
  if (!material) {
    throw new Error("Export Tahsin belum tersedia untuk kelas ini.");
  }

  if (!options.semester) {
    throw new Error("Semester diperlukan untuk export Tahsin.");
  }

  const context = await resolveQueryContext(options);
  const teacherId = actor.isAdmin ? undefined : actor.teacherId ?? "__missing_teacher__";
  const studentWhere = tahsinStudentWhere(context.academicYear, teacherId, [options.classLevel]);
  const students = await prisma.student.findMany({
    where: studentWhere,
    select: {
      id: true,
      fullName: true,
      classGroupId: true,
      academicClass: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const studentIds = students.map((student) => student.id);

  if (material === "QURAN") {
    const classGroupIds = [...new Set(students.map((student) => student.classGroupId))];
    const halaqahMeetings = classGroupIds.length > 0
      ? await prisma.tahsinHalaqahMeeting.findMany({
          where: { classGroupId: { in: classGroupIds }, semester: options.semester },
          orderBy: [{ meetingNumber: "asc" }, { meetingDate: "asc" }],
          select: { meetingNumber: true, meetingDate: true, classGroupId: true },
        })
      : [];
    // Each halaqah numbers its own weeks, so a meeting date only describes a
    // column when the sheet covers a single halaqah — which it does for a
    // teacher, who holds one halaqah per grade.
    const singleHalaqah = classGroupIds.length === 1;
    const meetings = [...new Map(halaqahMeetings.map((meeting) => [meeting.meetingNumber, {
      meetingNumber: meeting.meetingNumber,
      meetingDate: singleHalaqah ? meeting.meetingDate : undefined,
    }])).values()];
    const records = studentIds.length > 0
      ? await prisma.tahsinRecord.findMany({
          where: {
            studentId: { in: studentIds },
            academicYear: context.academicYear,
            semester: options.semester,
            material: TahsinMaterial.QURAN,
            ...(teacherId ? { teacherId } : {}),
          },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          select: TAHSIN_RECORD_SELECT,
        })
      : [];
    return { material, students, meetings, records };
  }

  // Every meeting of the active timeline. Opening a new meeting deactivates the
  // previous one, so filtering on the meeting's own flag returned only the
  // latest meeting and left the sheet with one header over several columns.
  const meetings = await prisma.tahsinMeeting.findMany({
    where: {
      timeline: {
        isActive: true,
        semester: options.semester,
        academicYear: { year: context.academicYear },
      },
    },
    orderBy: { meetingNumber: "asc" },
    select: { meetingNumber: true, meetingDate: true },
  });
  const records = studentIds.length > 0
    ? await prisma.tahsinRecord.findMany({
        where: {
          studentId: { in: studentIds },
          academicYear: context.academicYear,
          semester: options.semester,
          material: TahsinMaterial.JILID,
          meeting: { timeline: { isActive: true } },
          ...(teacherId ? { teacherId } : {}),
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: TAHSIN_RECORD_SELECT,
      })
    : [];

  return { material, students, meetings, records };
}

export async function getTahsinStudents(actor: TahsinActor) {
  const teacherId = assertTeacherActor(actor);
  const academicYear = await getActiveAcademicYear();
  return prisma.student.findMany({
    where: tahsinStudentWhere(academicYear, teacherId),
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      academicClass: { select: { name: true } },
      classGroup: { select: { grade: true } },
    },
  });
}
