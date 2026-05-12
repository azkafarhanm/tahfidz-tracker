import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FilePlus2,
  PencilLine,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { requireSessionScope } from "@/lib/session";
import {
  getStudentSummativeDetail,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummativeDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
    saved?: string;
    deleted?: string;
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

  if (!teacherId) {
    redirect("/admin");
  }

  const semesterValue = query?.semester ?? Semester.GANJIL;
  if (!isSemesterValue(semesterValue)) {
    redirect(`/summative/${studentId}`);
  }

  const academicYear = getCurrentAcademicYear();
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
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href={`/summative?semester=${semesterValue}&classLevel=${detail.classLevel}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToList")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {detail.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {detail.academicClassName} · {detail.halaqahName} ({detail.halaqahLevel})
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <ClipboardList aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      {query?.saved ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
          {t("savedSuccess")}
        </div>
      ) : null}
      {query?.deleted ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
          {t("deletedSuccess")}
        </div>
      ) : null}

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {[Semester.GANJIL, Semester.GENAP].map((option) => (
            <Link
              key={option}
              href={`/summative/${studentId}?semester=${option}`}
              className={`px-4 py-2 text-sm font-medium transition first:rounded-l-2xl last:rounded-r-2xl ${
                semesterValue === option
                  ? "bg-emerald-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {option === Semester.GANJIL ? t("ganjil") : t("genap")}
            </Link>
          ))}
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          {t("targetCount", { count: detail.recommendedTargetCount })}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
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
            {t("averageLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {detail.averageScore ?? "-"}
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("recommendationLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {detail.recommendedTargetCount}
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

        {detail.assessments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">{t("emptyAssessmentsHeading")}</p>
            <p className="mt-1">{t("emptyAssessmentsDescription")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colSurah")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colScore")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("semesterLabel")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colNotes")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colRecordedAt")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {t("colAction")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.assessments.map((assessment, index) => (
                  <tr
                    key={assessment.id}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      index % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {assessment.surahNumber}. {assessment.surahName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {assessment.surahArabicName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {assessment.score}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {assessment.semesterLabel}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {assessment.notes || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {assessment.recordedAt}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                        href={`/summative/${studentId}/${assessment.id}/edit?semester=${semesterValue}`}
                      >
                        <PencilLine aria-hidden="true" size={16} strokeWidth={2.2} />
                        {t("editButton")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
