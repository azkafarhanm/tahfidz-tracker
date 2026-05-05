import { notFound } from "next/navigation";
import ClassGroupForm from "../../ClassGroupForm";
import { updateClassGroup } from "../../actions";
import {
  getAdminClassGroupFormData,
  getAdminClassGroupFormOptions,
} from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ubah Halaqah - Admin - TahfidzFlow",
};

type EditClassGroupPageProps = {
  params: Promise<{
    id: string;
  }>;
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

export default async function EditClassGroupPage({
  params,
  searchParams,
}: EditClassGroupPageProps) {
  await requireAdminScope();

  const { id } = await params;
  const [classGroup, options] = await Promise.all([
    getAdminClassGroupFormData(id),
    getAdminClassGroupFormOptions(),
  ]);
  const query = await searchParams;

  if (!classGroup) {
    notFound();
  }

  const action = updateClassGroup.bind(null, classGroup.id);

  return (
    <ClassGroupForm
      action={action}
      backHref="/admin/halaqah"
      backLabel="Halaqah"
      description={`Perbarui data halaqah "${classGroup.name}".`}
      error={query?.error}
      icon="PencilLine"
      submitLabel="Simpan Perubahan"
      academicYears={options.academicYears}
      teachers={options.teachers}
      title="Ubah Halaqah"
      values={{
        name: query?.name ?? classGroup.name,
        description: query?.description ?? classGroup.description,
        level: query?.level ?? classGroup.level,
        teacherId: query?.teacherId ?? classGroup.teacherId,
        academicYear: query?.academicYear ?? classGroup.academicYear,
        grade: query?.grade ?? classGroup.grade,
        isActive: query?.isActive
          ? query.isActive === "true"
          : classGroup.isActive,
      }}
    />
  );
}
