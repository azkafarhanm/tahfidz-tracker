import { getQuickLogStudents, getQuickLogRecentActivity } from "@/lib/quick-log";
import { createGuidedRecord } from "./actions";
import GuidedQuickLog from "./GuidedQuickLog";
import AppShell from "@/components/AppShell";
import ProgramSelector from "@/components/ProgramSelector";
import ProgramBadge from "@/components/ProgramBadge";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { getActiveAcademicYear, getTeacherProgramContext } from "@/lib/academic-year";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuickLogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata() {
  const t = await getTranslations("QuickLog");
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function QuickLogPage({ searchParams }: QuickLogPageProps) {
  const t = await getTranslations("QuickLog");
  const params = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();

  // Program resolution
  const academicYear = await getActiveAcademicYear();
  const programContext = teacherId
    ? await getTeacherProgramContext(teacherId, academicYear)
    : { programs: [ProgramType.ACADEMIC, ProgramType.BOARDING], hasMultiple: true, resolvedProgramType: ProgramType.ACADEMIC };
  const requestedProgramType = params?.programType as ProgramType | undefined;
  const programType = programContext.programs.includes(requestedProgramType as ProgramType)
    ? (requestedProgramType as ProgramType)
    : programContext.resolvedProgramType;

  const [students, recentItems] = await Promise.all([
    getQuickLogStudents(teacherId, programType),
    getQuickLogRecentActivity(teacherId, programType),
  ]);
  const userName = session?.user?.name ?? t("defaultUserName");

  return (
    <AppShell currentPath="/quick-log" userName={userName} isAdmin={isAdmin}>
      <GuidedQuickLog
        action={createGuidedRecord}
        students={students}
        recentItems={recentItems}
        programBadge={<ProgramBadge programType={programType} />}
        programSelector={
          programContext.hasMultiple ? (
            <ProgramSelector
              programs={programContext.programs}
              programTypeLabels={programTypeLabels}
              currentProgramType={programType}
            />
          ) : undefined
        }
      />
    </AppShell>
  );
}
