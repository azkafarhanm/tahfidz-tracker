import Link from "next/link";
import { ArrowLeft, ClipboardList, Download, FilePlus2 } from "lucide-react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import FilterPreferenceSync from "@/components/FilterPreferenceSync";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import {
  getPreferredTeacherClassLevel,
  parseClassLevelValue,
  parseStoredGradingView,
  SUMMATIVE_VIEW_COOKIE,
} from "@/lib/grading-view";
import { requireSessionScope } from "@/lib/session";
import {
  getTeacherSummativeOverview,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Summative");
  return { title: `${t("heading")} - TahfidzFlow` };
}

type SummativePageProps = {
  searchParams?: Promise<{
    semester?: string;
    classLevel?: string;
    saved?: string;
  }>;
};

export default async function SummativePage({
  searchParams,
}: SummativePageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Summative");

  if (!teacherId) {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const savedView = parseStoredGradingView(
    cookieStore.get(SUMMATIVE_VIEW_COOKIE)?.value,
  );
  const preferredClassLevel =
    savedView.classLevel ?? (await getPreferredTeacherClassLevel(teacherId));
  const defaultSemester = savedView.semester ?? getSemesterForDate(new Date());
  const semesterValue =
    params?.semester && isSemesterValue(params.semester)
      ? params.semester
      : defaultSemester;
  const classLevel = parseClassLevelValue(params?.classLevel) ?? preferredClassLevel;
  const classLevelValue = String(classLevel);

  const academicYear = getCurrentAcademicYear();
  const semester = parseSemester(semesterValue);
  const overview = await getTeacherSummativeOverview(
    teacherId,
    semester,
    academicYear,
    classLevel,
    locale,
  );

  const classOptions = [
    { value: "7", label: t("grade7") },
    { value: "8", label: t("grade8") },
    { value: "9", label: t("grade9") },
  ];

  const semesterOptions = [
    { value: Semester.GANJIL, label: t("ganjil") },
    { value: Semester.GENAP, label: t("genap") },
  ];

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <FilterPreferenceSync
        cookieName={SUMMATIVE_VIEW_COOKIE}
        value={`semester=${semesterValue}&classLevel=${classLevelValue}`}
      />
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href="/"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backLink")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {t("heading")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("description")}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <ClipboardList aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      {params?.saved ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
          {t("savedSuccess")}
        </div>
      ) : null}

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("classLabel")}
          </span>
          <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {classOptions.map((option) => (
              <Link
                key={option.value}
                href={`/summative?semester=${semesterValue}&classLevel=${option.value}`}
                className={`px-4 py-2 text-sm font-medium transition first:rounded-l-2xl last:rounded-r-2xl ${
                  classLevelValue === option.value
                    ? "bg-emerald-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("semesterLabel")}
          </span>
          <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {semesterOptions.map((option) => (
              <Link
                key={option.value}
                href={`/summative?semester=${option.value}&classLevel=${classLevelValue}`}
                className={`px-4 py-2 text-sm font-medium transition first:rounded-l-2xl last:rounded-r-2xl ${
                  semesterValue === option.value
                    ? "bg-emerald-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {academicYear}
        </span>

        <a
          className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          href={`/api/reports/export-summative?semester=${semesterValue}&classLevel=${classLevelValue}`}
        >
          <Download aria-hidden="true" size={16} strokeWidth={2.2} />
          {t("exportExcel")}
        </a>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("studentCountLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {overview.students.length}
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("assessmentCountLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {overview.totalAssessments}
          </p>
        </article>
      </section>

      {overview.students.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
          <p className="font-medium">{t("emptyStudentsHeading")}</p>
          <p className="mt-1">{t("emptyStudentsDescription")}</p>
        </div>
      ) : (
        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("studentListHeading")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("studentListDescription")}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colStudent")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colHalaqah")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colAssessments")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colAverage")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colLastAssessment")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {t("colAction")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.students.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      index % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/20" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {student.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {student.academicClassName}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      <p>{student.halaqahName}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {student.halaqahLevel}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {student.totalAssessments}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {student.averageScore ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      <p>{student.latestAssessment}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {student.latestDate}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                          href={`/summative/${student.id}?semester=${semesterValue}`}
                        >
                          {t("detailButton")}
                        </Link>
                        <Link
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
                          href={`/summative/${student.id}/new?semester=${semesterValue}`}
                        >
                          <FilePlus2 aria-hidden="true" size={16} strokeWidth={2.2} />
                          {t("addButton")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
