import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Mail,
  Phone,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteTeacher, toggleTeacherActive } from "./actions";
import { getAdminTeachersData } from "@/lib/admin";
import InitialsAvatar from "@/components/InitialsAvatar";
import LiveSearchForm from "@/components/LiveSearchForm";
import InlineConfirmActionButton from "@/components/InlineConfirmActionButton";
import AdminDeleteButton from "@/components/AdminDeleteButton";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("AdminTeachers");
  return { title: `${t("heading")} - Admin - TahfidzFlow` };
}

type AdminTeachersPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminTeachersPage({
  searchParams,
}: AdminTeachersPageProps) {
  const t = await getTranslations("AdminTeachers");
  const validationT = await getTranslations("Validation");
  const locale = await getLocale();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const page = parsePage(params?.page);
  const { counts, teachers, pagination } = await getAdminTeachersData(
    query,
    locale,
    page,
    PAGE_SIZE,
  );
  const buildPageHref = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    const search = nextParams.toString();
    return search ? `/admin/teachers?${search}` : "/admin/teachers";
  };
  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

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
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("heroLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {counts.filteredTeacherCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {query
                  ? t("heroSearchResult", { query })
                  : t("heroSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("heroActiveLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {counts.activeTeacherCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statTotalLabel")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.teacherCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statTotalSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("badgeAktif")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.activeTeacherCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statAktifSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("badgeNonaktif")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.inactiveTeacherCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statNonaktifSubtext")}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("statFilteredLabel")}</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.filteredTeacherCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("statFilteredSubtext")}</p>
          </article>
        </section>

        <LiveSearchForm
          action="/admin/teachers"
          buttonLabel={t("searchButton")}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:focus-within:ring-emerald-400/20"
          defaultValue={query}
          inputClassName="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          placeholder={t("searchPlaceholder")}
        />

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("listHeading")}</h2>
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin/teachers/new"
              >
                <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                {t("addButton")}
              </Link>
              {query ? (
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  href="/admin/teachers"
                >
                  {t("resetSearch")}
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {teachers.length}/{counts.filteredTeacherCount}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.length > 0 ? (
              teachers.map((teacher) => {
                const deleteBlockers = [
                  teacher.studentCount > 0
                    ? validationT("teacherHasStudents", {
                        name: teacher.fullName,
                        count: teacher.studentCount,
                      })
                    : null,
                  teacher.classGroupCount > 0
                    ? validationT("teacherHasClassGroups", {
                        name: teacher.fullName,
                        count: teacher.classGroupCount,
                      })
                    : null,
                ].filter(Boolean);
                const deleteDisabledReason =
                  deleteBlockers.length > 0 ? deleteBlockers.join(" ") : undefined;

                return (
                  <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-700"
                  key={teacher.id}
                >
                  <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0">
                       <div className="flex items-center gap-3">
                         <InitialsAvatar name={teacher.fullName} />
                         <p className="truncate font-semibold text-slate-950 dark:text-white">
                           {teacher.fullName}
                         </p>
                       </div>
                       <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                         {t("joinedLabel", { date: teacher.joinedAt })}
                       </p>
                     </div>
                    <span
                      className={
                        teacher.isActive
                          ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                          : "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-400"
                      }
                    >
                      {teacher.isActive ? t("badgeAktif") : t("badgeNonaktif")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Mail
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">{teacher.email}</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Phone
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span>{teacher.phoneNumber ?? t("phoneNotSet")}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("studentLabel")}</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <Users aria-hidden="true" size={16} strokeWidth={2.2} />
                        {teacher.studentCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("halaqahLabel")}</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <BookOpen
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {teacher.classGroupCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                      href={`/admin/teachers/${teacher.id}/edit`}
                    >
                      <PencilLine
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {t("editButton")}
                    </Link>
                    {teacher.isActive ? (
                      <InlineConfirmActionButton
                        cancelLabel={t("cancelDeleteButton")}
                        confirmLabel={t("confirmDeactivateButton")}
                        confirmMessage={t("confirmDeactivateMessage", {
                          name: teacher.fullName,
                        })}
                        label={t("deactivateButton")}
                        onAction={toggleTeacherActive.bind(null, teacher.id, false)}
                        pendingLabel={t("deactivatingButton")}
                        showSuccessToast={false}
                        tone="warning"
                      />
                    ) : (
                      <form action={toggleTeacherActive.bind(null, teacher.id, true)}>
                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-800"
                          type="submit"
                        >
                          {t("activateButton")}
                        </button>
                      </form>
                    )}
                    <AdminDeleteButton
                      action={deleteTeacher.bind(null, teacher.id)}
                      cancelLabel={t("cancelDeleteButton")}
                      confirmLabel={t("confirmDeleteButton")}
                      confirmMessage={t("confirmDeleteMessage", {
                        name: teacher.fullName,
                      })}
                      deletingLabel={t("deletingButton")}
                      dialogTitle={t("deleteDialogTitle")}
                      disabled={Boolean(deleteDisabledReason)}
                      disabledReason={deleteDisabledReason}
                      label={t("deleteButton")}
                    />
                  </div>
                </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-3 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                {query
                  ? t("emptySearch")
                  : t("emptyNoData")}
              </div>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {hasPreviousPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(pagination.page - 1)}
                >
                  <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {pagination.page} / {pagination.totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(pagination.page + 1)}
                >
                  <ChevronRight aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
            </div>
          ) : null}
        </section>
    </>
  );
}
