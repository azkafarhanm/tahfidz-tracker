import Link from "next/link";
import { ArrowLeft, Download, FileText, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAdminReportData } from "@/lib/reports";
import ExportSection from "@/components/ExportSection";
import ProgramSelector from "@/components/ProgramSelector";
import { badge, statCard, statValue, statLabel, heroSummary, backLink } from "@/lib/colors";
import { ProgramType } from "@/generated/prisma-next/enums";
import { programTypeLabels, programTypeOptions } from "@/lib/format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("AdminReports");
  return { title: `${t("heading")} - TahfidzFlow` };
}

type AdminReportsPageProps = {
  searchParams?: Promise<{
    programType?: string;
  }>;
};

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const t = await getTranslations("AdminReports");
  const params = await searchParams;
  const programType = (params?.programType as ProgramType) || ProgramType.ACADEMIC;

  const data = await getAdminReportData(undefined, programType);

  return (
    <>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              className={backLink}
              href="/admin"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold">{t("heading")}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
            <div className="mt-2">
              <ProgramSelector
                programs={programTypeOptions.map((o) => o.value)}
                programTypeLabels={programTypeLabels}
                currentProgramType={programType ?? ProgramType.ACADEMIC}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportSection
              excelHref={`/api/reports/export-admin${programType ? `?programType=${programType}` : ""}`}
              excelClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
              excelContent={
                <>
                  <Download aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("excelButton")}
                </>
              }
              pdfHref={`/api/reports/pdf-admin${programType ? `?programType=${programType}` : ""}`}
              pdfClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
              pdfContent={
                <>
                  <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("pdfButton")}
                </>
              }
            />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
            </div>
          </div>
        </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("totalRecordsLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {data.totalHafalan + data.totalMurojaah}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {t("recordsSplit", { hafalan: data.totalHafalan, murojaah: data.totalMurojaah })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">{t("teacherLabel")}</p>
                <p className="mt-1 text-xl font-semibold">{data.totalTeachers}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">{t("studentLabel")}</p>
                <p className="mt-1 text-xl font-semibold">{data.totalStudents}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("activeTeachersLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>{data.totalTeachers}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.success}`}>
            <p className={`text-xs font-medium ${statLabel.success}`}>{t("activeStudentsLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.success}`}>{data.totalStudents}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("totalHafalanLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>{data.totalHafalan}</p>
          </article>
          <article className={`rounded-2xl border p-4 shadow-sm ${statCard.progress}`}>
            <p className={`text-xs font-medium ${statLabel.progress}`}>{t("totalMurojaahLabel")}</p>
            <p className={`mt-2 text-2xl font-semibold ${statValue.progress}`}>{data.totalMurojaah}</p>
          </article>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("teacherSummaryHeading")}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.success}`}>
              {t("teacherCount", { count: data.teachers.length })}
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableTeacherName")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableEmail")}</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableStudentCount")}</th>
                  <th className="pb-3 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableHalaqahCount")}</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((teacher) => (
                  <tr className="border-b border-slate-100 dark:border-slate-800" key={teacher.id}>
                    <td className="py-3 pr-4 font-medium text-slate-950 dark:text-white">{teacher.fullName}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{teacher.email}</td>
                    <td className="py-3 pr-4 text-center text-slate-900 dark:text-slate-100">{teacher.studentCount}</td>
                    <td className="py-3 text-center text-slate-900 dark:text-slate-100">{teacher.classGroupCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </>
  );
}
