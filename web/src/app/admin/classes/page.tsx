import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PencilLine,
  PlusCircle,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { deleteAcademicClass, toggleAcademicClassActive } from "./actions";
import { getAdminAcademicClassesData } from "@/lib/admin";
import AdminDeleteButton from "@/components/AdminDeleteButton";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import ScrollToHighlightedItem from "@/components/ScrollToHighlightedItem";
import LiveSearchForm from "@/components/LiveSearchForm";
import ProgramSelector from "@/components/ProgramSelector";
import { UserX, RotateCcw } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { actionButtonClass } from "@/components/action-button-styles";
import { badge, statCard, statValue, statLabel, widget, heroSummary, backLink } from "@/lib/colors";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels, programTypeOptions } from "@/lib/format";


export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("AdminClasses");
  return { title: `${t("heading")} - Admin - TahfidzFlow` };
}

type AdminClassesPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
    page?: string;
    programType?: string;
    highlight?: string;
  }>;
};

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminClassesPage({
  searchParams,
}: AdminClassesPageProps) {
  const t = await getTranslations("AdminClasses");

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const page = parsePage(params?.page);
  const programType = (params?.programType as ProgramType) || ProgramType.ACADEMIC;
  const { counts, academicClasses, pagination } = await getAdminAcademicClassesData(
    query,
    page,
    PAGE_SIZE,
    programType,
    params?.highlight,
  );
  const buildPageHref = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    if (programType) nextParams.set("programType", programType);
    const search = nextParams.toString();
    return search ? `/admin/classes?${search}` : "/admin/classes";
  };
  const buildWorkflowHref = (path: string) => {
    const context = new URLSearchParams({ programType });
    if (query) context.set("q", query);
    if (pagination.page > 1) context.set("page", String(pagination.page));
    return `${path}?${context.toString()}`;
  };
  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <>
        <ScrollToHighlightedItem />
        <header className="flex items-center justify-between gap-4">
          <div>
             <Link
               className={backLink}
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
            <div className="mt-3">
              <ProgramSelector
                programs={programTypeOptions.map((o) => o.value)}
                programTypeLabels={programTypeLabels}
                currentProgramType={programType ?? ProgramType.ACADEMIC}
              />
            </div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <GraduationCap aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
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
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.summary}`}>
            <p className={`text-xs font-medium ${statLabel.summary}`}>{t("statTotalLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.summary}`}>{counts.totalCount}</p>
            <p className={`mt-1 text-xs ${statLabel.summary}`}>{t("statTotalSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("badgeAktif")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>
              {counts.activeCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.success}`}>{t("statAktifSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.neutral}`}>
            <p className={`text-xs font-medium ${statLabel.neutral}`}>{t("badgeNonaktif")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.neutral}`}>
              {counts.inactiveCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.neutral}`}>{t("statNonaktifSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.info}`}>
            <p className={`text-xs font-medium ${statLabel.info}`}>{t("statFilteredLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.info}`}>
              {counts.filteredCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.info}`}>{t("statFilteredSubtext")}</p>
          </article>
        </section>

        <LiveSearchForm
          action={`/admin/classes?programType=${programType}`}
          buttonLabel={t("searchButton")}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none"
          defaultValue={query}
          inputClassName="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          placeholder={t("searchPlaceholder")}
        />

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("listHeading")}</h2>
            <div className="flex items-center gap-2">
              <WorkflowContextLink
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href={buildWorkflowHref("/admin/classes/new")}
              >
                <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                {t("addButton")}
              </WorkflowContextLink>
              {query ? (
                <WorkflowContextLink
                   className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                   href="/admin/classes?q="
                   compatibilityKeys={["programType"]}
                   preferStoredContext
                   restoreContext
                   prefetch
                   scroll={false}
                 >
                  {t("resetSearch")}
                </WorkflowContextLink>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
                {academicClasses.length}/{counts.filteredCount}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {academicClasses.length > 0 ? (
              academicClasses.map((academicClass) => (
                  <article
                    data-highlight={academicClass.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-800"
                  key={academicClass.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">
                        {academicClass.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t("academicYearLabel")} {academicClass.academicYear}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${academicClass.isActive ? badge.success : badge.warning}`}
                    >
                      {academicClass.isActive ? t("badgeAktif") : t("badgeNonaktif")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl p-3 ${widget.elevated}`}>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("gradeLabel")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                        {academicClass.grade}
                      </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${widget.elevated}`}>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("studentLabel")}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <Users
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {academicClass.studentCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <WorkflowContextLink
                      className={actionButtonClass("neutral")}
                      href={buildWorkflowHref(`/admin/classes/${academicClass.id}/edit`)}
                    >
                      <PencilLine
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {t("editButton")}
                    </WorkflowContextLink>
                    {academicClass.isActive ? (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancelDeleteButton")}
                        confirmLabel={t("confirmDeactivateButton")}
                        confirmMessage={t("confirmDeactivateMessage", {
                          name: academicClass.name,
                        })}
                        dialogTitle={t("deactivateButton")}
                        icon={<UserX aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("deactivateButton")}
                        onAction={toggleAcademicClassActive.bind(null, academicClass.id, false)}
                        pendingLabel={t("deactivatingButton")}
                        showSuccessToast={false}
                        tone="warning"
                      />
                    ) : (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancelDeleteButton")}
                        confirmLabel={t("confirmActivateButton")}
                        confirmMessage={t("confirmActivateMessage", {
                          name: academicClass.name,
                        })}
                        dialogTitle={t("activateButton")}
                        icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("activateButton")}
                        onAction={toggleAcademicClassActive.bind(null, academicClass.id, true)}
                        pendingLabel={t("activatingButton")}
                        showSuccessToast={false}
                        tone="success"
                      />
                    )}
                    <AdminDeleteButton
                      action={deleteAcademicClass.bind(null, academicClass.id)}
                      cancelLabel={t("cancelDeleteButton")}
                      confirmLabel={t("confirmDeleteButton")}
                      confirmMessage={t("confirmDeleteMessage", {
                        name: academicClass.name,
                      })}
                      deletingLabel={t("deletingButton")}
                      disabled={academicClass.studentCount > 0}
                      disabledReason={
                        academicClass.studentCount > 0
                          ? t("deleteBlockedByStudents", {
                              count: academicClass.studentCount,
                            })
                          : undefined
                      }
                      label={t("deleteButton")}
                    />
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

          {pagination.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {hasPreviousPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(pagination.page - 1)}
                  prefetch
                  scroll={false}
                >
                  <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.neutral}`}>
                {pagination.page} / {pagination.totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(pagination.page + 1)}
                  prefetch
                  scroll={false}
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
