import EditStudentForm from "./EditStudentForm";
import { updateTeacherStudent } from "./actions";
import { getStudentFormContext } from "@/lib/students";
import { getTeacherStudentFormOptions } from "@/lib/students";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("StudentFormPage");
  const { id } = await params;
  const { teacherId } = await requireSessionScope();

  if (!teacherId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("teacherOnlyEdit")}
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] dark:bg-[#0c0f1a]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("notFound")}
        </p>
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
