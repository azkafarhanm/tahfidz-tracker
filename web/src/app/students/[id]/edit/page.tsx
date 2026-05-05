import EditStudentForm from "./EditStudentForm";
import { updateTeacherStudent } from "./actions";
import { getStudentFormContext } from "@/lib/students";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Santri - TahfidzFlow",
};

type EditStudentPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function EditStudentPage({
  params,
  searchParams,
}: EditStudentPageProps) {
  const { id } = await params;
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <p className="text-sm text-slate-600">
          Hanya guru yang dapat mengedit santri.
        </p>
      </div>
    );
  }

  const [context, options, pageParams] = await Promise.all([
    getStudentFormContext(id, teacherId),
    getTeacherStudentFormOptions(teacherId),
    searchParams,
  ]);

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <p className="text-sm text-slate-600">Santri tidak ditemukan.</p>
      </div>
    );
  }

  const boundAction = updateTeacherStudent.bind(null, id);

  return (
    <EditStudentForm
      action={boundAction}
      backHref={`/students/${id}`}
      error={pageParams?.error}
      options={options}
      values={{
        fullName: context.fullName,
        academicClassId: context.academicClassId,
        gender: context.gender,
        joinDate: context.joinDateRaw,
        notes: context.notes,
        classGroupLevel: context.classGroupLevel,
        classGroupGrade: context.classGroupGrade,
      }}
    />
  );
}
