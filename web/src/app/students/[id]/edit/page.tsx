import Link from "next/link";
import EditStudentForm from "./EditStudentForm";
import { updateTeacherStudent } from "./actions";
import { getStudentFormContext } from "@/lib/students";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { halaqahLevelLabels } from "@/lib/format";
import { backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("StudentForm");
  return { title: `${t("titleEdit")} - TahfidzFlow` };
}

type EditStudentPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; returnTo?: string }>;
};

export default async function EditStudentPage({
  params,
  searchParams,
}: EditStudentPageProps) {
  const t = await getTranslations("StudentFormPage");
  const { id } = await params;
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("teacherOnlyEdit")}
        </p>
        <Link
          className={backLink}
          href="/"
        >
          &larr; TahfidzFlow
        </Link>
      </div>
    );
  }

  const [context, options, pageParams] = await Promise.all([
    getStudentFormContext(id, teacherId, "id", { includeInactive: true }),
    getTeacherStudentFormOptions(teacherId),
    searchParams,
  ]);

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("notFound")}
        </p>
      </div>
    );
  }

  // Get halaqah student count for the warning message
  const halaqahStudentCount = await prisma.student.count({
    where: {
      classGroupId: context.classGroupId,
      isActive: true,
    },
  });

  const returnTo = pageParams?.returnTo?.startsWith("/students") && !pageParams.returnTo.startsWith("//") ? pageParams.returnTo : undefined;
  const boundAction = updateTeacherStudent.bind(null, id, returnTo);

  return (
    <EditStudentForm
      action={boundAction}
      backHref={returnTo ?? `/students/${id}`}
      restoreContext={Boolean(returnTo)}
      error={pageParams?.error}
      options={options}
      defaultProgramType={context.programType}
      halaqah={{
        classGroupId: context.classGroupId,
        name: context.halaqahName,
        level: context.classGroupLevel,
        levelLabel: halaqahLevelLabels[context.classGroupLevel as keyof typeof halaqahLevelLabels],
        grade: Number(context.classGroupGrade),
        studentCount: halaqahStudentCount,
      }}
      values={{
        fullName: context.fullName,
        academicClassId: context.academicClassId,
        gender: context.gender,
        joinDate: context.joinDateRaw,
        notes: context.notes,
        classGroupLevel: context.classGroupLevel,
        classGroupGrade: context.classGroupGrade,
      }}
    />
  );
}
