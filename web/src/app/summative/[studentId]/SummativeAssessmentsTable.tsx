"use client";

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import DeleteSummativeButton from "@/components/DeleteSummativeButton";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { actionButtonClass } from "@/components/action-button-styles";
import FormativeTableScroll from "../../formative/FormativeTableScroll";

type SummativeAssessment = {
  id: string;
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  score: number;
  semesterLabel: string;
  notes: string | null;
  recordedAt: string;
};

type SummativeAssessmentsTableProps = {
  emptyDescription: string;
  emptyHeading: string;
  assessments: SummativeAssessment[];
  returnTo: string;
  semesterValue: string;
  studentId: string;
};

export default function SummativeAssessmentsTable({
  emptyDescription,
  emptyHeading,
  assessments,
  returnTo,
  semesterValue,
  studentId,
}: SummativeAssessmentsTableProps) {
  const t = useTranslations("Summative");
  const [hiddenAssessmentIds, setHiddenAssessmentIds] = useState<Set<string>>(new Set());

  const visibleAssessments = useMemo(
    () => assessments.filter((assessment) => !hiddenAssessmentIds.has(assessment.id)),
    [assessments, hiddenAssessmentIds],
  );

  if (visibleAssessments.length === 0) {
    return (
      <div className="m-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emptyHeading}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <FormativeTableScroll storageKey="summative:detail:hscroll">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
            <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colSurah")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colScore")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("semesterLabel")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colNotes")}
            </th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
              {t("colRecordedAt")}
            </th>
            <th className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
              {t("colAction")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleAssessments.map((assessment, index) => (
            <tr
              key={assessment.id}
              className={`border-b border-slate-100 dark:border-slate-800 ${
                index % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
              }`}
              data-highlight={assessment.id}
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-950 dark:text-white">
                  {assessment.surahNumber}. {assessment.surahName}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {assessment.surahArabicName}
                </p>
              </td>
              <td className="px-4 py-4">
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {assessment.score}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                {assessment.semesterLabel}
              </td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                {assessment.notes || "-"}
              </td>
              <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                {assessment.recordedAt}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <WorkflowContextLink
                    className={actionButtonClass("neutral")}
                    href={`/summative/${studentId}/${assessment.id}/edit?semester=${semesterValue}&returnTo=${encodeURIComponent(returnTo)}`}
                  >
                    <PencilLine aria-hidden="true" size={16} strokeWidth={2.2} />
                    {t("editButton")}
                  </WorkflowContextLink>
                  <DeleteSummativeButton
                    compact
                    assessmentId={assessment.id}
                    navigateOnSuccess={false}
                    onDeleteError={() => {
                      setHiddenAssessmentIds((current) => {
                        const next = new Set(current);
                        next.delete(assessment.id);
                        return next;
                      });
                    }}
                    onDeleteSuccess={() => {
                      setHiddenAssessmentIds((current) => new Set(current).add(assessment.id));
                    }}
                    semester={semesterValue}
                    studentId={studentId}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </FormativeTableScroll>
  );
}
