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
    programType?: string;
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
  const programType = params?.programType ?? "";
  const isBoarding = programType === "BOARDING";
  const backHref = programType
    ? `/admin/classes?programType=${programType}`
    : "/admin/classes";

  return (
    <AcademicClassForm
      action={createAcademicClass}
      activeAcademicYear={activeAcademicYear}
      backHref={backHref}
      backLabel={isBoarding ? t("backBoardingClasses") : t("backAcademicClasses")}
      description={isBoarding ? t("addBoardingClassDescription") : t("addAcademicClassDescription")}
      error={params?.error}
      icon="PlusCircle"
      submitLabel={t("saveClass")}
      title={isBoarding ? t("addBoardingClass") : t("addAcademicClass")}
      programType={programType}
      values={{
        grade: params?.grade ?? "",
        section: params?.section ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
