import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  getLiveInactiveStudentsData,
  getLiveStudentsPageData,
} from "@/lib/students-page-live";
import ActiveStudentCard from "@/components/ActiveStudentCard";
import AcademicGradeFilter from "@/components/AcademicGradeFilter";
import AppShell from "@/components/AppShell";
import InactiveStudentsSection from "@/components/InactiveStudentsSection";
import LiveSearchForm from "@/components/LiveSearchForm";
import OptimisticNumber from "@/components/OptimisticNumber";
import ScrollToHighlightedItem from "@/components/ScrollToHighlightedItem";
import StudentsPageAutoRefresh from "@/components/StudentsPageAutoRefresh";
import StudentsStatusTabs from "@/components/StudentsStatusTabs";
import ActiveYearBadge from "@/components/ActiveYearBadge";
import ProgramSelector from "@/components/ProgramSelector";
import ProgramBadge from "@/components/ProgramBadge";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import PanelScrollLink from "@/components/PanelScrollLink";
import { requireSessionScope } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";
import { badge, heroSummary, backLink } from "@/lib/colors";
import { getActiveAcademicYear, getTeacherProgramContext } from "@/lib/academic-year";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels } from "@/lib/format";
import { matchesSearchText } from "@/lib/search";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Students");
  return { title: `${t("heading")} - TahfidzFlow` };
}

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
    page?: string;
    status?: string;
    programType?: string;
    dashboardShortcut?: string;
    highlight?: string;
    returnTo?: string;
    grade?: string;
  }>;
};

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const page = parsePage(params?.page);
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const status = params?.status === "inactive" && !isAdmin ? "inactive" : "active";
  const isInactiveView = status === "inactive";
  const fromProfile = params?.returnTo === "profile";
  const dashboardShortcut = params?.dashboardShortcut;

  // Program resolution
  const academicYear = await getActiveAcademicYear();
  const programContext = teacherId
    ? await getTeacherProgramContext(teacherId, academicYear)
    : { programs: [ProgramType.ACADEMIC, ProgramType.BOARDING], hasMultiple: true, resolvedProgramType: ProgramType.ACADEMIC };
  const requestedProgramType = params?.programType as ProgramType | undefined;
  const programType = programContext.programs.includes(requestedProgramType as ProgramType)
    ? (requestedProgramType as ProgramType)
    : programContext.resolvedProgramType;
  const selectedGrade = programType === ProgramType.ACADEMIC && ["7", "8", "9"].includes(params?.grade ?? "")
    ? Number(params?.grade) as 7 | 8 | 9
    : undefined;

  const studentPage = await getLiveStudentsPageData(query, teacherId, locale, page, PAGE_SIZE, programType, academicYear, params?.highlight, selectedGrade);
  // Only fetch inactive students when viewing the inactive tab
  const inactiveStudents = !isAdmin && isInactiveView ? await getLiveInactiveStudentsData(teacherId, programType, academicYear, selectedGrade) : [];
  let academicGradeCounts: Record<7 | 8 | 9, number> | undefined;
  if (programType === ProgramType.ACADEMIC) {
    if (isInactiveView) {
      const grades = await Promise.all([7, 8, 9].map((grade) =>
        getLiveInactiveStudentsData(teacherId, programType, academicYear, grade as 7 | 8 | 9),
      ));
      academicGradeCounts = { 7: grades[0].length, 8: grades[1].length, 9: grades[2].length };
    } else {
      const grades = await Promise.all([7, 8, 9].map((grade) =>
        getLiveStudentsPageData("", teacherId, locale, 1, 1, programType, academicYear, undefined, grade as 7 | 8 | 9),
      ));
      academicGradeCounts = { 7: grades[0].totalCount, 8: grades[1].totalCount, 9: grades[2].totalCount };
    }
  }
  const filteredInactiveStudents = query
    ? inactiveStudents.filter((student) => {
        return (
          matchesSearchText(student.fullName, query) ||
          matchesSearchText(student.classSummary, query)
        );
      })
    : inactiveStudents;
  const t = await getTranslations("Students");
  const buildPageHref = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    if (programType) nextParams.set("programType", programType);
    if (selectedGrade) nextParams.set("grade", String(selectedGrade));
    if (dashboardShortcut) nextParams.set("dashboardShortcut", dashboardShortcut);
    if (fromProfile) nextParams.set("returnTo", "profile");
    const search = nextParams.toString();
    return search ? `/students?${search}` : "/students";
  };
  const hasPreviousPage = studentPage.page > 1;
  const hasNextPage = studentPage.page < studentPage.totalPages;
  const searchActionParams = new URLSearchParams();
  if (isInactiveView) searchActionParams.set("status", "inactive");
  if (programType) searchActionParams.set("programType", programType);
  if (selectedGrade) searchActionParams.set("grade", String(selectedGrade));
  if (dashboardShortcut) searchActionParams.set("dashboardShortcut", dashboardShortcut);
  if (fromProfile) searchActionParams.set("returnTo", "profile");
  const searchAction = `/students?${searchActionParams.toString()}`;
  const resetSearchParams = new URLSearchParams();
  if (page > 1) resetSearchParams.set("page", String(page));
  if (isInactiveView) resetSearchParams.set("status", "inactive");
  if (programType) resetSearchParams.set("programType", programType);
  if (selectedGrade) resetSearchParams.set("grade", String(selectedGrade));
  if (dashboardShortcut) resetSearchParams.set("dashboardShortcut", dashboardShortcut);
  if (fromProfile) resetSearchParams.set("returnTo", "profile");
  const resetSearchHref = `/students?${resetSearchParams.toString()}`;
  const workflowParams = new URLSearchParams();
  if (query) workflowParams.set("q", query);
  if (page > 1) workflowParams.set("page", String(page));
  if (programType) workflowParams.set("programType", programType);
  if (selectedGrade) workflowParams.set("grade", String(selectedGrade));

  return (
    <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
        <StudentsPageAutoRefresh />
        <ScrollToHighlightedItem />
        <header className="flex items-center justify-between gap-4">
           <div>
            <PanelScrollLink
              className={backLink}
              href={fromProfile ? "/profile" : `/${programType ? `?programType=${programType}` : ""}`}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </PanelScrollLink>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("heading")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ActiveYearBadge />
              <ProgramBadge programType={programType} />
              {programContext.hasMultiple && (
                <ProgramSelector
                  programs={programContext.programs}
                  programTypeLabels={programTypeLabels}
                  currentProgramType={programType}
                  isolateParamsByProgram={["q", "page", "grade"]}
                  isolateScopeKey="studentsWorkspace"
                  isolateScopeSuffix={status}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href={`/admin/students?programType=${programType}`}
              >
                <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
                Kelola
              </Link>
            ) : null}
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <Users aria-hidden="true" size={22} strokeWidth={2.3} />
            </div>
          </div>
        </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">
                {isInactiveView ? t("inactiveHeading") : t("activeStudentsLabel")}
              </p>
              <p className="mt-3 text-4xl font-semibold">
                {isInactiveView
                  ? <OptimisticNumber value={inactiveStudents.length} field="inactive" />
                  : <OptimisticNumber value={studentPage.totalCount} field="active" />}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {isInactiveView ? t("inactiveDescription") : t("activeStudentsSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">
                {isInactiveView ? t("activeStudentsLabel") : t("needsReviewLabel")}
              </p>
              <p className="mt-1 text-xl font-semibold">
                {isInactiveView
                  ? <OptimisticNumber value={studentPage.totalCount} field="active" />
                  : studentPage.students.filter((student) => student.needsReview).length}
              </p>
            </div>
          </div>
        </section>

        {!isAdmin ? (
          <StudentsStatusTabs
            activeLabel={t("activeTab")}
            currentStatus={status}
            dashboardShortcut={dashboardShortcut}
            inactiveLabel={t("inactiveTab")}
            programType={programType}
            returnToProfile={fromProfile}
          />
        ) : null}

        {programType === ProgramType.ACADEMIC && academicGradeCounts ? (
          <AcademicGradeFilter
            counts={academicGradeCounts}
            href={searchAction}
            selectedGrade={selectedGrade}
            totalCount={academicGradeCounts[7] + academicGradeCounts[8] + academicGradeCounts[9]}
          />
        ) : null}

        <LiveSearchForm
          action={searchAction}
          buttonLabel={t("searchButton")}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-900"
          defaultValue={query}
          inputClassName="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder-slate-500"
          placeholder={t("searchPlaceholder")}
        />

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isInactiveView ? t("inactiveHeading") : t("listHeading")}
            </h2>
            <div className="flex items-center gap-2">
              {!isAdmin && !isInactiveView ? (
                <>
                  <WorkflowContextLink
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                    href={programContext.programs.length === 0
                      ? "/students/program-select"
                      : `/students/new?${workflowParams.toString()}`}
                  >
                    <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                    {t("addButton")}
                  </WorkflowContextLink>
                  {programContext.programs.length === 1 && (
                    <Link
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-600"
                      href={`/students/new?programType=${programContext.programs[0] === "ACADEMIC" ? "BOARDING" : "ACADEMIC"}`}
                    >
                      <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                      {programContext.programs[0] === "ACADEMIC" ? t("activateBoarding") : t("activateAcademic")}
                    </Link>
                  )}
                </>
              ) : null}
              {query ? (
                <WorkflowContextLink
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  contextParams={{ q: null }}
                  href={resetSearchHref}
                  prefetch
                  scroll={false}
                >
                  {t("resetSearch")}
                </WorkflowContextLink>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
                {isInactiveView
                  ? <><OptimisticNumber value={filteredInactiveStudents.length} field="inactive" />/<OptimisticNumber value={inactiveStudents.length} field="inactive" /> {t("inactiveCountBadge")}</>
                  : <><OptimisticNumber value={studentPage.students.length} field="active" />/<OptimisticNumber value={studentPage.totalCount} field="active" /> {t("activeCountBadge")}</>}
              </span>
            </div>
          </div>

          {!isInactiveView ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {studentPage.students.length > 0 ? (
                studentPage.students.map((student) => (
                  <ActiveStudentCard
                    activeTargetCount={student.activeTargetCount}
                    canManage={!isAdmin}
                    classSummary={student.classSummary}
                    fullName={student.fullName}
                    id={student.id}
                    key={student.id}
                    latestHafalan={student.latestHafalan}
                    latestMurojaah={student.latestMurojaah}
                    tasmiJuzSummary={student.tasmiJuzSummary}
                    needsReview={student.needsReview}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  {query ? t("emptySearch") : t("emptyNoStudents")}
                </div>
              )}
            </div>
          ) : (
            <InactiveStudentsSection
              emptyMessage={query ? t("emptyInactiveSearch") : t("emptyInactiveStudents")}
              showHeading={false}
              students={filteredInactiveStudents}
            />
          )}

          {!isInactiveView && studentPage.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {hasPreviousPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(studentPage.page - 1)}
                  prefetch
                  scroll={false}
                >
                  <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.neutral}`}>
                {studentPage.page} / {studentPage.totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(studentPage.page + 1)}
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

      </AppShell>
  );
}
