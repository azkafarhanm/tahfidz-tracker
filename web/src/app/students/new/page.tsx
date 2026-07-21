import Link from "next/link";
import StudentForm from "./StudentForm";
import { createTeacherStudent } from "../actions";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";
import { getActiveAcademicYear, getTeacherProgramContext } from "@/lib/academic-year";
import { getTranslations } from "next-intl/server";
import { backLink } from "@/lib/colors";
import { normalizeAcademicDirectoryGrade } from "@/lib/student-create-return";

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
    programType?: string;
    q?: string;
    page?: string;
    directoryGrade?: string;
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

  const [options, params, academicYear] = await Promise.all([
    getTeacherStudentFormOptions(teacherId),
    searchParams,
    getActiveAcademicYear(),
  ]);

  // Determine default programType from teacher's ClassGroups
  const programContext = await getTeacherProgramContext(teacherId, academicYear);
  const defaultProgramType = params?.programType ?? programContext.resolvedProgramType ?? "ACADEMIC";
  const backHref = defaultProgramType
    ? `/students?programType=${defaultProgramType}`
    : "/students";
  const directoryGrade = normalizeAcademicDirectoryGrade(
    defaultProgramType,
    params?.directoryGrade ?? params?.grade ?? "",
  );

  return (
    <StudentForm
      action={createTeacherStudent}
      backHref={backHref}
      error={params?.error}
      options={options}
      defaultProgramType={defaultProgramType}
      restoreContext
      directoryQ={params?.q ?? ""}
      directoryPage={params?.page ?? ""}
      directoryGrade={directoryGrade}
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
