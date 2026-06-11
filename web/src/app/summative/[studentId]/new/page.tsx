import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { createSummativeAssessmentAction } from "@/app/summative/actions";
import { isSemesterValue } from "@/lib/summative";
import SummativeAssessmentForm from "@/app/summative/SummativeAssessmentForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummativeNewPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("Summative");
  return { title: `${t("addAssessmentHeading")} - TahfidzFlow` };
}

export default async function SummativeNewPage({
  params,
  searchParams,
}: SummativeNewPageProps) {
  const { studentId } = await params;
  const query = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Summative");

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      academicClass: {
        select: {
          name: true,
        },
      },
      classGroup: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    redirect("/summative");
  }

  const semester =
    query?.semester && isSemesterValue(query.semester)
      ? query.semester
      : getSemesterForDate(new Date());
  const academicYear = await getActiveAcademicYear();

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href={`/summative/${studentId}?semester=${semester}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToDetail")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {t("addAssessmentHeading")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {student.fullName} - {student.academicClass?.name ?? "-"} - {student.classGroup.name}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <FilePlus2 aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <div className="mt-6">
        <SummativeAssessmentForm
          action={createSummativeAssessmentAction}
          academicYear={academicYear}
          cancelHref={`/summative/${studentId}?semester=${semester}`}
          defaultSemester={semester}
          studentId={studentId}
        />
      </div>
    </AppShell>
  );
}
