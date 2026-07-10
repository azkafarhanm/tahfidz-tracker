import { ArrowLeft, FilePlus2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import {
  createSummativeAssessmentAction,
  saveSummativeAssessmentsAction,
} from "@/app/summative/actions";
import {
  getAcademicSummativeInputTargets,
  getExistingSummativeScores,
  isSemesterValue,
} from "@/lib/summative";
import { backLink } from "@/lib/colors";
import SummativeBulkScoreForm from "@/app/summative/SummativeBulkScoreForm";
import SummativeAssessmentForm from "@/app/summative/SummativeAssessmentForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummativeNewPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
    programType?: string;
    returnTo?: string;
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
          grade: true,
          name: true,
          programType: true,
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
  const fromReports = query?.returnTo === "reports";
  const paramProgramType = query?.programType ?? "";
  const returnToParams = new URLSearchParams({ semester });
  if (paramProgramType) returnToParams.set("programType", paramProgramType);
  if (fromReports) returnToParams.set("returnTo", "reports");
  const returnTo = `/summative/${studentId}?${returnToParams.toString()}`;
  const academicYear = await getActiveAcademicYear();
  const targetGroups = await getAcademicSummativeInputTargets(
    student.classGroup.grade,
  );
  const targetSurahIds = targetGroups.flatMap((group) =>
    [
      ...group.targets.map((target) => target.surahId),
      ...(group.choices?.flatMap((choice) =>
        choice.options.map((option) => option.surahId),
      ) ?? []),
    ],
  );
  const existingScores =
    targetSurahIds.length > 0
      ? await getExistingSummativeScores(
          studentId,
          semester,
          academicYear,
          targetSurahIds,
        )
      : [];

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <WorkflowContextLink
            className={backLink}
            href={returnTo}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToDetail")}
          </WorkflowContextLink>
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
        {targetGroups.length > 0 ? (
          <SummativeBulkScoreForm
            action={saveSummativeAssessmentsAction}
            academicYear={academicYear}
            cancelHref={returnTo}
            defaultSemester={semester}
            enableAdditionalMemorization
            existingScores={existingScores}
            returnTo={returnTo}
            studentId={studentId}
            targetGroups={targetGroups}
          />
        ) : (
          <SummativeAssessmentForm
            action={createSummativeAssessmentAction}
            academicYear={academicYear}
            cancelHref={returnTo}
            defaultSemester={semester}
            returnTo={returnTo}
            studentId={studentId}
          />
        )}
      </div>
    </AppShell>
  );
}
