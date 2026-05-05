import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
import TeacherForm from "../../TeacherForm";
import { updateTeacher } from "../../actions";
import { getAdminTeacherFormData } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubah Guru - Admin - TahfidzFlow",
};

type EditTeacherPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    isActive?: string;
  }>;
};

export default async function EditTeacherPage({
  params,
  searchParams,
}: EditTeacherPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const teacher = await getAdminTeacherFormData(id);
  const query = await searchParams;

  if (!teacher) {
    notFound();
  }

  const action = updateTeacher.bind(null, teacher.id);

  return (
    <TeacherForm
      action={action}
      backHref="/admin/teachers"
      backLabel="Direktori Guru"
      description={`Perbarui data akun untuk ${teacher.fullName}.`}
      error={query?.error}
      icon={PencilLine}
      passwordDescription="Kosongkan password jika tidak ingin mengubah akses login guru ini."
      passwordRequired={false}
      submitLabel="Simpan Perubahan"
      title="Ubah Guru"
      values={{
        fullName: query?.fullName ?? teacher.fullName,
        email: query?.email ?? teacher.email,
        phoneNumber: query?.phoneNumber ?? teacher.phoneNumber,
        isActive: query?.isActive ? query.isActive === "true" : teacher.isActive,
      }}
    />
  );
}
