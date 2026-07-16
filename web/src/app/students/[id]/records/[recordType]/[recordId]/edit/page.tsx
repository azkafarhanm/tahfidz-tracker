import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Hash,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import { getStudentFormContext } from "@/lib/students";
import { getRecordData } from "@/lib/records";
import { updateRecord } from "@/lib/record-actions";
import { requireSessionScope } from "@/lib/session";
import JuzFilteredSurahInput from "@/components/JuzFilteredSurahInput";
import NumericInput from "@/components/NumericInput";
import AutoRecordStatusField from "@/components/AutoRecordStatusField";
import DeviceDateTimeFields from "@/components/DeviceDateTimeFields";
import FormAlert from "@/components/FormAlert";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { getTranslations } from "next-intl/server";
import { backLink } from "@/lib/colors";
import EditRecordForm, { EditRecordSaveButton } from "./EditRecordForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EditRecordPageProps = {
  params: Promise<{
    id: string;
    recordType: "hafalan" | "murojaah";
    recordId: string;
  }>;
  searchParams?: Promise<{ error?: string; returnTo?: string }>;
};

export async function generateMetadata({ params }: EditRecordPageProps) {
  const { recordType } = await params;
  const t = await getTranslations("RecordForm");
  const typeLabel =
    recordType === "hafalan" ? t("typeHafalan") : t("typeMurojaah");
  return {
    title: `${t("titleEdit", { type: typeLabel })} - TahfidzFlow`,
  };
}

export default async function EditRecordPage({
  params,
  searchParams,
}: EditRecordPageProps) {
  const t = await getTranslations("RecordForm");
  const { id, recordType, recordId } = await params;
  const { teacherId, isAdmin } = await requireSessionScope();
  const query = await searchParams;
  const returnTo =
    query?.returnTo && query.returnTo.startsWith("/") && !query.returnTo.startsWith("//")
      ? query.returnTo
      : undefined;

  const [record, student] = await Promise.all([
    getRecordData(recordId, recordType, isAdmin ? null : teacherId),
    getStudentFormContext(id, teacherId),
  ]);

  if (!record || !student) {
    notFound();
  }

  if (record.studentId !== student.id) {
    redirect(`/students/${id}`);
  }

  const action = updateRecord.bind(null, student.id, recordType, recordId, returnTo);
  const Icon = recordType === "hafalan" ? BookOpen : RotateCcw;
  const typeLabel =
    recordType === "hafalan" ? t("typeHafalan") : t("typeMurojaah");
  const sectionTitle =
    recordType === "hafalan"
      ? t("sectionMaterial")
      : t("sectionMaterialMurojaah");

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <WorkflowContextLink
              className={backLink}
              href={returnTo ?? `/students/${student.id}`}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {student.fullName}
            </WorkflowContextLink>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("titleEdit", { type: typeLabel })}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {record.surah} {record.fromAyah}-{record.toAyah}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PencilLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {query?.error ? <FormAlert message={query.error} /> : null}

        <EditRecordForm
          action={action}
          className="mt-6 space-y-4"
          currentType={recordType}
          labels={{
            hafalan: t("typeHafalan"),
            murojaah: t("typeMurojaah"),
            confirmTitle: t("conversionConfirmTitle"),
            confirmDescription: t.raw("conversionConfirmDescription"),
            cancel: t("buttonCancel"),
            confirm: t("conversionConfirmButton"),
            processing: t("conversionProcessing"),
          }}
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <Icon
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{sectionTitle}</h2>
            </div>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("labelActivityType")}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["hafalan", "murojaah"] as const).map((type) => (
                  <label
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:has-checked:border-emerald-500 dark:has-checked:bg-emerald-950/40 dark:has-checked:text-emerald-300"
                    key={type}
                  >
                    <input
                      className="h-4 w-4 accent-emerald-800"
                      defaultChecked={recordType === type}
                      name="activityType"
                      type="radio"
                      value={type}
                    />
                    {type === "hafalan" ? t("typeHafalan") : t("typeMurojaah")}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="surah">
                {t("labelSurah")}
              </label>
              <div className="mt-2">
                <JuzFilteredSurahInput
                  defaultFromAyah={record.fromAyah}
                  defaultValue={record.surah}
                  id="surah"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelFromAyah")}
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900/30">
                  <Hash
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 dark:text-slate-500"
                    size={16}
                    strokeWidth={2.2}
                  />
                  <NumericInput
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                    defaultValue={record.fromAyah}
                    maxLength={3}
                    name="fromAyah"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("labelToAyah")}
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900/30">
                  <Hash
                    aria-hidden="true"
                    className="shrink-0 text-slate-400 dark:text-slate-500"
                    size={16}
                    strokeWidth={2.2}
                  />
                  <NumericInput
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
                    defaultValue={record.toAyah}
                    maxLength={3}
                    name="toAyah"
                    required
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("sectionAssessment")}</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AutoRecordStatusField
                defaultScore={record.score}
                placeholder={t("placeholderOptional")}
                scoreLabel={t("labelScore")}
                statusLabel={t("labelStatus")}
              />
            </div>

            <DeviceDateTimeFields
              dateLabel={t("labelDate")}
              initialDateTimeIso={record.dateTimeIso}
              preserveInitialTime
              timeLabel={t("labelTime")}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <ClipboardList
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("labelNotes")}</h2>
            </div>

            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/30"
              defaultValue={record.notes}
              name="notes"
              placeholder={t("placeholderOptional")}
            />
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <WorkflowContextLink
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              href={returnTo ?? `/students/${student.id}`}
            >
              {t("buttonCancel")}
            </WorkflowContextLink>
            <EditRecordSaveButton
              saveLabel={t("buttonSave")}
              savingLabel={t("buttonSaving")}
            />
          </div>
        </EditRecordForm>
      </section>
    </main>
  );
}
