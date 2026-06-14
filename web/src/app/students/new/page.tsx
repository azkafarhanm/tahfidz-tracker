import Link from "next/link";
import StudentForm from "./StudentForm";
import { createTeacherStudent } from "../actions";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("StudentForm");
  return { title: `${t("title")} - TahfidzFlow` };
}

type NewStudentPageProps = {
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    classGroupId?: string;
    halaqahLevel?: string;
    grade?: string;
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("teacherOnly")}
        </p>
        <Link
          className={backLink}
          href="/"
        >
          &larr; TahfidzFlow
        </Link>
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
        halaqahLevel: params?.halaqahLevel ?? "",
        grade: params?.grade ?? "",
        academicClassId: params?.academicClassId ?? "",
        gender: params?.gender ?? "",
        joinDate: params?.joinDate ?? todayInputValue(),
        notes: params?.notes ?? "",
      }}
    />
  );
}
