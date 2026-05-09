import StudentForm from "./StudentForm";
import { createTeacherStudent } from "../actions";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("StudentFormPage");
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("teacherOnly")}
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
