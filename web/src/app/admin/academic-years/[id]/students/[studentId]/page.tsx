import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { getArchivedStudentDetail } from "@/app/admin/academic-years/archive-actions";
import { ArrowLeft, Award, BookOpen, RotateCcw, Target } from "lucide-react";
import ArchivedStudentDeleteButton from "@/components/ArchivedStudentDeleteButton";
import { badge, heroSummary, backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminAcademicYear");
  return { title: `${t("studentArchiveHistory")} - Admin - TahfidzFlow` };
}

type StudentHistoryPageProps = {
  params: Promise<{ id: string; studentId: string }>;
};

export default async function StudentHistoryPage({ params }: StudentHistoryPageProps) {
  await requireAdminScope();
  const { id, studentId } = await params;
  const t = await getTranslations("AdminAcademicYear");

  const data = await getArchivedStudentDetail(id, studentId);
  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link className={backLink} href={`/admin/academic-years/${id}/teachers/${data.student.teacherId}`}>
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToTeacherDetail")}
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{data.student.fullName}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("archivedYearTitle", { year: data.year.year })}
              </p>
            </div>
            <ArchivedStudentDeleteButton
              yearId={id}
              studentId={studentId}
              studentName={data.student.fullName}
            />
          </div>
        </header>

        {/* Identity */}
        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-100">{t("teacher")}</p>
              <p className="mt-1 font-semibold">{data.student.teacherName}</p>
            </div>
            <div>
              <p className="text-emerald-100">{t("program")}</p>
              <p className="mt-1 font-semibold">
                {data.student.programType === "BOARDING" ? "Boarding" : "Akademik"}
              </p>
            </div>
            <div>
              <p className="text-emerald-100">{t("halaqah")}</p>
              <p className="mt-1 font-semibold">
                {data.student.halaqahLevel
                  ? `${data.student.halaqahName} (${data.student.halaqahLevel})`
                  : data.student.halaqahName}
              </p>
            </div>
            <div>
              <p className="text-emerald-100">
                {data.student.programType === "BOARDING" ? t("grade") : t("class")}
              </p>
              <p className="mt-1 font-semibold">{data.student.academicClassName}</p>
            </div>
          </div>
        </section>

        {/* Memorization History */}
        {data.memorizationRecords.length > 0 ? (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
              {t("memorizationHistory")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableSurah")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableRange")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableScore")}</th>
                    <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memorizationRecords.map((r) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={r.id}>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.date}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">{r.surah}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.range}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.score ?? "-"}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${r.status === "Perlu Murojaah" ? badge.warning : badge.success}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Revision History */}
        {data.revisionRecords.length > 0 ? (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <RotateCcw aria-hidden="true" size={20} strokeWidth={2.2} />
              {t("revisionHistory")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableSurah")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableRange")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableScore")}</th>
                    <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revisionRecords.map((r) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={r.id}>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.date}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">{r.surah}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.range}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{r.score ?? "-"}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${r.status === "Perlu Murojaah" ? badge.warning : badge.success}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Targets */}
        {data.targets.length > 0 ? (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target aria-hidden="true" size={20} strokeWidth={2.2} />
              {t("targetHistory")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableType")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableRange")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tablePeriod")}</th>
                    <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.targets.map((tr) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={tr.id}>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{tr.type}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">{tr.range}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{tr.startDate} — {tr.endDate}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${tr.status === "COMPLETED" ? badge.success : tr.status === "ACTIVE" ? badge.progress : badge.neutral}`}>
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Summative Scores */}
        {data.summativeScores.length > 0 ? (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
              {t("summativeHistory")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableSemester")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableSurah")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableScore")}</th>
                    <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summativeScores.map((s) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={s.id}>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{s.semester}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">{s.surahNumber}. {s.surahName}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{s.score}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Tasmi' History */}
        {data.tasmiRecords.length > 0 ? (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Award aria-hidden="true" size={20} strokeWidth={2.2} />
              {t("tasmiHistory")}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableJuz")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableGrade")}</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                    <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">{t("tableExaminer")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasmiRecords.map((tr) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={tr.id}>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{tr.date}</td>
                      <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">Juz {tr.juz}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{tr.grade}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${tr.status === "Lulus" ? badge.success : badge.warning}`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{tr.examinerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* Empty state */}
        {data.memorizationRecords.length === 0 &&
         data.revisionRecords.length === 0 &&
         data.targets.length === 0 &&
         data.summativeScores.length === 0 &&
         data.tasmiRecords.length === 0 ? (
          <section className="mt-6">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("noHistory")}</p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
