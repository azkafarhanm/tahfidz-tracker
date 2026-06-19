import { notFound } from "next/navigation";
import ClassGroupForm from "../../ClassGroupForm";
import { updateClassGroup } from "../../actions";
import { getAdminClassGroupFormData, getAdminClassGroupFormOptions } from "@/lib/admin";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("editHalaqah")} - Admin - TahfidzFlow` };
}

type EditClassGroupPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    description?: string;
    level?: string;
    teacherId?: string;
    grade?: string;
    isActive?: string;
    programType?: string;
  }>;
};

export default async function EditClassGroupPage({
  params,
  searchParams,
}: EditClassGroupPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [classGroup, options, activeAcademicYear, query] = await Promise.all([
    getAdminClassGroupFormData(id),
    getAdminClassGroupFormOptions(),
    getActiveAcademicYear(),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  if (!classGroup) {
    notFound();
  }

  const programType = query?.programType ?? classGroup.programType ?? "";
  const backHref = programType
    ? `/admin/halaqah?programType=${programType}`
    : "/admin/halaqah";
  const action = updateClassGroup.bind(null, classGroup.id);

  return (
    <ClassGroupForm
      action={action}
      backHref={backHref}
      backLabel={t("backHalaqah")}
      description={t("editHalaqahDescription", { name: classGroup.name })}
      error={query?.error}
      icon="PencilLine"
      submitLabel={t("saveChanges")}
      activeAcademicYear={activeAcademicYear}
      teachers={options.teachers}
      title={t("editHalaqah")}
      programType={programType}
      values={{
        description: query?.description ?? classGroup.description,
        level: query?.level ?? classGroup.level,
        teacherId: query?.teacherId ?? classGroup.teacherId,
        grade: query?.grade ?? classGroup.grade,
        isActive: query?.isActive
          ? query.isActive === "true"
          : classGroup.isActive,
      }}
    />
  );
}
