import AcademicClassForm from "../AcademicClassForm";
import { createAcademicClass } from "../actions";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return {
    title: `${t("addAcademicClass")} - Admin - TahfidzFlow`,
  };
}

type NewAcademicClassPageProps = {
  searchParams?: Promise<{
    error?: string;
    grade?: string;
    section?: string;
    isActive?: string;
  }>;
};

export default async function NewAcademicClassPage({
  searchParams,
}: NewAcademicClassPageProps) {
  await requireAdminScope();

  const [params, activeAcademicYear] = await Promise.all([
    searchParams,
    getActiveAcademicYear(),
  ]);
  const t = await getTranslations("AdminFormPage");

  return (
    <AcademicClassForm
      action={createAcademicClass}
      activeAcademicYear={activeAcademicYear}
      backHref="/admin/classes"
      backLabel={t("backAcademicClasses")}
      description={t("addAcademicClassDescription")}
      error={params?.error}
      icon="PlusCircle"
      submitLabel={t("saveClass")}
      title={t("addAcademicClass")}
      values={{
        grade: params?.grade ?? "",
        section: params?.section ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
