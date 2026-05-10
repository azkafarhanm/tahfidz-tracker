import { notFound } from "next/navigation";
import ClassGroupForm from "../../ClassGroupForm";
import { updateClassGroup } from "../../actions";
import {
  getAdminClassGroupFormData,
  getAdminClassGroupFormOptions,
} from "@/lib/admin";
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
    name?: string;
    description?: string;
    level?: string;
    teacherId?: string;
    academicYear?: string;
    grade?: string;
    isActive?: string;
  }>;
};

export default async function EditClassGroupPage({
  params,
  searchParams,
}: EditClassGroupPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [classGroup, options, query] = await Promise.all([
    getAdminClassGroupFormData(id),
    getAdminClassGroupFormOptions(),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  if (!classGroup) {
    notFound();
  }

  const action = updateClassGroup.bind(null, classGroup.id);

  return (
    <ClassGroupForm
      action={action}
      backHref="/admin/halaqah"
      backLabel={t("backHalaqah")}
      description={t("editHalaqahDescription", { name: classGroup.name })}
      error={query?.error}
      icon="PencilLine"
      submitLabel={t("saveChanges")}
      academicYears={options.academicYears}
      teachers={options.teachers}
      title={t("editHalaqah")}
      values={{
        name: query?.name ?? classGroup.name,
        description: query?.description ?? classGroup.description,
        level: query?.level ?? classGroup.level,
        teacherId: query?.teacherId ?? classGroup.teacherId,
        academicYear: query?.academicYear ?? classGroup.academicYear,
        grade: query?.grade ?? classGroup.grade,
        isActive: query?.isActive
          ? query.isActive === "true"
          : classGroup.isActive,
      }}
    />
  );
}
