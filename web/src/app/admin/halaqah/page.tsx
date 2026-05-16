import Link from "next/link";
import {
  ArrowLeft,
  PencilLine,
  PlusCircle,
  Search,
  Users,
  BookOpen,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { toggleClassGroupActive } from "./actions";
import { getAdminClassGroupsData } from "@/lib/admin";


export const runtime = "nodejs";
export const revalidate = 30;

export async function generateMetadata() {
  const t = await getTranslations("AdminHalaqah");
  return { title: `${t("heading")} - Admin - TahfidzFlow` };
}

type AdminHalaqahPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
  }>;
};

export default async function AdminHalaqahPage({
  searchParams,
}: AdminHalaqahPageProps) {
  const t = await getTranslations("AdminHalaqah");

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const { counts, classGroups } = await getAdminClassGroupsData(query);

  return (
    <>
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href="/admin"
            >
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
            <Users aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        {params?.success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            {params.success}
          </div>
        ) : null}

        {params?.error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
            {params.error}
          </div>
        ) : null}

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("heroLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {counts.filteredCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {query
                  ? t("heroSearchResult", { query })
                  : t("heroSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("badgeAktif")}</p>
              <p className="mt-1 text-xl font-semibold">
                {counts.activeCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statTotalLabel")}</p>
            <p className="mt-2 text-2xl font-semibold">{counts.totalCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statTotalSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("badgeAktif")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.activeCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statAktifSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("badgeNonaktif")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.inactiveCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statNonaktifSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statFilteredLabel")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.filteredCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statFilteredSubtext")}</p>
          </article>
        </section>

        <form
          action="/admin/halaqah"
          autoComplete="off"
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none"
        >
          <Search aria-hidden="true" size={18} strokeWidth={2.2} />
          <input
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
             className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            defaultValue={query}
            enterKeyHint="search"
            name="q"
            placeholder={t("searchPlaceholder")}
            spellCheck={false}
            type="search"
          />
          <button
            className="rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
            type="submit"
          >
            {t("searchButton")}
          </button>
        </form>

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("listHeading")}</h2>
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin/halaqah/new"
              >
                <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                {t("addButton")}
              </Link>
              {query ? (
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  href="/admin/halaqah"
                >
                  {t("resetSearch")}
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {t("visibleCount", { count: counts.filteredCount })}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {classGroups.length > 0 ? (
              classGroups.map((classGroup) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-800"
                  key={classGroup.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">
                        {classGroup.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t("teacherLabel")} {classGroup.teacherName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {classGroup.gradeLabel} - {classGroup.academicYear}
                      </p>
                    </div>
                    <span
                      className={
                        classGroup.isActive
                          ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                          : "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                      }
                    >
                      {classGroup.isActive ? t("badgeAktif") : t("badgeNonaktif")}
                    </span>
                  </div>

                  {classGroup.description ? (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
                      {classGroup.description}
                    </p>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("levelLabel")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                        {classGroup.level}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("studentLabel")}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <BookOpen
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {classGroup.studentCount}
                      </p>
                    </div>
                  </div>

                  {!classGroup.teacherIsActive && classGroup.isActive ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                      {t("inactiveTeacherWarning")}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                      href={`/admin/halaqah/${classGroup.id}/edit`}
                    >
                      <PencilLine
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {t("editButton")}
                    </Link>
                    <form
                      action={toggleClassGroupActive.bind(
                        null,
                        classGroup.id,
                        !classGroup.isActive,
                      )}
                    >
                      <button
                        className={
                          classGroup.isActive
                            ? "inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-100 px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
                            : "inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
                        }
                        type="submit"
                      >
                        {classGroup.isActive ? t("deactivateButton") : t("activateButton")}
                      </button>
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-3 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
                {query
                  ? t("emptySearch")
                  : t("emptyNoData")}
              </div>
            )}
          </div>
        </section>
    </>
  );
}
