"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, FileText, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import FormAlert from "@/components/FormAlert";
import ReleaseNotePresentation from "@/components/ReleaseNotePresentation";
import { backLink } from "@/lib/colors";

export type ReleaseNoteDraftValues = {
  applicationVersion: string;
  title: string;
  summary: string;
  content: string;
};

type ReleaseNoteDraftFormProps = {
  action: (formData: FormData) => Promise<void>;
  error?: string;
  submitLabel: string;
  title: string;
  values: ReleaseNoteDraftValues;
};

const inputClassName = "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:ring-emerald-900";

export default function ReleaseNoteDraftForm({ action, error, submitLabel, title, values }: ReleaseNoteDraftFormProps) {
  const t = useTranslations("AdminReleaseNotes");
  const [applicationVersion, setApplicationVersion] = useState(values.applicationVersion);
  const [noteTitle, setNoteTitle] = useState(values.title);
  const [summary, setSummary] = useState(values.summary);
  const [content, setContent] = useState(values.content);

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link className={backLink} href="/admin/release-notes">
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToReleaseNotes")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("draftDescription")}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <FileText aria-hidden="true" size={22} strokeWidth={2.2} />
        </div>
      </header>

      {error ? <FormAlert message={error} /> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form action={action} className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <FileText aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={18} strokeWidth={2.2} />
              <h2 className="font-semibold">{t("draftFields")}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("applicationVersionLabel")}</span>
              <input className={inputClassName} name="applicationVersion" onChange={(event) => setApplicationVersion(event.target.value)} placeholder={t("applicationVersionPlaceholder")} required type="text" value={applicationVersion} />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("titleLabel")}</span>
              <input className={inputClassName} name="title" onChange={(event) => setNoteTitle(event.target.value)} placeholder={t("titlePlaceholder")} required type="text" value={noteTitle} />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("summaryLabel")}</span>
              <textarea className={`${inputClassName} min-h-24 py-3`} name="summary" onChange={(event) => setSummary(event.target.value)} placeholder={t("summaryPlaceholder")} required value={summary} />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("contentLabel")}</span>
              <textarea className={`${inputClassName} min-h-48 py-3`} name="content" onChange={(event) => setContent(event.target.value)} placeholder={t("contentPlaceholder")} required value={content} />
            </label>
          </section>

          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950" type="submit">
            <Save aria-hidden="true" size={17} strokeWidth={2.2} />
            {submitLabel}
          </button>
        </form>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Eye aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={18} strokeWidth={2.2} />
            <h2 className="font-semibold">{t("preview")}</h2>
          </div>
          <ReleaseNotePresentation
            applicationVersion={applicationVersion || t("applicationVersionPlaceholder")}
            content={content || t("contentPlaceholder")}
            summary={summary || t("summaryPlaceholder")}
            title={noteTitle || t("titlePlaceholder")}
          />
        </section>
      </div>
    </>
  );
}
