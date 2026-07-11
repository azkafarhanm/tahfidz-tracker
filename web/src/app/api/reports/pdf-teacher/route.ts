import { NextResponse } from "next/server";
import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { statusLabels, formatRange } from "@/lib/format";
import { createPdfStreamResponse } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { getTeacherExportBundle } from "@/lib/reports";
import { getRequestSessionScope } from "@/lib/session";
import { semesterLabel } from "@/lib/summative";
import { locales, defaultLocale } from "@/i18n/request";
import type { Locale } from "@/i18n/request";
import { groupProgressStudentsByGradeAndClass } from "@/lib/report-presentation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportBundle = Awaited<ReturnType<typeof getTeacherExportBundle>>;

type ProgramSectionItem =
  | { type: "subtitle"; text: string }
  | { type: "text"; text: string }
  | { type: "cards"; items: Array<{ label: string; value: string | number }> }
  | { type: "table"; headers: string[]; rows: string[][] };

type GroupedPdfRow = {
  id: string;
  grade: number;
  academicClassName: string;
  fullName: string;
  cells: string[];
};

type PdfTableGrouping = "none" | "parallelClass" | "grade";

const pdfRowCollator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

async function getLatestSummativeAssessmentByStudent(
  teacherId: string,
  academicYear: string,
) {
  const assessments = await prisma.summativeScore.findMany({
    where: {
      academicYear,
      student: {
        teacherId,
        isActive: true,
        classGroup: {
          academicYear,
          programType: ProgramType.ACADEMIC,
        },
      },
    },
    select: {
      id: true,
      studentId: true,
      semester: true,
      updatedAt: true,
      createdAt: true,
      surah: {
        select: {
          number: true,
          name: true,
        },
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const latestByStudentAndSemester = new Map<string, string>();
  for (const assessment of assessments) {
    const key = `${assessment.semester}:${assessment.studentId}`;
    if (!latestByStudentAndSemester.has(key)) {
      latestByStudentAndSemester.set(
        key,
        `${assessment.surah.number}. ${assessment.surah.name}`,
      );
    }
  }

  return latestByStudentAndSemester;
}

function appendPdfTableSection(
  items: ProgramSectionItem[],
  title: string,
  headers: string[],
  semesterSections: Array<{ semester: Semester; rows: GroupedPdfRow[] }>,
  grouping: PdfTableGrouping,
) {
  const populatedSemesters = semesterSections.filter(({ rows }) => rows.length > 0);
  if (populatedSemesters.length === 0) return;

  items.push({ type: "subtitle", text: title });

  if (grouping === "none") {
    items.push({
      type: "table",
      headers,
      rows: populatedSemesters.flatMap(({ rows }) => rows.map((row) => row.cells)),
    });
    return;
  }

  if (grouping === "parallelClass") {
    for (const { semester, rows } of populatedSemesters) {
      items.push({ type: "subtitle", text: `Semester ${semesterLabel(semester)}` });
      for (const gradeGroup of groupProgressStudentsByGradeAndClass(rows)) {
        items.push({ type: "subtitle", text: `Kelas ${gradeGroup.grade}` });
        for (const parallelClass of gradeGroup.classes) {
          items.push(
            { type: "text", text: parallelClass.className },
            {
              type: "table",
              headers,
              rows: parallelClass.students.map((row) => row.cells),
            },
          );
        }
      }
    }
    return;
  }

  for (const grade of [7, 8, 9]) {
    const gradeRows = populatedSemesters.flatMap(({ rows }) =>
      rows
        .filter((row) => row.grade === grade)
        .toSorted(
          (left, right) =>
            pdfRowCollator.compare(left.fullName, right.fullName) ||
            left.id.localeCompare(right.id),
        ),
    );

    if (gradeRows.length > 0) {
      items.push(
        { type: "subtitle", text: `Kelas ${grade}` },
        {
          type: "table",
          headers,
          rows: gradeRows.map((row) => row.cells),
        },
      );
    }
  }
}

async function buildProgramSection(
  bundle: ExportBundle,
  programLabel: string,
  programType: ProgramType,
  teacherId: string,
) {
  const summary = bundle.summary;
  const latestSummativeAssessmentByStudent = programType === ProgramType.ACADEMIC
    ? await getLatestSummativeAssessmentByStudent(teacherId, bundle.academicYear)
    : null;
  const items: ProgramSectionItem[] = [
    { type: "subtitle", text: `Program ${programLabel}` },
    {
      type: "cards",
      items: [
        { label: "SANTRI", value: summary.studentCount },
        { label: "HAFALAN", value: summary.totalHafalan },
        { label: "MUROJAAH", value: summary.totalMurojaah },
        { label: "SKOR", value: summary.avgScore ?? "-" },
        { label: "PERLU CEK", value: summary.needsReviewCount },
        { label: "TARGET", value: summary.activeTargetCount },
      ],
    },
  ];

  const progressTable = (students: typeof summary.students) => ({
    type: "table" as const,
    headers: ["Nama", "Kelas", "Halaqah", "Hafalan", "Murojaah", "Skor", "Status"],
    rows: students.map((student) => [
      student.fullName,
      student.academicClassName,
      student.halaqahName,
      String(student.hafalanCount),
      String(student.murojaahCount),
      String(student.avgScore ?? "-"),
      student.needsReview ? "Perlu Cek" : student.lastStatus,
    ]),
  });

  if (programType === ProgramType.ACADEMIC) {
    for (const gradeGroup of groupProgressStudentsByGradeAndClass(summary.students)) {
      items.push({ type: "subtitle", text: `Santri Kelas ${gradeGroup.grade}` });
      for (const parallelClass of gradeGroup.classes) {
        items.push(
          { type: "text", text: parallelClass.className },
          progressTable(parallelClass.students),
        );
      }
    }
  } else {
    // Preserve the existing Boarding report layout.
    for (const grade of [7, 8, 9]) {
      const gradeStudents = summary.students.filter((student) => student.grade === grade);
      if (gradeStudents.length === 0) continue;
      items.push(
        { type: "subtitle", text: `Santri Kelas ${grade}` },
        progressTable(gradeStudents),
      );
    }
  }

  const remainingSectionGrouping: PdfTableGrouping =
    programType === ProgramType.ACADEMIC ? "parallelClass" : "grade";
  const semesters = [Semester.GANJIL, Semester.GENAP];

  appendPdfTableSection(
    items,
    "Rekap Formatif",
    ["Semester", "Nama", "Kelas", "Total", "Rata-rata", "Terakhir"],
    semesters.map((semester) => {
      const formative = bundle.formative[semester];
      return {
        semester,
        rows: formative.recap.map((student, index) => {
          const sourceStudent = formative.exportData.students[index];
          return {
            id: sourceStudent.id,
            grade: sourceStudent.classGroup.grade,
            academicClassName: student.academicClassName,
            fullName: student.fullName,
            cells: [
              semesterLabel(semester),
              student.fullName,
              student.academicClassName,
              String(student.totalAssessments),
              String(student.averageScore ?? "-"),
              student.latestRange,
            ],
          };
        }),
      };
    }),
    remainingSectionGrouping,
  );

  appendPdfTableSection(
    items,
    "Detail Formatif",
    ["Semester", "Nama", "Kelas", "Jenis", "Materi", "Nilai"],
    semesters.map((semester) => {
      const formative = bundle.formative[semester];
      const gradeByStudentId = new Map(
        formative.exportData.students.map((student) => [
          student.id,
          student.classGroup.grade,
        ]),
      );
      return {
        semester,
        rows: formative.exportData.rows.map((row, index) => ({
          id: `${row.studentId}:${String(index).padStart(8, "0")}`,
          grade: gradeByStudentId.get(row.studentId) ?? 0,
          academicClassName: row.academicClassName,
          fullName: row.studentName,
          cells: [
            semesterLabel(semester),
            row.studentName,
            row.academicClassName,
            row.type,
            formatRange(row.surah, row.fromAyah, row.toAyah),
            String(row.score ?? "-"),
          ],
        })),
      };
    }),
    remainingSectionGrouping,
  );

  appendPdfTableSection(
    items,
    "Rekap Sumatif",
    [
      "Semester",
      "Nama",
      "Kelas",
      "Jumlah",
      "Rata-rata",
      "Catatan Terakhir",
    ],
    semesters.map((semester) => {
      const summative = bundle.summative[semester];
      return {
        semester,
        rows: summative.recap.map((student, index) => {
          const sourceStudent = summative.exportData.students[index];
          return {
            id: sourceStudent.id,
            grade: sourceStudent.classLevel,
            academicClassName: student.academicClassName,
            fullName: student.fullName,
            cells: [
              semesterLabel(semester),
              student.fullName,
              student.academicClassName,
              String(student.totalAssessments),
              String(student.averageScore ?? "-"),
              latestSummativeAssessmentByStudent
                ? latestSummativeAssessmentByStudent.get(
                    `${semester}:${sourceStudent.id}`,
                  ) ?? "-"
                : student.latestAssessment,
            ],
          };
        }),
      };
    }),
    remainingSectionGrouping,
  );

  appendPdfTableSection(
    items,
    "Detail Sumatif",
    ["Semester", "Nama", "Kelas", "Surah", "Nilai", "Catatan"],
    semesters.map((semester) => ({
      semester,
      rows: bundle.summative[semester].exportData.rows.map((row, index) => ({
        id: `${row.studentId}:${String(index).padStart(8, "0")}`,
        grade: row.classLevel,
        academicClassName: row.academicClassName,
        fullName: row.studentName,
        cells: [
          semesterLabel(semester),
          row.studentName,
          row.academicClassName,
          `${row.surahNumber}. ${row.surahName}`,
          String(row.score),
          row.notes ?? "-",
        ],
      })),
    })),
    remainingSectionGrouping,
  );

  return items;
}

export async function GET(request: Request) {
  try {
    const scope = await getRequestSessionScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = scope.isAdmin;
    const searchParams = new URL(request.url).searchParams;
    const paramTeacherId = searchParams.get("teacherId");
    const paramAcademicYear = searchParams.get("academicYear");
    const programTypeParam = searchParams.get("programType");
    const programType = programTypeParam === "ACADEMIC" || programTypeParam === "BOARDING"
      ? programTypeParam
      : undefined;

    const localeCookie = request.headers.get("cookie")?.match(/(?:^|;\s*)locale=([^;]+)/)?.[1];
    const locale: Locale = locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : defaultLocale;
    const academicYear = paramAcademicYear || await getActiveAcademicYear();

    let teacherId: string;
    if (isAdmin && paramTeacherId) {
      teacherId = paramTeacherId;
    } else if (!isAdmin && scope.teacherId) {
      teacherId = scope.teacherId;
    } else if (isAdmin) {
      const firstStudent = await prisma.student.findFirst({
        where: { classGroup: { academicYear } },
        select: { teacherId: true },
      });
      if (!firstStudent) {
        return NextResponse.json({ error: "No students found for this academic year" }, { status: 404 });
      }
      teacherId = firstStudent.teacherId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get teacher name
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { fullName: true },
    });
    const teacherName = teacher?.fullName ?? "Guru";

    const date = new Date().toISOString().split("T")[0];

    if (programType) {
      // Single program export
      const bundle = await getTeacherExportBundle(teacherId, locale, academicYear, programType);
      const programLabel = programType === "BOARDING" ? "Boarding" : "Akademik";

      return createPdfStreamResponse(`Laporan Guru - ${teacherName} - TahfidzFlow`, [
        { type: "title", text: "Laporan Guru" },
        { type: "text", text: teacherName },
        { type: "text", text: `${academicYear} · ${programLabel}` },
        ...(await buildProgramSection(bundle, programLabel, programType, teacherId)),
        {
          type: "text",
          text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap diambil dari catatan asli agar evaluasi tetap konsisten.`,
        },
      ], `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.pdf`);
    }

    // ALL programs: fetch both
    const [academicBundle, boardingBundle] = await Promise.all([
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.ACADEMIC),
      getTeacherExportBundle(teacherId, locale, academicYear, ProgramType.BOARDING),
    ]);

    const hasAcademic = academicBundle.summary.studentCount > 0;
    const hasBoarding = boardingBundle.summary.studentCount > 0;

    const content: Array<
      | { type: "title"; text: string }
      | { type: "text"; text: string }
      | { type: "subtitle"; text: string }
      | { type: "cards"; items: Array<{ label: string; value: string | number }> }
      | { type: "table"; headers: string[]; rows: string[][] }
    > = [
      { type: "title", text: "Laporan Guru" },
      { type: "text", text: teacherName },
      { type: "text", text: `${academicYear} · Semua Program` },
    ];

    if (hasAcademic) {
      content.push(...(await buildProgramSection(
        academicBundle,
        "Akademik",
        ProgramType.ACADEMIC,
        teacherId,
      )));
    }

    if (hasBoarding) {
      if (hasAcademic) content.push({ type: "text", text: "" }); // separator
      content.push(...(await buildProgramSection(
        boardingBundle,
        "Boarding",
        ProgramType.BOARDING,
        teacherId,
      )));
    }

    if (!hasAcademic && !hasBoarding) {
      content.push({ type: "text", text: "Tidak ada data untuk tahun ajaran ini." });
    }

    content.push({
      type: "text",
      text: `Status formatif mengikuti catatan harian aktif. Label seperti "${statusLabels.PERLU_MUROJAAH}" tetap diambil dari catatan asli agar evaluasi tetap konsisten.`,
    });

    return createPdfStreamResponse(
      `Laporan Guru - ${teacherName} - TahfidzFlow`,
      content,
      `laporan-guru-${teacherName.toLowerCase().replace(/\s+/g, "-")}-${date}.pdf`,
    );
  } catch (error) {
    console.error("Failed to generate teacher PDF report", error);
    return NextResponse.json(
      { error: "Failed to generate teacher PDF report" },
      { status: 500 },
    );
  }
}
