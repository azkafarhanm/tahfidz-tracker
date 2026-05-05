import { notFound } from "next/navigation";
import { PencilLine } from "lucide-react";
import AcademicClassForm from "../../AcademicClassForm";
import { updateAcademicClass } from "../../actions";
import {
  getAdminAcademicClassFormData,
  getAdminAcademicClassFormOptions,
} from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubah Kelas - Admin - TahfidzFlow",
};

type EditAcademicClassPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    grade?: string;
    section?: string;
    academicYear?: string;
    isActive?: string;
  }>;
};

export default async function EditAcademicClassPage({
  params,
  searchParams,
}: EditAcademicClassPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [academicClass, options] = await Promise.all([
    getAdminAcademicClassFormData(id),
    getAdminAcademicClassFormOptions(),
  ]);
  const query = await searchParams;

  if (!academicClass) {
    notFound();
  }

  const action = updateAcademicClass.bind(null, academicClass.id);

  return (
    <AcademicClassForm
      action={action}
      academicYears={options.academicYears}
      backHref="/admin/classes"
      backLabel="Kelas Akademik"
      description={`Perbarui data kelas ${academicClass.grade}${academicClass.section} untuk tahun ajaran ${academicClass.academicYear}.`}
      error={query?.error}
      icon={PencilLine}
      submitLabel="Simpan Perubahan"
      title="Ubah Kelas Akademik"
      values={{
        grade: query?.grade ?? academicClass.grade,
        section: query?.section ?? academicClass.section,
        academicYear: query?.academicYear ?? academicClass.academicYear,
        isActive: query?.isActive
          ? query.isActive === "true"
          : academicClass.isActive,
      }}
    />
  );
}
