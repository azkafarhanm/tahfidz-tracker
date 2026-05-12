import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireSessionScope } from "@/lib/session";
import {
  getStudentSummativeAssessmentForEdit,
  isSemesterValue,
} from "@/lib/summative";
import {
  deleteSummativeAssessmentAction,
  updateSummativeAssessmentAction,
} from "@/app/summative/actions";
import SummativeAssessmentForm from "@/app/summative/SummativeAssessmentForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummativeEditPageProps = {
  params: Promise<{
    studentId: string;
    assessmentId: string;
  }>;
  searchParams?: Promise<{
    semester?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("Summative");
  return { title: `${t("editAssessmentHeading")} - TahfidzFlow` };
}

export default async function SummativeEditPage({
  params,
  searchParams,
}: SummativeEditPageProps) {
  const { studentId, assessmentId } = await params;
  const query = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const t = await getTranslations("Summative");

  if (!teacherId) {
    redirect("/admin");
  }

  const assessment = await getStudentSummativeAssessmentForEdit(
    studentId,
    assessmentId,
    teacherId,
  );

  if (!assessment) {
    redirect(`/summative/${studentId}`);
  }

  const semester = query?.semester && isSemesterValue(query.semester)
    ? query.semester
    : assessment.semester;

  return (
    <AppShell currentPath="/summative" userName={session.user.name} isAdmin={isAdmin}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
            href={`/summative/${studentId}?semester=${semester}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToDetail")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            {t("editAssessmentHeading")}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {assessment.student.fullName} · {assessment.surah.number}. {assessment.surah.name}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
          <PencilLine aria-hidden="true" size={22} strokeWidth={2.3} />
        </div>
      </header>

      <div className="mt-6">
        <SummativeAssessmentForm
          action={updateSummativeAssessmentAction}
          academicYear={assessment.academicYear}
          assessmentId={assessment.id}
          cancelHref={`/summative/${studentId}?semester=${semester}`}
          defaultNotes={assessment.notes}
          defaultScore={assessment.score}
          defaultSemester={assessment.semester}
          defaultSurah={assessment.surah.name}
          studentId={studentId}
        />
      </div>

      <section className="mt-6 rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5 shadow-sm dark:border-rose-900 dark:bg-rose-950/40 dark:shadow-none">
        <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-300">
          {t("deleteHeading")}
        </h2>
        <p className="mt-2 text-sm text-rose-800 dark:text-rose-400">
          {t("deleteDescription", {
            surah: `${assessment.surah.number}. ${assessment.surah.name}`,
          })}
        </p>
        <form action={deleteSummativeAssessmentAction} className="mt-4">
          <input type="hidden" name="assessmentId" value={assessment.id} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="semester" value={assessment.semester} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-950"
          >
            {t("deleteButton")}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
