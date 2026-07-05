import { notFound } from "next/navigation";
import StudentForm from "../../StudentForm";
import { updateStudent } from "../../actions";
import { getAdminStudentFormData } from "@/lib/admin";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { halaqahLevelLabels } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("editStudent")} - Admin - TahfidzFlow` };
}

type EditStudentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    teacherId?: string;
    academicClassId?: string;
    gender?: string;
    joinDate?: string;
    isActive?: string;
    notes?: string;
    programType?: string;
    returnTo?: string;
    /** Directory search query, carried from the directory Edit link. */
    q?: string;
    /** Directory page number, carried from the directory Edit link. */
    page?: string;
  }>;
};

export default async function EditStudentPage({
  params,
  searchParams,
}: EditStudentPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [data, activeAcademicYear, query] = await Promise.all([
    getAdminStudentFormData(id),
    getActiveAcademicYear(),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  if (!data) {
    notFound();
  }

  // Active student count in the student's halaqah (for the Edit Level warning).
  const halaqahStudentCount = await prisma.student.count({
    where: {
      classGroupId: data.student.classGroupId,
      isActive: true,
    },
  });

  const programType = query?.programType ?? data.student.programType ?? "";
  // returnTo is set only when Edit is reached from the Student Detail page.
  // Validated against open-redirect like the Teacher record-edit flow.
  const rawReturnTo = query?.returnTo;
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : undefined;
  // Detail-origin Cancel/Back returns to the detail page; directory-origin
  // returns to the directory (with restoreContext reapplying search/pagination).
  const backHref = returnTo
    ? returnTo
    : programType
      ? `/admin/students?programType=${programType}`
      : "/admin/students";
  const action = updateStudent.bind(null, data.student.id, returnTo);
  // Directory working-set filters, carried from the directory Edit link so the
  // server action can rebuild the directory URL on Save (server redirects cannot
  // read client-side Navigation Context). Only meaningful for directory-origin.
  const directoryQ = query?.q ?? "";
  const directoryPage = query?.page ?? "";

  return (
    <StudentForm
      action={action}
      backHref={backHref}
      backLabel={t("backStudentDirectory")}
      description={t("editStudentDescription", { name: data.student.fullName })}
      error={query?.error}
      icon="PencilLine"
      activeAcademicYear={activeAcademicYear}
      options={data.options}
      submitLabel={t("saveChanges")}
      title={t("editStudent")}
      programType={programType}
      initialLevel={data.student.classGroupLevel}
      restoreContext
      directoryQ={directoryQ}
      directoryPage={directoryPage}
      halaqah={{
        classGroupId: data.student.classGroupId,
        name: data.student.classGroupName,
        level: data.student.classGroupLevel,
        levelLabel: halaqahLevelLabels[data.student.classGroupLevel as keyof typeof halaqahLevelLabels],
        grade: data.student.classGroupGrade,
        studentCount: halaqahStudentCount,
      }}
      values={{
        fullName: query?.fullName ?? data.student.fullName,
        teacherId: query?.teacherId ?? data.student.teacherId,
        academicClassId:
          query?.academicClassId ?? data.student.academicClassId,
        gender: query?.gender ?? data.student.gender,
        joinDate: query?.joinDate ?? data.student.joinDate,
        isActive: query?.isActive
          ? query.isActive === "true"
          : data.student.isActive,
        notes: query?.notes ?? data.student.notes,
      }}
    />
  );
}
