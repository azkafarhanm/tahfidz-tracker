import ClassGroupForm from "../ClassGroupForm";
import { createClassGroup } from "../actions";
import { getAdminClassGroupFormOptions } from "@/lib/admin";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("addHalaqah")} - Admin - TahfidzFlow` };
}

type NewClassGroupPageProps = {
  searchParams?: Promise<{
    error?: string;
    name?: string;
    description?: string;
    level?: string;
    teacherId?: string;
    grade?: string;
    isActive?: string;
    programType?: string;
    q?: string; page?: string;
  }>;
};

export default async function NewClassGroupPage({
  searchParams,
}: NewClassGroupPageProps) {
  await requireAdminScope();

  const [params, options, activeAcademicYear] = await Promise.all([
    searchParams,
    getAdminClassGroupFormOptions(),
    getActiveAcademicYear(),
  ]);
  const t = await getTranslations("AdminFormPage");
  const programType = params?.programType ?? "";
  const backHref = programType
    ? `/admin/halaqah?programType=${programType}`
    : "/admin/halaqah";

  return (
    <ClassGroupForm
      action={createClassGroup}
      backHref={backHref}
      backLabel={t("backHalaqah")}
      description={t("addHalaqahDescription")}
      error={params?.error}
      icon="PlusCircle"
      submitLabel={t("saveHalaqah")}
      activeAcademicYear={activeAcademicYear}
      teachers={options.teachers}
      title={t("addHalaqah")}
      programType={programType}
      restoreContext directoryQ={params?.q ?? ""} directoryPage={params?.page ?? ""}
      values={{
        description: params?.description ?? "",
        level: params?.level ?? "LOW",
        teacherId: params?.teacherId ?? "",
        grade: params?.grade ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
