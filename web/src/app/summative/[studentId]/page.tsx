import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FilePlus2,
} from "lucide-react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FilterPreferenceSync from "@/components/FilterPreferenceSync";
import SegmentedLinkTabs from "@/components/SegmentedLinkTabs";
import { Semester } from "@/generated/prisma-next/enums";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import {
  parseStoredGradingView,
  SUMMATIVE_VIEW_COOKIE,
} from "@/lib/grading-view";
import { requireSessionScope } from "@/lib/session";
import {
  getStudentSummativeDetail,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";
import { badge, backLink } from "@/lib/colors";
import SummativeAssessmentsTable from "./SummativeAssessmentsTable";

export const runtime = "nodejs";

type SummativeDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("Summative");
  return { title: `${t("detailHeading")} - TahfidzFlow` };
}

export default async function SummativeDetailPage({
  params,
  searchParams,
}: SummativeDetailPageProps) {
  const { studentId } = await params;
  const query = await searchParams;
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Summative");

  const cookieStore = await cookies();
  const savedView = parseStoredGradingView(
    cookieStore.get(SUMMATIVE_VIEW_COOKIE)?.value,
  );
  const defaultSemester = savedView.semester ?? getSemesterForDate(new Date());
  const semesterValue =
    query?.semester && isSemesterValue(query.semester)
      ? query.semester
      : defaultSemester;

  const academicYear = await getActiveAcademicYear();
  const detail = await getStudentSummativeDetail(
    studentId,
    teacherId,
    parseSemester(semesterValue),
    academicYear,
    locale,
  );

  if (!detail) {
    redirect("/summative");
  }

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <FilterPreferenceSync
        cookieName={SUMMATIVE_VIEW_COOKIE}
        value={`semester=${semesterValue}&classLevel=${detail.classLevel}`}
      />
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            className={backLink}
            href={`/summative?semester=${semesterValue}&classLevel=${detail.classLevel}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToList")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {detail.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {detail.academicClassName} - {detail.halaqahName} ({detail.halaqahLevel})
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <ClipboardList aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <SegmentedLinkTabs
          ariaLabel={t("semesterLabel")}
          currentValue={semesterValue}
          options={[
            { value: Semester.GANJIL, label: t("ganjil"), href: `/summative/${studentId}?semester=${Semester.GANJIL}` },
            { value: Semester.GENAP, label: t("genap"), href: `/summative/${studentId}?semester=${Semester.GENAP}` },
          ]}
        />

        <span className={`rounded-full ${badge.neutral} px-3 py-1 text-xs font-medium`}>
          {academicYear}
        </span>

        <a
          className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          href={`/api/reports/export-summative?semester=${semesterValue}&classLevel=${detail.classLevel}`}
        >
          <Download aria-hidden="true" size={16} strokeWidth={2.2} />
          {t("exportExcel")}
        </a>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
          href={`/summative/${studentId}/new?semester=${semesterValue}`}
        >
          <FilePlus2 aria-hidden="true" size={16} strokeWidth={2.2} />
          {t("addButton")}
        </Link>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("assessmentCountLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {detail.totalAssessments}
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("studentAverageLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
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

        <SummativeAssessmentsTable
          assessments={detail.assessments}
          emptyDescription={t("emptyAssessmentsDescription")}
          emptyHeading={t("emptyAssessmentsHeading")}
          semesterValue={semesterValue}
          studentId={studentId}
        />
      </section>
    </AppShell>
  );
}
