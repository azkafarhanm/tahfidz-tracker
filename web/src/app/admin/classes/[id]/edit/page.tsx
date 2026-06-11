import { notFound } from "next/navigation";
import AcademicClassForm from "../../AcademicClassForm";
import { updateAcademicClass } from "../../actions";
import { getAdminAcademicClassFormData } from "@/lib/admin";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return {
    title: `${t("editAcademicClass")} - Admin - TahfidzFlow`,
  };
}

type EditAcademicClassPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    grade?: string;
    section?: string;
    isActive?: string;
  }>;
};

export default async function EditAcademicClassPage({
  params,
  searchParams,
}: EditAcademicClassPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [academicClass, activeAcademicYear, query] = await Promise.all([
    getAdminAcademicClassFormData(id),
    getActiveAcademicYear(),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  if (!academicClass) {
    notFound();
  }

  const action = updateAcademicClass.bind(null, academicClass.id);

  return (
    <AcademicClassForm
      action={action}
      activeAcademicYear={activeAcademicYear}
      backHref="/admin/classes"
      backLabel={t("backAcademicClasses")}
      description={t("editAcademicClassDescription", {
        grade: academicClass.grade,
        section: academicClass.section,
        year: academicClass.academicYear,
      })}
      error={query?.error}
      icon="PencilLine"
      submitLabel={t("saveChanges")}
      title={t("editAcademicClass")}
      values={{
        grade: query?.grade ?? academicClass.grade,
        section: query?.section ?? academicClass.section,
        isActive: query?.isActive
          ? query.isActive === "true"
          : academicClass.isActive,
      }}
    />
  );
}
