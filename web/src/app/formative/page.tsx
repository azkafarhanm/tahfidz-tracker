import Link from "next/link";
import { ArrowLeft, BookText, Download } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Semester } from "@/generated/prisma-next/enums";
import { getCurrentAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { getTeacherFormativeOverview } from "@/lib/formative";
import { requireSessionScope } from "@/lib/session";
import { isSemesterValue, parseSemester } from "@/lib/summative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FormativePageProps = {
  searchParams?: Promise<{
    semester?: string;
    classLevel?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("Formative");
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function FormativePage({
  searchParams,
}: FormativePageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Formative");

  if (!teacherId) {
    redirect("/admin");
  }

  const defaultSemester = getSemesterForDate(new Date());
  const semesterValue = params?.semester ?? defaultSemester;
  const classLevelValue = params?.classLevel ?? "7";

  if (!params?.semester || !params?.classLevel) {
    redirect(`/formative?semester=${semesterValue}&classLevel=${classLevelValue}`);
  }

  if (!isSemesterValue(semesterValue)) {
    redirect(`/formative?semester=${defaultSemester}&classLevel=7`);
  }

  const classLevel = Number.parseInt(classLevelValue, 10);
  if (![7, 8, 9].includes(classLevel)) {
    redirect(`/formative?semester=${semesterValue}&classLevel=7`);
  }

  const academicYear = getCurrentAcademicYear();
  const overview = await getTeacherFormativeOverview(
    teacherId,
    parseSemester(semesterValue),
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
    <AppShell currentPath="/formative" userName={session.user.name} isAdmin={isAdmin}>
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
          <BookText aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("classLabel")}
          </span>
          <div className="flex rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {classOptions.map((option) => (
              <Link
                key={option.value}
                href={`/formative?semester=${semesterValue}&classLevel=${option.value}`}
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
                href={`/formative?semester=${option.value}&classLevel=${classLevelValue}`}
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
          href={`/api/reports/export-formative?semester=${semesterValue}&classLevel=${classLevelValue}`}
        >
          <Download aria-hidden="true" size={16} strokeWidth={2.2} />
          {t("exportExcel")}
        </a>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
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
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("classAverageLabel")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            {overview.averageScore ?? "-"}
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
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colStudent")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colHalaqah")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colHafalan")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colMurojaah")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colLatestScore")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colStudentAverage")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    {t("colLatest")}
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
                      {student.hafalanCount}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      {student.murojaahCount}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.latestScore ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {student.averageScore ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                      <p>{student.latestRange}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {student.latestDate}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                        href={`/formative/${student.id}?semester=${semesterValue}`}
                      >
                        {t("detailButton")}
                      </Link>
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
