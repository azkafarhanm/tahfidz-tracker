import TeacherForm from "../TeacherForm";
import { createTeacher } from "../actions";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("addTeacher")} - Admin - TahfidzFlow` };
}

type NewTeacherPageProps = {
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    isActive?: string;
  }>;
};

export default async function NewTeacherPage({
  searchParams,
}: NewTeacherPageProps) {
  await requireAdminScope();
  const params = await searchParams;
  const t = await getTranslations("AdminFormPage");

  return (
    <TeacherForm
      action={createTeacher}
      backHref="/admin/teachers"
      backLabel={t("backTeacherDirectory")}
      description={t("addTeacherDescription")}
      error={params?.error}
      icon="UserPlus"
      passwordDescription={t("addTeacherPasswordDescription")}
      passwordRequired
      submitLabel={t("saveTeacher")}
      title={t("addTeacher")}
      values={{
        fullName: params?.fullName ?? "",
        username: params?.username ?? "",
        email: params?.email ?? "",
        phoneNumber: params?.phoneNumber ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
