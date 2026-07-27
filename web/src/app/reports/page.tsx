import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookText,
  Download,
  FileText,
  ClipboardList,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  getReportAttendancePeriods,
  getTeacherReportData,
} from "@/lib/reports";
import AppShell from "@/components/AppShell";
import AttendanceSemesterFilter from "@/components/AttendanceSemesterFilter";
import ExportSection from "@/components/ExportSection";
import ProgramSelector from "@/components/ProgramSelector";
import ProgramBadge from "@/components/ProgramBadge";
import { requireSessionScope } from "@/lib/session";
import {
  getActiveAcademicYear,
  getSemesterForDate,
  getTeacherProgramContext,
} from "@/lib/academic-year";
import { badge, heroSummary, backLink } from "@/lib/colors";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels } from "@/lib/format";
import PanelScrollLink from "@/components/PanelScrollLink";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import AcademicReportProgress from "@/components/AcademicReportProgress";
import BoardingReportProgress from "@/components/BoardingReportProgress";
import {
  getAcademicReportViewModel,
  getReportViewModel,
} from "@/lib/report-view-model";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Reports");
  return {
    title: `${t("heading")} - TahfidzFlow`,
  };
}

type ReportsPageProps = {
  searchParams?: Promise<{
    attendancePeriod?: string;
    programType?: string;
  }>;
};

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Reports");
  const locale = await getLocale();

  if (isAdmin && !teacherId) {
    redirect("/admin/reports");
  }

  if (!teacherId) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
        <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 sm:max-w-3xl sm:px-8">
          <div className="text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-100 text-blue-900 shadow-lg">
              <BarChart3 size={28} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold">{t("adminOnlyHeading")}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t("adminOnlyDescription")}
            </p>
          </div>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/admin"
          >
            <ArrowLeft size={17} strokeWidth={2.3} />
            {t("adminPanelLink")}
          </Link>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const academicYear = await getActiveAcademicYear();
  const programContext = await getTeacherProgramContext(teacherId, academicYear);
  const requestedProgramType = params?.programType as ProgramType | undefined;
  const programType = programContext.programs.includes(requestedProgramType as ProgramType)
    ? (requestedProgramType as ProgramType)
    : programContext.resolvedProgramType;
  const reportView = getReportViewModel(programType);
  const academicReportView = reportView.kind === "academic"
    ? getAcademicReportViewModel({
        activeAcademicYear: academicYear,
        activeSemester: getSemesterForDate(new Date()),
        availablePeriods: await getReportAttendancePeriods(),
        formatPeriod: (period) =>
          t("attendanceSemesterOption", {
            academicYear: period.academicYear,
            semester:
              period.semester === "GANJIL"
                ? t("attendanceSemesterGanjil")
                : t("attendanceSemesterGenap"),
          }),
        requestedPeriod: params?.attendancePeriod,
      })
    : null;

  const data = academicReportView
    ? await getTeacherReportData(
        teacherId,
        locale,
        programType,
        academicYear,
        academicReportView.selectedPeriod.academicYear,
        academicReportView.selectedPeriod.semester,
      )
    : await getTeacherReportData(teacherId, locale, programType, academicYear);

  return (
    <AppShell currentPath="/reports" userName={session.user.name} isAdmin={isAdmin}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PanelScrollLink
              className={backLink}
              href={`/${programType ? `?programType=${programType}` : ""}`}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </PanelScrollLink>
            <h1 className="mt-3 text-2xl font-semibold">
              {t(reportView.labels.heading)}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t(reportView.labels.description)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ProgramBadge programType={programType} />
              {programContext.hasMultiple && (
                <ProgramSelector
                  programs={programContext.programs}
                  programTypeLabels={programTypeLabels}
                  currentProgramType={programType}
                />
              )}
              {academicReportView ? (
                <AttendanceSemesterFilter
                  availablePeriods={academicReportView.availablePeriods}
                  defaultActiveSemester={academicReportView.defaultActiveSemester}
                  label={t("attendanceSemesterFilterLabel")}
                  selectedPeriod={academicReportView.selectedPeriod}
                  selectedPeriodLabel={academicReportView.selectedPeriodLabel}
                />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportSection
              excelHref={`/api/reports/export-teacher?programType=${programType}`}
              excelClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
              excelContent={
                <>
                  <Download aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("excelButton")}
                </>
              }
              pdfHref={`/api/reports/pdf-teacher?programType=${programType}`}
              pdfClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
              pdfContent={
                <>
                  <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("pdfButton")}
                </>
              }
            />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <BarChart3 aria-hidden="true" size={22} strokeWidth={2.3} />
            </div>
          </div>
        </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t(reportView.labels.avgScore)}</p>
              <p className="mt-3 text-4xl font-semibold">{data.avgScore ?? "-"}</p>
              <p className="mt-1 text-sm text-slate-300">
                {t(reportView.labels.fromRecords, { count: data.totalHafalan + data.totalMurojaah })}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t(reportView.labels.needsReview)}</p>
              <p className="mt-1 text-xl font-semibold">{data.needsReviewCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl bg-slate-700 p-4 shadow-lg shadow-slate-900/20">
            <p className="text-xs font-medium text-white/80">{t("statActiveStudents")}</p>
            <p className="mt-2 text-2xl font-bold text-white">{data.studentCount}</p>
          </article>
          <article className="rounded-2xl bg-green-600 p-4 shadow-lg shadow-green-900/20">
            <p className="text-xs font-medium text-white/80">{t(reportView.labels.statHafalan)}</p>
            <p className="mt-2 text-2xl font-bold text-white">{data.totalHafalan}</p>
          </article>
          <article className="rounded-2xl bg-blue-600 p-4 shadow-lg shadow-blue-900/20">
            <p className="text-xs font-medium text-white/80">{t(reportView.labels.statMurojaah)}</p>
            <p className="mt-2 text-2xl font-bold text-white">{data.totalMurojaah}</p>
          </article>
          <article className="rounded-2xl bg-purple-600 p-4 shadow-lg shadow-purple-900/20">
            <p className="text-xs font-medium text-white/80">{t("statActiveTargets")}</p>
            <p className="mt-2 text-2xl font-bold text-white">{data.activeTargetCount}</p>
          </article>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("gradingLinksHeading")}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("gradingLinksDescription")}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <WorkflowContextLink
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              contextParams={{
                dashboardShortcut: null,
                programType,
              }}
              href={`/formative?returnTo=reports${programType ? `&programType=${programType}` : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${badge.success}`}>
                  <BookText aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {t("formativeButton")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("formativeDescription")}
                  </p>
                </div>
              </div>
            </WorkflowContextLink>
            <WorkflowContextLink
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              contextParams={{
                dashboardShortcut: null,
                programType,
              }}
              href={`/summative?returnTo=reports${programType ? `&programType=${programType}` : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${badge.success}`}>
                  <ClipboardList aria-hidden="true" size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {t("summativeButton")}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("summativeDescription")}
                  </p>
                </div>
              </div>
            </WorkflowContextLink>
          </div>
        </section>

        {data.classGroups.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">{t("halaqahHeading")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.classGroups.map((cg) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                  key={cg.id}
                >
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {t("halaqahGradeLabel", { grade: cg.grade })} · {cg.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {cg.level && reportView.showHalaqahLevel && (
                      <span className={`shrink-0 rounded-full ${badge.success} px-3 py-1 text-xs font-medium`}>
                        {cg.level}
                      </span>
                    )}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {cg.studentCount} {t("halaqahStudentCount")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {reportView.kind === "academic" ? (
          <AcademicReportProgress data={data} t={t} />
        ) : (
          <BoardingReportProgress data={data} t={t} />
        )}

      </AppShell>
  );
}
