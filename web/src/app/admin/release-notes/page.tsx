import Link from "next/link";
import { ArrowLeft, FileText, Megaphone, PencilLine, PlusCircle, Send } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminReleaseNotes } from "@/lib/admin-release-notes";
import { getLocaleTag } from "@/lib/format";
import { backLink, badge } from "@/lib/colors";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("AdminReleaseNotes");
  return { title: `${t("heading")} - Admin - TahfidzFlow` };
}

export default async function AdminReleaseNotesPage() {
  const [t, locale, releaseNotes] = await Promise.all([
    getTranslations("AdminReleaseNotes"),
    getLocale(),
    getAdminReleaseNotes(),
  ]);
  const dateFormatter = new Intl.DateTimeFormat(getLocaleTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link className={backLink} href="/admin">
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backLink")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {t("heading")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("description")}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <Megaphone aria-hidden="true" size={22} strokeWidth={2.2} />
        </div>
      </header>

      <div className="mt-5 flex justify-end">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950" href="/admin/release-notes/new">
          <PlusCircle aria-hidden="true" size={17} strokeWidth={2.2} />
          {t("newDraft")}
        </Link>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t("drafts")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("draftsDescription")}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.warning}`}>
            {t("count", { count: releaseNotes.drafts.length })}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {releaseNotes.drafts.length > 0 ? releaseNotes.drafts.map((note) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none" key={note.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{note.title}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">{t("applicationVersion", { version: note.applicationVersion })}</p>
                </div>
                <FileText aria-hidden="true" className="shrink-0 text-amber-700 dark:text-amber-400" size={18} strokeWidth={2.2} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{note.summary}</p>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t("updatedAt", { date: dateFormatter.format(note.updatedAt) })}</p>
              <Link className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300" href={`/admin/release-notes/${note.id}/edit`}>
                <PencilLine aria-hidden="true" size={16} strokeWidth={2.2} />
                {t("editDraft")}
              </Link>
            </article>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-3 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">{t("emptyDrafts")}</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t("published")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("publishedDescription")}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
            {t("count", { count: releaseNotes.published.length })}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {releaseNotes.published.length > 0 ? releaseNotes.published.map((note) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none" key={note.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{note.title}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">{t("applicationVersion", { version: note.applicationVersion })}</p>
                </div>
                <Send aria-hidden="true" className="shrink-0 text-emerald-700 dark:text-emerald-400" size={18} strokeWidth={2.2} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{note.summary}</p>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t("publishedAt", { date: dateFormatter.format(note.publishedAt ?? note.createdAt) })}</p>
            </article>
          )) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-3 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">{t("emptyPublished")}</p>
          )}
        </div>
      </section>
    </>
  );
}
