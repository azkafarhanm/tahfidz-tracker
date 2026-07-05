import { ArrowLeft, BookText } from "lucide-react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FilterPreferenceSync from "@/components/FilterPreferenceSync";
import SegmentedLinkTabs from "@/components/SegmentedLinkTabs";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import FormativeRecordsTable from "./FormativeRecordsTable";
import { Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { getStudentFormativeDetail } from "@/lib/formative";
import {
  FORMATIVE_VIEW_COOKIE,
  parseStoredGradingView,
} from "@/lib/grading-view";
import { requireSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester } from "@/lib/summative";
import { badge, backLink } from "@/lib/colors";

export const runtime = "nodejs";

type FormativeDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
    error?: string;
    success?: string;
    programType?: string;
    returnTo?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("Formative");
  return { title: `${t("detailHeading")} - TahfidzFlow` };
}

export default async function FormativeDetailPage({
  params,
  searchParams,
}: FormativeDetailPageProps) {
  const { studentId } = await params;
  const query = await searchParams;
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Formative");

  const cookieStore = await cookies();
  const savedView = parseStoredGradingView(
    cookieStore.get(FORMATIVE_VIEW_COOKIE)?.value,
  );
  const defaultSemester = savedView.semester ?? getSemesterForDate(new Date());
  const semesterValue =
    query?.semester && isSemesterValue(query.semester)
      ? query.semester
      : defaultSemester;
  const returnTo = `/formative/${studentId}?semester=${semesterValue}`;
  const fromReports = query?.returnTo === "reports";
  const paramProgramType = query?.programType ?? "";

  const academicYear = await getActiveAcademicYear();
  const detail = await getStudentFormativeDetail(
    studentId,
    teacherId,
    parseSemester(semesterValue),
    academicYear,
    locale,
  );

  if (!detail) {
    redirect("/formative");
  }

  return (
    <AppShell currentPath="/formative" userName={session.user.name} isAdmin={isAdmin}>
      <FilterPreferenceSync
        cookieName={FORMATIVE_VIEW_COOKIE}
        value={`semester=${semesterValue}&classLevel=${detail.classLevel}`}
      />
      <header className="flex items-start justify-between gap-4">
        <div>
          <WorkflowContextLink
            className={backLink}
            compatibilityKeys={["semester", "classLevel", "programType", "returnTo"]}
            href={`/formative?semester=${semesterValue}&classLevel=${detail.classLevel}${paramProgramType ? `&programType=${paramProgramType}` : ""}${fromReports ? "&returnTo=reports" : ""}`}
            preferStoredContext
            restoreContext
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToList")}
          </WorkflowContextLink>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {detail.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {detail.academicClassName} - {detail.halaqahName}{detail.halaqahLevel ? ` (${detail.halaqahLevel})` : ""}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <BookText aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <SegmentedLinkTabs
          ariaLabel={t("semesterLabel")}
          currentValue={semesterValue}
          options={[
            { value: Semester.GANJIL, label: t("ganjil"), href: `/formative/${studentId}?semester=${Semester.GANJIL}${paramProgramType ? `&programType=${paramProgramType}` : ""}${fromReports ? "&returnTo=reports" : ""}` },
            { value: Semester.GENAP, label: t("genap"), href: `/formative/${studentId}?semester=${Semester.GENAP}${paramProgramType ? `&programType=${paramProgramType}` : ""}${fromReports ? "&returnTo=reports" : ""}` },
          ]}
        />

        <span className={`rounded-full ${badge.neutral} px-3 py-1 text-xs font-medium`}>
          {academicYear}
        </span>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <article className="rounded-[1.75rem] bg-slate-700 p-5 shadow-lg shadow-slate-900/20">
          <p className="text-sm text-slate-300">
            {t("assessmentCountLabel")}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {detail.totalAssessments}
          </p>
        </article>
        <article className="rounded-[1.75rem] bg-green-600 p-5 shadow-lg shadow-green-900/20">
          <p className="text-sm text-green-100">
            {t("colHafalan")}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {detail.hafalanCount}
          </p>
        </article>
        <article className="rounded-[1.75rem] bg-blue-600 p-5 shadow-lg shadow-blue-900/20">
          <p className="text-sm text-blue-100">
            {t("colMurojaah")}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {detail.murojaahCount}
          </p>
        </article>
        <article className="rounded-[1.75rem] bg-amber-500 p-5 shadow-lg shadow-amber-900/20">
          <p className="text-sm text-amber-100">
            {t("studentAverageLabel")}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {detail.averageScore ?? "-"}
          </p>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("detailHeading")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("detailDescription")}
            </p>
          </div>
        </div>

        <FormativeRecordsTable
          emptyDescription={t("emptyRecordsDescription")}
          emptyHeading={t("emptyRecordsHeading")}
          records={detail.records}
          returnTo={returnTo}
          studentId={studentId}
        />
      </section>
    </AppShell>
  );
}
