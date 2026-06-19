import Link from "next/link";
import { GraduationCap, Home } from "lucide-react";
import { requireSessionScope } from "@/lib/session";
import { getActiveAcademicYear, getTeacherProgramContext } from "@/lib/academic-year";
import { getTranslations } from "next-intl/server";
import { backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProgramSelectPage() {
  const t = await getTranslations("StudentFormPage");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("teacherOnly")}
        </p>
        <Link className={backLink} href="/">
          &larr; TahfidzFlow
        </Link>
      </div>
    );
  }

  const academicYear = await getActiveAcademicYear();
  const programContext = await getTeacherProgramContext(teacherId, academicYear);

  // If teacher already has programs, redirect to new student page
  if (programContext.programs.length > 0) {
    const defaultProgram = programContext.resolvedProgramType;
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href="/students/new?programType=${defaultProgram}"`,
        }}
      />
    );
  }

  // Teacher has no programs - show selection
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <GraduationCap size={28} strokeWidth={2.2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-950 dark:text-white">
            {t("selectProgramTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("selectProgramDescription")}
          </p>
        </div>

        <div className="mt-8 grid w-full max-w-sm gap-4">
          <Link
            href="/students/new?programType=ACADEMIC"
            className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-600"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                {t("programAcademic")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("programAcademicDescription")}
              </p>
            </div>
          </Link>

          <Link
            href="/students/new?programType=BOARDING"
            className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-400">
              <Home size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                {t("programBoarding")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("programBoardingDescription")}
              </p>
            </div>
          </Link>
        </div>

        <Link className="mt-8 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" href="/students">
          {t("backToStudents")}
        </Link>
      </section>
    </main>
  );
}
