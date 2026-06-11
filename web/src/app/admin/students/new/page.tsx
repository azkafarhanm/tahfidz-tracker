import StudentForm from "../StudentForm";
import { createStudent } from "../actions";
import { getAdminStudentFormOptions } from "@/lib/admin";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { todayInputValue } from "@/lib/format";
import { requireAdminScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminFormPage");
  return { title: `${t("addStudent")} - Admin - TahfidzFlow` };
}

type NewStudentPageProps = {
  searchParams?: Promise<{
    error?: string;
    fullName?: string;
    teacherId?: string;
    academicClassId?: string;
    gender?: string;
    joinDate?: string;
    isActive?: string;
    notes?: string;
  }>;
};

export default async function NewStudentPage({
  searchParams,
}: NewStudentPageProps) {
  await requireAdminScope();

  const [options, activeAcademicYear, params] = await Promise.all([
    getAdminStudentFormOptions(),
    getActiveAcademicYear(),
    searchParams,
  ]);
  const t = await getTranslations("AdminFormPage");

  return (
    <StudentForm
      action={createStudent}
      backHref="/admin/students"
      backLabel={t("backStudentDirectory")}
      description={t("addStudentDescription")}
      error={params?.error}
      icon="UserPlus"
      activeAcademicYear={activeAcademicYear}
      options={options}
      submitLabel={t("saveStudent")}
      title={t("addStudent")}
      values={{
        fullName: params?.fullName ?? "",
        teacherId: params?.teacherId ?? "",
        academicClassId: params?.academicClassId ?? "",
        gender: params?.gender ?? "",
        joinDate: params?.joinDate ?? todayInputValue(),
        isActive: params?.isActive ? params.isActive === "true" : true,
        notes: params?.notes ?? "",
      }}
    />
  );
}
