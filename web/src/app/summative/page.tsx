import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireSessionScope } from "@/lib/session";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Semester } from "@/generated/prisma-next/enums";
import {
  getSummativeGrid,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { saveSummativeScores } from "./actions";
import SummativeGrid from "./SummativeGrid";

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

export default async function SummativePage({ searchParams }: SummativePageProps) {
  const params = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Summative");

  if (!teacherId) {
    redirect("/admin");
  }

  const semesterStr = params?.semester || "GANJIL";
  const classLevelStr = params?.classLevel || "7";
  if (!isSemesterValue(semesterStr)) {
    redirect("/summative");
  }

  const semester: Semester = parseSemester(semesterStr);
  const classLevel = parseInt(classLevelStr, 10);
  const academicYear = getCurrentAcademicYear();

  if (![7, 8, 9].includes(classLevel)) {
    redirect("/summative");
  }

  const gridData = await getSummativeGrid(classLevel, semester, teacherId, academicYear);

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <header className="flex items-center justify-between gap-4">
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
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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

      <SummativeGrid
        action={saveSummativeScores}
        targets={gridData.targets}
        students={gridData.students}
        semester={semesterStr}
        classLevel={classLevelStr}
        academicYear={academicYear}
      />
    </AppShell>
  );
}
