import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { getTeacherReportData } from "@/lib/reports";
import { badge } from "@/lib/colors";

type ReportStudent = Awaited<ReturnType<typeof getTeacherReportData>>["students"][number];

type ReportProgressTableProps = {
  labels: {
    badgeCheck: string;
    className: string;
    hafalan: string;
    halaqah: string;
    last: string;
    murojaah: string;
    name: string;
    score: string;
    status: string;
  };
  renderName: (student: ReportStudent) => ReactNode;
  students: ReportStudent[];
};

export default function ReportProgressTable({
  labels,
  renderName,
  students,
}: ReportProgressTableProps) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-700">
            <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{labels.name}</th>
            <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{labels.className}</th>
            <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{labels.halaqah}</th>
            <th className="pb-3 pr-4 text-center font-semibold text-slate-700 dark:text-slate-300">{labels.hafalan}</th>
            <th className="pb-3 pr-4 text-center font-semibold text-slate-700 dark:text-slate-300">{labels.murojaah}</th>
            <th className="pb-3 pr-4 text-center font-semibold text-slate-700 dark:text-slate-300">{labels.score}</th>
            <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{labels.last}</th>
            <th className="pb-3 text-center font-semibold text-slate-700 dark:text-slate-300">{labels.status}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr className="border-b border-slate-100 dark:border-slate-800" key={student.id}>
              <td className="py-3 pr-4 font-medium text-slate-950 dark:text-white">
                {renderName(student)}
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{student.academicClassName}</td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{student.halaqahName}</td>
              <td className="py-3 pr-4 text-center text-slate-900 dark:text-slate-100">{student.hafalanCount}</td>
              <td className="py-3 pr-4 text-center text-slate-900 dark:text-slate-100">{student.murojaahCount}</td>
              <td className="py-3 pr-4 text-center">
                <span className={student.avgScore >= 85
                  ? "font-semibold text-emerald-700"
                  : student.avgScore >= 70
                    ? "font-semibold text-amber-700"
                    : student.avgScore > 0
                      ? "font-semibold text-red-700"
                      : "text-slate-400"}>
                  {student.avgScore ?? "-"}
                </span>
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{student.lastRange}</td>
              <td className="py-3 text-center">
                {student.needsReview ? (
                  <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${badge.warning}`}>
                    <AlertTriangle aria-hidden="true" size={10} />
                    {labels.badgeCheck}
                  </span>
                ) : (
                  <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${badge.success}`}>
                    {student.lastStatus}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
