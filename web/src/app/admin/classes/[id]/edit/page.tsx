import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
import AcademicClassForm from "../../AcademicClassForm";
import { updateAcademicClass } from "../../actions";
import {
  getAdminAcademicClassFormData,
  getAdminAcademicClassFormOptions,
} from "@/lib/admin";
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
    academicYear?: string;
    isActive?: string;
  }>;
};

export default async function EditAcademicClassPage({
  params,
  searchParams,
}: EditAcademicClassPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [academicClass, options, query] = await Promise.all([
    getAdminAcademicClassFormData(id),
    getAdminAcademicClassFormOptions(),
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
      academicYears={options.academicYears}
      backHref="/admin/classes"
      backLabel={t("backAcademicClasses")}
      description={t("editAcademicClassDescription", {
        grade: academicClass.grade,
        section: academicClass.section,
        year: academicClass.academicYear,
      })}
      error={query?.error}
      icon={PencilLine}
      submitLabel={t("saveChanges")}
      title={t("editAcademicClass")}
      values={{
        grade: query?.grade ?? academicClass.grade,
        section: query?.section ?? academicClass.section,
        academicYear: query?.academicYear ?? academicClass.academicYear,
        isActive: query?.isActive
          ? query.isActive === "true"
          : academicClass.isActive,
      }}
    />
  );
}
