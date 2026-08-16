import { redirect } from "next/navigation";
import { CalendarDays, Download } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import AppShell from "@/components/AppShell";
import ExportSection from "@/components/ExportSection";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { requireSessionScope } from "@/lib/session";
import { getActiveTahsinMeeting, getTahsinForTeacher, getTahsinStudents } from "@/lib/tahsin";
import { formatTahsinMeetingDate } from "@/lib/tahsin-date-format";
import TahsinQuickEntry from "./TahsinQuickEntry";
import TahsinHistory from "./TahsinHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TahsinPage() {
  const scope = await requireSessionScope();
  if (scope.isAdmin || !scope.teacherId) redirect("/");
  const [students, academicYear, t, locale] = await Promise.all([
    getTahsinStudents({ isAdmin: false, teacherId: scope.teacherId }),
    getActiveAcademicYear(),
    getTranslations("TahsinPanel"),
    getLocale(),
  ]);
  const semester = getSemesterForDate(new Date());
  const [meeting, history] = await Promise.all([
    getActiveTahsinMeeting(academicYear, semester),
    getTahsinForTeacher({ isAdmin: false, teacherId: scope.teacherId }, { academicYear, semester }),
  ]);
  const semesterLabel = semester === "GANJIL" ? t("oddSemester") : t("evenSemester");
  const excelHref = `/api/reports/export-tahsin?semester=${semester}&classLevel=7&programType=ACADEMIC`;
  return <AppShell currentPath="/tahsin" userName={scope.session.user.name} isAdmin={false}>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t("academicGrade")}</p><h1 className="mt-1 text-2xl font-semibold">{t("title")}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("description")}</p></div><ExportSection excelHref={excelHref} excelClassName="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white" excelContent={<><Download size={15} />{t("exportExcel")}</>} /></header>
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-300" size={20} /><div><h2 className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">{t("activeMeeting")}</h2>{meeting ? <><p className="mt-1 text-base font-semibold text-emerald-950 dark:text-emerald-100">{t("meetingOnly", { meeting: meeting.meetingNumber })}</p><p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{formatTahsinMeetingDate(meeting.meetingDate, locale)}</p><p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{academicYear} · {semesterLabel}</p></> : <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{t("noMeeting")}</p>}</div></div></section>
    <TahsinQuickEntry students={students} />
    <TahsinHistory locale={locale} records={history} />
  </AppShell>;
}
