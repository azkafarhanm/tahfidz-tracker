"use client";

import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { Semester } from "@/generated/prisma-next/enums";
import DeviceDateTimeFields from "@/components/DeviceDateTimeFields";
import SurahInput from "@/components/SurahInput";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { markServerActionReturn } from "@/hooks/usePanelScrollRestoration";
import NumericScoreInput from "@/components/NumericScoreInput";

type SummativeAssessmentFormProps = {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  returnTo?: string;
  studentId: string;
  academicYear: string;
  defaultSemester: Semester;
  defaultSurah?: string;
  defaultScore?: number;
  defaultNotes?: string | null;
  defaultDateTimeIso?: string;
  assessmentId?: string;
};

export default function SummativeAssessmentForm({
  action,
  cancelHref,
  returnTo,
  studentId,
  academicYear,
  defaultSemester,
  defaultSurah,
  defaultScore,
  defaultNotes,
  defaultDateTimeIso,
  assessmentId,
}: SummativeAssessmentFormProps) {
  const t = useTranslations("Summative");

  return (
    <form action={action} className="space-y-5" onSubmit={() => markServerActionReturn()}>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="academicYear" value={academicYear} />
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}
      {assessmentId ? (
        <input type="hidden" name="assessmentId" value={assessmentId} />
      ) : null}

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="semester"
            >
              {t("semesterLabel")}
            </label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              defaultValue={defaultSemester}
              id="semester"
              name="semester"
              required
            >
              <option value={Semester.GANJIL}>{t("ganjil")}</option>
              <option value={Semester.GENAP}>{t("genap")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("academicYearLabel")}
            </label>
            <div className="flex min-h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {academicYear}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="surah"
            >
              {t("surahLabel")}
            </label>
            <SurahInput defaultValue={defaultSurah} id="surah" />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="score"
            >
              {t("scoreLabel")}
            </label>
            <NumericScoreInput
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              defaultValue={defaultScore ?? ""}
              id="score"
              name="score"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="notes"
            >
              {t("notesLabel")}
            </label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              defaultValue={defaultNotes ?? ""}
              id="notes"
              name="notes"
              placeholder={t("notesPlaceholder")}
            />
          </div>

          <div className="sm:col-span-2">
            <DeviceDateTimeFields
              dateLabel={t("dateLabel")}
              initialDateTimeIso={defaultDateTimeIso}
              timeLabel={t("timeLabel")}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <WorkflowContextLink
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          href={cancelHref}
        >
          {t("cancelButton")}
        </WorkflowContextLink>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Summative");

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <Save aria-hidden="true" className="h-4 w-4" />
      )}
      {pending ? t("savingButton") : t("saveAssessmentButton")}
    </button>
  );
}
