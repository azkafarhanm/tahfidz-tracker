import ClassGroupForm from "../ClassGroupForm";
import { createClassGroup } from "../actions";
import { getAdminClassGroupFormOptions } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tambah Halaqah - Admin - TahfidzFlow",
};

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

  const params = await searchParams;
  const options = await getAdminClassGroupFormOptions();

  return (
    <ClassGroupForm
      action={createClassGroup}
      backHref="/admin/halaqah"
      backLabel="Halaqah"
      description="Buat halaqah baru untuk guru pembimbing dan tentukan cakupan kelas 7, 8, atau 9."
      error={params?.error}
      icon="PlusCircle"
      submitLabel="Simpan Halaqah"
      academicYears={options.academicYears}
      teachers={options.teachers}
      title="Tambah Halaqah"
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
