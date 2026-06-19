import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { getArchivedTeacherDetail } from "@/app/admin/academic-years/archive-actions";
import { ArrowLeft, Eye } from "lucide-react";
import ProgramSelector from "@/components/ProgramSelector";
import ArchivedStudentDeleteButton from "@/components/ArchivedStudentDeleteButton";
import { badge, statCard, statValue, statLabel, backLink } from "@/lib/colors";
import { programTypeLabels } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminAcademicYear");
  return { title: `${t("teacherArchiveDetail")} - Admin - TahfidzFlow` };
}

type TeacherArchivePageProps = {
  params: Promise<{ id: string; teacherId: string }>;
  searchParams?: Promise<{ programType?: string }>;
};

export default async function TeacherArchivePage({ params, searchParams }: TeacherArchivePageProps) {
  await requireAdminScope();
  const { id, teacherId } = await params;
  const sp = await searchParams;
  const t = await getTranslations("AdminAcademicYear");

  const programType = sp?.programType || undefined;

  const data = await getArchivedTeacherDetail(id, teacherId, programType);
  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link className={backLink} href={`/admin/academic-years/${id}`}>
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToArchivedYear")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">{data.teacher.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("archivedYearTitle", { year: data.year.year })}
          </p>
          <div className="mt-3">
            <ProgramSelector
              programs={["", "ACADEMIC", "BOARDING"]}
              programTypeLabels={{ "": "Semua", ...programTypeLabels }}
              currentProgramType={programType ?? ""}
            />
          </div>
        </header>

        {/* Summary Stats */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("totalStudents")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>{data.summary.totalStudents}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.info}`}>
            <p className={`text-xs font-medium ${statLabel.info}`}>{t("totalHalaqah")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.info}`}>{data.summary.totalClassGroups}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("totalMemorization")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>{data.summary.totalMemorization}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("totalRevision")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>{data.summary.totalRevision}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.warning}`}>
            <p className={`text-xs font-medium ${statLabel.warning}`}>{t("totalSummative")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.warning}`}>{data.summary.totalSummativeScores}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.neutral}`}>
            <p className={`text-xs font-medium ${statLabel.neutral}`}>{t("averageScore")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.neutral}`}>{data.summary.averageScore ?? "-"}</p>
          </article>
        </section>

        {/* Halaqah Groups */}
        {data.halaqahGroups.length > 0 ? (
          <section className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("halaqahHeading")}</h2>
            {data.halaqahGroups.map((group) => (
              <article
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {!programType && (
                        <span className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight ${group.programType === "BOARDING" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
                          {group.programType === "BOARDING" ? "BOARDING" : "ACADEMIC"}
                        </span>
                      )}
                      {t("gradeLabel", { grade: group.grade })}{group.level ? ` ${group.level}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {group.studentCount} {t("students")}
                    </p>
                  </div>
                  {group.level && group.programType !== "BOARDING" && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${badge.success}`}>
                      {group.level}
                    </span>
                  )}
                </div>

                {/* Student list */}
                {group.students.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                          <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableName")}</th>
                          <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">
                            {group.programType === "BOARDING" ? t("tableBoardingClass") : t("tableAcademicClass")}
                          </th>
                          <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableLastMem")}</th>
                          <th className="pb-2 pr-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableLastRev")}</th>
                          <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300" colSpan={2}>{t("tableAction")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.students.map((s) => (
                          <tr className="border-b border-slate-100 dark:border-slate-800" key={s.id}>
                            <td className="py-2.5 pr-3 font-medium text-slate-950 dark:text-white">{s.fullName}</td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{s.academicClassName}</td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">
                              {s.latestMem ? s.latestMem.range : "-"}
                            </td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">
                              {s.latestRev ? s.latestRev.range : "-"}
                            </td>
                            <td className="py-2.5 pr-2">
                              <Link
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
                                href={`/admin/academic-years/${id}/students/${s.id}`}
                              >
                                <Eye aria-hidden="true" size={12} strokeWidth={2.2} />
                                {t("viewHistory")}
                              </Link>
                            </td>
                            <td className="py-2.5">
                              <ArchivedStudentDeleteButton
                                yearId={id}
                                studentId={s.id}
                                studentName={s.fullName}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("noHalaqah")}</p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
