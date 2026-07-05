import { notFound } from "next/navigation";
import TeacherForm from "../../TeacherForm";
import { updateTeacher } from "../../actions";
import { getAdminTeacherFormData } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("editTeacher")} - Admin - TahfidzFlow` };
}

type EditTeacherPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    isActive?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function EditTeacherPage({
  params,
  searchParams,
}: EditTeacherPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [teacher, query] = await Promise.all([
    getAdminTeacherFormData(id),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  if (!teacher) {
    notFound();
  }

  const action = updateTeacher.bind(null, teacher.id);

  return (
    <div>
      <TeacherForm
        action={action}
        backHref="/admin/teachers"
        backLabel={t("backTeacherDirectory")}
        description={t("editTeacherDescription", { name: teacher.fullName })}
        error={query?.error}
        icon="PencilLine"
        passwordDescription={t("editTeacherPasswordDescription")}
        passwordRequired={false}
        submitLabel={t("saveChanges")}
        title={t("editTeacher")}
        showUsername
        restoreContext
        directoryQ={query?.q ?? ""}
        directoryPage={query?.page ?? ""}
        values={{
          fullName: query?.fullName ?? teacher.fullName,
          username: query?.username ?? teacher.username,
          email: query?.email ?? teacher.email,
          phoneNumber: query?.phoneNumber ?? teacher.phoneNumber,
          isActive: query?.isActive ? query.isActive === "true" : teacher.isActive,
        }}
      />
    </div>
  );
}
