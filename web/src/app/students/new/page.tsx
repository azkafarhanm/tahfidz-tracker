import StudentForm from "./StudentForm";
import { createTeacherStudent } from "../actions";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tambah Santri - TahfidzFlow",
};

type NewStudentPageProps = {
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    classGroupId?: string;
    academicClassId?: string;
    gender?: string;
    joinDate?: string;
    notes?: string;
  }>;
};

export default async function NewStudentPage({
  searchParams,
}: NewStudentPageProps) {
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <p className="text-sm text-slate-600">
          Hanya guru yang dapat menambah santri.
        </p>
      </div>
    );
  }

  const [options, params] = await Promise.all([
    getTeacherStudentFormOptions(teacherId),
    searchParams,
  ]);

  return (
    <StudentForm
      action={createTeacherStudent}
      backHref="/students"
      error={params?.error}
      options={options}
      values={{
        fullName: params?.fullName ?? "",
        classGroupId: params?.classGroupId ?? "",
        academicClassId: params?.academicClassId ?? "",
        gender: params?.gender ?? "",
        joinDate: params?.joinDate ?? todayInputValue(),
        notes: params?.notes ?? "",
      }}
    />
  );
}
