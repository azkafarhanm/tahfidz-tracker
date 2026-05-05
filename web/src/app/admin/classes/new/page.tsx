import { PlusCircle } from "lucide-react";
import AcademicClassForm from "../AcademicClassForm";
import { createAcademicClass } from "../actions";
import { getAdminAcademicClassFormOptions } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tambah Kelas - Admin - TahfidzFlow",
};

type NewAcademicClassPageProps = {
  searchParams?: Promise<{
    error?: string;
    grade?: string;
    section?: string;
    academicYear?: string;
    isActive?: string;
  }>;
};

export default async function NewAcademicClassPage({
  searchParams,
}: NewAcademicClassPageProps) {
  await requireAdminScope();

  const params = await searchParams;
  const options = await getAdminAcademicClassFormOptions();

  return (
    <AcademicClassForm
      action={createAcademicClass}
      academicYears={options.academicYears}
      backHref="/admin/classes"
      backLabel="Kelas Akademik"
      description="Tambahkan kelas akademik baru untuk tahun ajaran tertentu."
      error={params?.error}
      icon={PlusCircle}
      submitLabel="Simpan Kelas"
      title="Tambah Kelas Akademik"
      values={{
        grade: params?.grade ?? "",
        section: params?.section ?? "",
        academicYear: params?.academicYear ?? options.academicYears[0] ?? "2025/2026",
        isActive: params?.isActive ? params.isActive === "true" : true,
      }}
    />
  );
}
