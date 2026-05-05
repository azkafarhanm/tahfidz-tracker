import { notFound } from "next/navigation";
import StudentForm from "../../StudentForm";
import { updateStudent } from "../../actions";
import { getAdminStudentFormData } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubah Santri - Admin - TahfidzFlow",
};

type EditStudentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    teacherId?: string;
    academicYear?: string;
    academicClassId?: string;
    gender?: string;
    joinDate?: string;
    isActive?: string;
    notes?: string;
  }>;
};

export default async function EditStudentPage({
  params,
  searchParams,
}: EditStudentPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [data, query] = await Promise.all([
    getAdminStudentFormData(id),
    searchParams,
  ]);

  if (!data) {
    notFound();
  }

  const action = updateStudent.bind(null, data.student.id);

  return (
    <StudentForm
      action={action}
      backHref="/admin/students"
      backLabel="Direktori Santri"
      description={`Perbarui data santri untuk ${data.student.fullName}.`}
      error={query?.error}
      icon="PencilLine"
      options={data.options}
      submitLabel="Simpan Perubahan"
      title="Ubah Santri"
      values={{
        fullName: query?.fullName ?? data.student.fullName,
        teacherId: query?.teacherId ?? data.student.teacherId,
        academicYear: query?.academicYear ?? data.student.academicYear,
        academicClassId:
          query?.academicClassId ?? data.student.academicClassId,
        gender: query?.gender ?? data.student.gender,
        joinDate: query?.joinDate ?? data.student.joinDate,
        isActive: query?.isActive
          ? query.isActive === "true"
          : data.student.isActive,
        notes: query?.notes ?? data.student.notes,
      }}
    />
  );
}
