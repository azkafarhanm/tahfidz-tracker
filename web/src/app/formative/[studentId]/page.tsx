import Link from "next/link";
import { ArrowLeft, BookText } from "lucide-react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FilterPreferenceSync from "@/components/FilterPreferenceSync";
import LocalDateTime from "@/components/LocalDateTime";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { getStudentFormativeDetail } from "@/lib/formative";
import {
  FORMATIVE_VIEW_COOKIE,
  parseStoredGradingView,
} from "@/lib/grading-view";
import { requireSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester } from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FormativeDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
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

  const academicYear = getCurrentAcademicYear();
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
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href={`/formative?semester=${semesterValue}&classLevel=${detail.classLevel}`}
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
          <BookText aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {[Semester.GANJIL, Semester.GENAP].map((option) => (
            <Link
              key={option}
              href={`/formative/${studentId}?semester=${option}`}
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

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {academicYear}
        </span>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
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
            {t("colHafalan")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {detail.hafalanCount}
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("colMurojaah")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {detail.murojaahCount}
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

        {detail.records.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">{t("emptyRecordsHeading")}</p>
            <p className="mt-1">{t("emptyRecordsDescription")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colType")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colMaterial")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colScore")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colStatus")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colRecordedAt")}
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colNotes")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.records.map((record, index) => (
                  <tr
                    key={`${record.type}-${record.id}`}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      index % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {record.range}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {record.score ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {record.status}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      <LocalDateTime
                        fallback={`${record.date} - ${record.time}`}
                        iso={record.dateTimeIso}
                        locale={locale}
                        mode="dateTime"
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {record.notes || "-"}
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
