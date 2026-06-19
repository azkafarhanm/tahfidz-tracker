import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdminScope } from "@/lib/session";
import { getArchivedYearDetail, getBulkDeletionImpact, getYearDeletionCheck } from "../archive-actions";
import { ArrowLeft, Download, Eye, FileText, AlertTriangle, Users } from "lucide-react";
import ExportSection from "@/components/ExportSection";
import ProgramSelector from "@/components/ProgramSelector";
import BulkDeleteStudentsButton from "@/components/BulkDeleteStudentsButton";
import DeleteAcademicYearButton from "@/components/DeleteAcademicYearButton";
import { badge, heroSummary, backLink } from "@/lib/colors";
import { programTypeLabels } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminAcademicYear");
  return { title: `${t("archivedYearDetail")} - Admin - TahfidzFlow` };
}

type ArchivedYearPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ programType?: string }>;
};

export default async function ArchivedYearPage({ params, searchParams }: ArchivedYearPageProps) {
  await requireAdminScope();
  const { id } = await params;
  const sp = await searchParams;
  const t = await getTranslations("AdminAcademicYear");

  const programType = sp?.programType || undefined;

  const [data, bulkImpactResult, yearCheckResult] = await Promise.all([
    getArchivedYearDetail(id, programType),
    getBulkDeletionImpact(id),
    getYearDeletionCheck(id),
  ]);

  if (!data) {
    notFound();
  }

  const bulkImpact = bulkImpactResult.ok ? bulkImpactResult.impact : null;
  const yearCheck = yearCheckResult.ok ? yearCheckResult.check : null;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link className={backLink} href="/admin/academic-years">
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backToAcademicYears")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">
            {t("archivedYearTitle", { year: data.year.year })}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {data.year.startDate} — {data.year.endDate}
          </p>
          <div className="mt-3">
            <ProgramSelector
              programs={["", "ACADEMIC", "BOARDING"]}
              programTypeLabels={{ "": "Semua", ...programTypeLabels }}
              currentProgramType={programType ?? ""}
            />
          </div>
        </header>

        {/* Summary */}
        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("totalTeachers")}</p>
              <p className="mt-3 text-4xl font-semibold">{data.summary.totalTeachers}</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">{t("totalStudents")}</p>
                <p className="mt-1 text-xl font-semibold">{data.summary.totalStudents}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">{t("totalHalaqah")}</p>
                <p className="mt-1 text-xl font-semibold">{data.summary.totalClassGroups}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Teacher Cards */}
        {data.teachers.length > 0 ? (
          <section className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("teachersHeading")}</h2>
            {data.teachers.map((teacher) => (
              <article
                key={teacher.teacherId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {teacher.teacherName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span>{t("studentsCount", { count: teacher.totalStudents })}</span>
                      <span>·</span>
                      <span>{t("halaqahCount", { count: teacher.totalClassGroups })}</span>
                    </div>
                    {teacher.classGroups.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {teacher.classGroups.map((cg) => (
                          <span
                            key={cg.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight ${cg.programType === "BOARDING" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : badge.success}`}
                          >
                            {!programType && (
                              <span className="opacity-70">{cg.programType === "BOARDING" ? "B" : "A"} · </span>
                            )}
                            {t("gradeLabel", { grade: cg.grade })}{cg.level ? ` ${cg.level}` : ""} · {cg.studentCount}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      href={`/admin/academic-years/${id}/teachers/${teacher.teacherId}`}
                    >
                      <Eye aria-hidden="true" size={14} strokeWidth={2.2} />
                      {t("viewDetail")}
                    </Link>
                    <ExportSection
                      excelHref={`/api/reports/export-teacher?teacherId=${teacher.teacherId}&academicYear=${data.year.year}${programType ? `&programType=${programType}` : ""}`}
                      excelClassName="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
                      excelContent={
                        <>
                          <Download aria-hidden="true" size={14} strokeWidth={2.2} />
                          {t("exportExcel")}
                        </>
                      }
                      pdfHref={`/api/reports/pdf-teacher?teacherId=${teacher.teacherId}&academicYear=${data.year.year}${programType ? `&programType=${programType}` : ""}`}
                      pdfClassName="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      pdfContent={
                        <>
                          <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
                          {t("exportPdf")}
                        </>
                      }
                    />
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <Users className="mx-auto text-slate-400 dark:text-slate-500" size={32} />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t("noTeachers")}</p>
            </div>
          </section>
        )}

        {/* Danger Zone */}
        <section className="mt-10">
          <div className="rounded-2xl border-2 border-red-200 bg-white p-4 shadow-sm dark:border-red-900/50 dark:bg-slate-900 dark:shadow-none sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                <AlertTriangle aria-hidden="true" size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                  {t("dangerZone")}
                </h2>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t("dangerZoneDescription")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Bulk Delete Students */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t("bulkDelete")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {bulkImpact
                      ? `${bulkImpact.studentCount} ${t("impactSantri")}, ${bulkImpact.memorizationCount} ${t("impactHafalan")}, ${bulkImpact.revisionCount} ${t("impactMurojaah")}`
                      : t("noStudentsToDelete")}
                  </p>
                </div>
                {bulkImpact && (
                  <BulkDeleteStudentsButton yearId={id} impact={bulkImpact} />
                )}
              </div>

              {/* Delete Academic Year */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t("deleteYear")}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {yearCheck?.canDelete
                      ? t("confirmDeleteYearMessage", { year: data.year.year })
                      : t("yearStillHasData")}
                  </p>
                </div>
                {yearCheck && (
                  <DeleteAcademicYearButton
                    yearId={id}
                    yearName={data.year.year}
                    check={yearCheck}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
