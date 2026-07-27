import type { getTranslations } from "next-intl/server";
import type { getTeacherReportData } from "@/lib/reports";
import ReportProgressTable from "@/components/ReportProgressTable";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type ReportData = Awaited<ReturnType<typeof getTeacherReportData>>;

export default function BoardingReportProgress({
  data,
  t,
}: {
  data: ReportData;
  t: Translator;
}) {
  const tableLabels = {
    badgeCheck: t("badgeCek"),
    className: t("tableClass"),
    hafalan: t("tableHafalan"),
    halaqah: t("tableHalaqah"),
    last: t("tableLast"),
    murojaah: t("tableMurojaah"),
    name: t("tableName"),
    score: t("tableSkor"),
    status: t("tableStatus"),
  };

  return [7, 8, 9].map((grade) => {
    const students = data.students.filter((student) => student.grade === grade);
    if (students.length === 0) return null;

    return (
      <section key={grade} className="mt-6">
        <h2 className="text-lg font-semibold">
          {t("progressGradeHeading", { grade })}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("progressGradeCount", { count: students.length })}
        </p>
        <ReportProgressTable
          labels={tableLabels}
          renderName={(student) => <span>{student.fullName}</span>}
          students={students}
        />
      </section>
    );
  });
}
