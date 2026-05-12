"use client";

import Link from "next/link";
import { Download, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

type Target = {
  surahId: string;
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  juz: number;
  isRequired: boolean;
};

type Student = {
  studentId: string;
  fullName: string;
  scores: { surahId: string; score: number | null }[];
};

type SummativeGridProps = {
  action: (formData: FormData) => Promise<void>;
  targets: Target[];
  students: Student[];
  semester: string;
  classLevel: string;
  academicYear: string;
};

export default function SummativeGrid({
  action,
  targets,
  students,
  semester,
  classLevel,
  academicYear,
}: SummativeGridProps) {
  const t = useTranslations("Summative");

  const classOptions = [
    { value: "7", label: t("grade7") },
    { value: "8", label: t("grade8") },
    { value: "9", label: t("grade9") },
  ];

  const semesterOptions = [
    { value: "GANJIL", label: t("ganjil") },
    { value: "GENAP", label: t("genap") },
  ];

  return (
    <>
      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("classLabel")}
          </label>
          <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {classOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/summative?semester=${semester}&classLevel=${opt.value}`}
                className={`px-4 py-2 text-sm font-medium transition first:rounded-l-2xl last:rounded-r-2xl ${
                  classLevel === opt.value
                    ? "bg-emerald-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("semesterLabel")}
          </label>
          <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {semesterOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/summative?semester=${opt.value}&classLevel=${classLevel}`}
                className={`px-4 py-2 text-sm font-medium transition first:rounded-l-2xl last:rounded-r-2xl ${
                  semester === opt.value
                    ? "bg-emerald-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          {t("targetCount", { count: targets.length })}
        </span>

        <a
          className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          href={`/api/reports/export-summative?semester=${semester}&classLevel=${classLevel}`}
        >
          <Download aria-hidden="true" size={16} strokeWidth={2.2} />
          {t("exportExcel")}
        </a>
      </section>

      {targets.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          <p className="font-medium">{t("noTargets")}</p>
          <p className="mt-1">{t("noTargetsDescription")}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          <p className="font-medium">{t("noStudents")}</p>
        </div>
      ) : (
        <form action={action} className="mt-6">
          <input type="hidden" name="semester" value={semester} />
          <input type="hidden" name="academicYear" value={academicYear} />
          <input type="hidden" name="classLevel" value={classLevel} />

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {t("colStudent")}
                  </th>
                  {targets.map((tgt) => (
                    <th
                      key={tgt.surahId}
                      className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300"
                      title={`${tgt.name} - Juz ${tgt.juz}`}
                    >
                      <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                        {tgt.arabicName}
                      </span>
                      <span className="block mt-0.5">{tgt.number}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {t("colAverage")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rowIdx) => {
                  const studentScores = student.scores;
                  const scoreMap = new Map(
                    studentScores.map((score) => [score.surahId, score.score]),
                  );
                  const validScores = studentScores
                    .map((s) => s.score)
                    .filter((s): s is number => s !== null);
                  const avg =
                    validScores.length > 0
                      ? Math.round(
                          (validScores.reduce((a, b) => a + b, 0) /
                            validScores.length) *
                            10,
                        ) / 10
                      : null;

                  return (
                    <tr
                      key={student.studentId}
                      className={
                        rowIdx % 2 === 0
                          ? "border-b border-slate-100 dark:border-slate-800"
                          : "border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                      }
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-medium text-slate-950 dark:text-white">
                        {student.fullName}
                      </td>
                      {targets.map((tgt) => {
                        const key = `${student.studentId}__${tgt.surahId}`;
                        const currentScore = scoreMap.get(tgt.surahId) ?? null;
                        const inputId = `score_${key}`;

                        return (
                          <td key={tgt.surahId} className="px-1 py-1 text-center">
                            <input
                              id={inputId}
                              name={`score_${key}`}
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={
                                currentScore !== null && currentScore !== undefined
                                  ? currentScore
                                  : ""
                              }
                              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-900"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            avg !== null
                              ? avg >= 85
                                ? "font-semibold text-emerald-700 dark:text-emerald-400"
                                : avg >= 70
                                  ? "font-semibold text-amber-700 dark:text-amber-400"
                                  : "font-semibold text-red-700 dark:text-red-400"
                              : "text-slate-400"
                          }
                        >
                          {avg ?? "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("studentCount", { count: students.length })} &middot;{" "}
              {t("surahCount", { count: targets.length })}
            </p>
            <SubmitButton />
          </div>
        </form>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Summative");

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (
        <Loader2 aria-hidden="true" size={16} className="animate-spin" />
      ) : (
        <Save aria-hidden="true" size={16} strokeWidth={2.2} />
      )}
      {pending ? t("saving") : t("saveButton")}
    </button>
  );
}
