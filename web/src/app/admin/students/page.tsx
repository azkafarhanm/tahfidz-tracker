import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PencilLine,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteStudent, toggleStudentActive } from "./actions";
import { getAdminStudentsData } from "@/lib/admin";
import AdminDeleteButton from "@/components/AdminDeleteButton";
import InitialsAvatar from "@/components/InitialsAvatar";
import LiveSearchForm from "@/components/LiveSearchForm";
import ProgramSelector from "@/components/ProgramSelector";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import ScrollToHighlightedItem from "@/components/ScrollToHighlightedItem";
import { UserX, RotateCcw } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { actionButtonClass } from "@/components/action-button-styles";
import { badge, statCard, statValue, statLabel, widget, heroSummary, backLink } from "@/lib/colors";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels, programTypeOptions } from "@/lib/format";


export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("AdminStudents");
  return { title: `${t("heading")} - Admin - TahfidzFlow` };
}

type AdminStudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
    page?: string;
    programType?: string;
  }>;
};

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  const t = await getTranslations("AdminStudents");
  const locale = await getLocale();

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const page = parsePage(params?.page);
  const programType = (params?.programType as ProgramType) || ProgramType.ACADEMIC;
  const { counts, students, pagination } = await getAdminStudentsData(
    query,
    locale,
    page,
    PAGE_SIZE,
    programType,
  );
  const buildPageHref = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    if (programType) nextParams.set("programType", programType);
    const search = nextParams.toString();
    return search ? `/admin/students?${search}` : "/admin/students";
  };
  // Carry the directory working-set filters onto the Edit link so the edit page
  // (and the server action on Save) can rebuild the directory URL. programType,
  // q, and page together define the current working set the admin returns to.
  const buildEditHref = (studentId: string) => {
    const params = new URLSearchParams();
    if (programType) params.set("programType", programType);
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    return `/admin/students/${studentId}/edit${search ? `?${search}` : ""}`;
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
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("heroLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {counts.filteredStudentCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {query ? t("heroSearchResult", { query }) : t("heroSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("heroActiveLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {counts.activeStudentCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.summary}`}>
            <p className={`text-xs font-medium ${statLabel.summary}`}>{t("statTotalLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.summary}`}>
              {counts.studentCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.summary}`}>{t("statTotalSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("badgeAktif")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>
              {counts.activeStudentCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.success}`}>{t("statAktifSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.neutral}`}>
            <p className={`text-xs font-medium ${statLabel.neutral}`}>{t("badgeNonaktif")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.neutral}`}>
              {counts.inactiveStudentCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.neutral}`}>{t("statNonaktifSubtext")}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.info}`}>
            <p className={`text-xs font-medium ${statLabel.info}`}>{t("statFilteredLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.info}`}>
              {counts.filteredStudentCount}
            </p>
            <p className={`mt-1 text-xs ${statLabel.info}`}>{t("statFilteredSubtext")}</p>
          </article>
        </section>

        <LiveSearchForm
          action={`/admin/students?programType=${programType}`}
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
                href={`/admin/students/new${programType ? `?programType=${programType}` : ""}`}
              >
                <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                {t("addButton")}
              </Link>
              {query ? (
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  href={`/admin/students?programType=${programType}&q=`}
                  prefetch
                  scroll={false}
                >
                  {t("resetSearch")}
                </Link>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
                {students.length}/{counts.filteredStudentCount}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {students.length > 0 ? (
              students.map((student) => {
                const deleteDisabledReason =
                  student.activeTargetCount > 0
                    ? t("deleteBlockedReason", {
                        items: t("deleteBlockedTargetItem", {
                          count: student.activeTargetCount,
                        }),
                      })
                    : undefined;

                return (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-700"
                    data-highlight={student.id}
                    key={student.id}
                  >
                  <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0">
                       <div className="flex items-center gap-3">
                         <InitialsAvatar name={student.fullName} />
                         <WorkflowContextLink
                           className="truncate font-semibold text-slate-950 transition hover:text-emerald-800 dark:text-white dark:hover:text-emerald-300"
                           href={`/admin/students/${student.id}`}
                         >
                           {student.fullName}
                         </WorkflowContextLink>
                       </div>
                       <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                         {student.gender} - {t("joinedLabel", { date: student.joinDate })}
                       </p>
                     </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${student.isActive ? badge.success : badge.warning}`}
                    >
                      {student.isActive ? t("badgeAktif") : t("badgeNonaktif")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                     <div className={`flex items-center gap-3 rounded-2xl p-3 text-sm text-slate-700 dark:text-slate-300 ${widget.elevated}`}>
                       <InitialsAvatar name={student.teacherName} size="sm" />
                       <span className="truncate">{student.teacherName}</span>
                     </div>
                    <div className={`flex items-center gap-3 rounded-2xl p-3 text-sm text-slate-700 dark:text-slate-300 ${widget.elevated}`}>
                      <BookOpen
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">
                        {student.halaqahLevel
                          ? `${student.halaqahName} (${student.halaqahLevel})`
                          : student.halaqahName}
                      </span>
                    </div>
                    <div className={`flex items-center gap-3 rounded-2xl p-3 text-sm text-slate-700 dark:text-slate-300 ${widget.elevated}`}>
                      <GraduationCap
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">
                        {student.academicClassName}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("activeTargetLabel")}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <Users aria-hidden="true" size={16} strokeWidth={2.2} />
                        {student.activeTargetCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("totalRecordLabel")}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <BookOpen
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {student.totalRecordCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t("summativeScoreLabel")}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                        <BookOpen
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {student.summativeScoreCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <WorkflowContextLink
                      className={actionButtonClass("neutral")}
                      href={buildEditHref(student.id)}
                    >
                      <PencilLine
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {t("editButton")}
                    </WorkflowContextLink>
                    {student.isActive ? (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancelDeleteButton")}
                        confirmLabel={t("confirmDeactivateButton")}
                        confirmMessage={t("confirmDeactivateMessage", {
                          name: student.fullName,
                        })}
                        dialogTitle={t("deactivateButton")}
                        icon={<UserX aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("deactivateButton")}
                        onAction={toggleStudentActive.bind(null, student.id, false)}
                        pendingLabel={t("deactivatingButton")}
                        showSuccessToast={false}
                        tone="warning"
                      />
                    ) : (
                      <ConfirmActionDialogButton
                        cancelLabel={t("cancelDeleteButton")}
                        confirmLabel={t("confirmActivateButton")}
                        confirmMessage={t("confirmActivateMessage", {
                          name: student.fullName,
                        })}
                        dialogTitle={t("activateButton")}
                        icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />}
                        label={t("activateButton")}
                        onAction={toggleStudentActive.bind(null, student.id, true)}
                        pendingLabel={t("activatingButton")}
                        showSuccessToast={false}
                        tone="success"
                      />
                    )}
                    <AdminDeleteButton
                      action={deleteStudent.bind(null, student.id)}
                      cancelLabel={t("cancelDeleteButton")}
                      confirmLabel={t("confirmDeleteButton")}
                      confirmMessage={t("confirmDeleteMessage", {
                        name: student.fullName,
                      })}
                      deletingLabel={t("deletingButton")}
                      disabled={student.deleteBlockingDataCount > 0}
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
