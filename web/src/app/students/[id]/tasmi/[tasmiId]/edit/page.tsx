import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Save, Trash2 } from "lucide-react";
import { updateTasmiAction, deleteTasmiAction } from "../../actions";
import { tasmiGradeOptions, tasmiStatusOptions, tasmiGradeLabels } from "@/lib/tasmi";
import { getTasmiRecordForEdit } from "@/lib/tasmi";
import { requireSessionScope } from "@/lib/session";
import FormAlert from "@/components/FormAlert";
import DeviceDateTimeFields from "@/components/DeviceDateTimeFields";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { getTranslations } from "next-intl/server";
import { backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EditTasmiPageProps = {
  params: Promise<{ id: string; tasmiId: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("TasmiForm");
  return { title: `${t("titleEdit")} - TahfidzFlow` };
}

export default async function EditTasmiPage({ params, searchParams }: EditTasmiPageProps) {
  const t = await getTranslations("TasmiForm");
  const tValidation = await getTranslations("Validation");
  const { id, tasmiId } = await params;
  const { teacherId } = await requireSessionScope();
  const error = (await searchParams)?.error;

  const record = await getTasmiRecordForEdit(tasmiId, teacherId);
  if (!record || record.student.id !== id) {
    notFound();
  }

  const action = updateTasmiAction.bind(null, tasmiId, id);
  const deleteAction = deleteTasmiAction.bind(null, tasmiId, id);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link className={backLink} href={`/students/${id}`}>
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("titleEdit")}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
              {record.student.fullName} - Tasmi&apos; Juz {record.juz} ({tasmiGradeLabels[record.grade]})
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-900 text-white shadow-lg shadow-violet-900/20">
            <Award aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? <FormAlert message={error} /> : null}

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Award
                aria-hidden="true"
                className="text-violet-800 dark:text-violet-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("sectionAssessment")}</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelJuz")}
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
                  defaultValue={record.juz}
                  name="juz"
                  required
                >
                  {Array.from({ length: 30 }, (_, i) => 30 - i).map((j) => (
                    <option key={j} value={j}>Juz {j}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelGrade")}
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
                  defaultValue={record.grade}
                  name="grade"
                  required
                >
                  {tasmiGradeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelStatus")}
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
                  defaultValue={record.status}
                  name="status"
                  required
                >
                  {tasmiStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelExaminer")}
                </span>
                <input
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
                  defaultValue={record.examinerName}
                  maxLength={120}
                  name="examinerName"
                  placeholder={t("placeholderExaminer")}
                  required
                  type="text"
                />
              </label>
            </div>

            <DeviceDateTimeFields
              dateLabel={t("labelDate")}
              timeLabel=""
              initialDateTimeIso={record.date.toISOString()}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <h2 className="font-semibold">{t("labelNotes")}</h2>
            <textarea
              className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
              defaultValue={record.notes ?? ""}
              name="notes"
              placeholder={t("placeholderNotes")}
            />
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href={`/students/${id}`}
            >
              {t("buttonCancel")}
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              {t("buttonSaveEdit")}
            </button>
          </div>
        </form>

        <section className="mt-8 rounded-2xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900/50 dark:bg-slate-900 dark:shadow-none">
          <h2 className="font-semibold text-red-800 dark:text-red-300">{t("sectionDelete")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("deleteConfirm", { juz: record.juz })}
          </p>
          <div className="mt-3">
            <ConfirmActionDialogButton
              cancelLabel={tValidation("cancel")}
              confirmLabel={t("deleteButton")}
              confirmMessage={t("deleteConfirm", { juz: record.juz })}
              dialogTitle={t("sectionDelete")}
              icon={<Trash2 aria-hidden="true" size={12} strokeWidth={2.2} />}
              label={t("deleteButton")}
              onAction={deleteAction}
              pendingLabel={tValidation("deleting")}
              tone="danger"
            />
          </div>
        </section>
      </section>
    </main>
  );
}
