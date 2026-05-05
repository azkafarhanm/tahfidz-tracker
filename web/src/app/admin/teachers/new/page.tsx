import { UserPlus } from "lucide-react";
import TeacherForm from "../TeacherForm";
import { createTeacher } from "../actions";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tambah Guru - Admin - TahfidzFlow",
};

type NewTeacherPageProps = {
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
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

  return (
    <TeacherForm
      action={createTeacher}
      backHref="/admin/teachers"
      backLabel="Direktori Guru"
      description="Tambahkan akun guru baru beserta akses login awalnya."
      error={params?.error}
      icon={UserPlus}
      passwordDescription="Password awal wajib diisi. Guru dapat langsung menggunakan email dan password ini untuk login."
      passwordRequired
      submitLabel="Simpan Guru"
      title="Tambah Guru"
      values={{
        fullName: params?.fullName ?? "",
        email: params?.email ?? "",
        phoneNumber: params?.phoneNumber ?? "",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
