import ClassGroupForm from "../ClassGroupForm";
import { createClassGroup } from "../actions";
import { getAdminClassGroupFormOptions } from "@/lib/admin";
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
    academicYear?: string;
    grade?: string;
    isActive?: string;
  }>;
};

export default async function NewClassGroupPage({
  searchParams,
}: NewClassGroupPageProps) {
  await requireAdminScope();

  const [params, options] = await Promise.all([
    searchParams,
    getAdminClassGroupFormOptions(),
  ]);
  const t = await getTranslations("AdminFormPage");

  return (
    <ClassGroupForm
      action={createClassGroup}
      backHref="/admin/halaqah"
      backLabel={t("backHalaqah")}
      description={t("addHalaqahDescription")}
      error={params?.error}
      icon="PlusCircle"
      submitLabel={t("saveHalaqah")}
      academicYears={options.academicYears}
      teachers={options.teachers}
      title={t("addHalaqah")}
      values={{
        name: params?.name ?? "",
        description: params?.description ?? "",
        level: params?.level ?? "LOW",
        teacherId: params?.teacherId ?? "",
        academicYear:
          params?.academicYear ?? options.academicYears[0] ?? "2025/2026",
        grade: params?.grade ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
