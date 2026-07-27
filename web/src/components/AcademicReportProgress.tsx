import type { getTranslations } from "next-intl/server";
import type { getTeacherReportData } from "@/lib/reports";
import { groupProgressStudentsByGradeAndClass } from "@/lib/report-presentation";
import ReportProgressTable from "@/components/ReportProgressTable";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type ReportData = Awaited<ReturnType<typeof getTeacherReportData>>;

export default function AcademicReportProgress({
  data,
  t,
}: {
  data: ReportData;
  t: Translator;
}) {
  const groups = groupProgressStudentsByGradeAndClass(data.students);
  const tableLabels = {
    badgeCheck: t("badgeCek"),
    className: t("tableClass"),
    hafalan: t("academicTableHafalan"),
    halaqah: t("tableHalaqah"),
    last: t("academicTableLast"),
    murojaah: t("academicTableMurojaah"),
    name: t("tableName"),
    score: t("tableSkor"),
    status: t("tableStatus"),
  };

  return groups.map((gradeGroup) => (
    <section key={gradeGroup.grade} className="mt-6">
      <h2 className="text-lg font-semibold">
        {t("progressGradeHeading", { grade: gradeGroup.grade })}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("progressGradeCount", { count: gradeGroup.studentCount })}
      </p>
      <div className="mt-4 space-y-6">
        {gradeGroup.classes.map((parallelClass) => (
          <section key={parallelClass.className}>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">
              {parallelClass.className}
            </h3>
            <ReportProgressTable
              labels={tableLabels}
              renderName={(student) => (
                <>
                  <span>{student.fullName}</span>
                  <div className="mt-2 flex max-w-64 flex-wrap gap-1 text-[11px] font-medium">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                      {t("meetingAttendanceRate")} {student.attendance?.attendanceRate ?? 0}%
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t("meetingHadir")} {student.attendance?.hadir ?? 0}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t("meetingIzin")} {student.attendance?.izin ?? 0}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t("meetingSakit")} {student.attendance?.sakit ?? 0}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {t("meetingAlfa")} {student.attendance?.alfa ?? 0}
                    </span>
                  </div>
                </>
              )}
              students={parallelClass.students}
            />
          </section>
        ))}
      </div>
    </section>
  ));
}
