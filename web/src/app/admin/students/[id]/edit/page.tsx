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
  const backHref = programType
    ? `/admin/students?programType=${programType}`
    : "/admin/students";
  const action = updateStudent.bind(null, data.student.id);

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
