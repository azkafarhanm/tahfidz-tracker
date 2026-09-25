import { redirect } from "next/navigation";
import { CalendarDays, Download } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import AppShell from "@/components/AppShell";
import ExportSection from "@/components/ExportSection";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { requireSessionScope } from "@/lib/session";
import {
  getActiveTahsinMeeting,
  getTahsinForTeacher,
  getTahsinHalaqahMeetingSummaries,
  getTahsinStudents,
  getTahsinSurahOptions,
} from "@/lib/tahsin";
import { formatTahsinMeetingDate } from "@/lib/tahsin-date-format";
import TahsinQuickEntry from "./TahsinQuickEntry";
import TahsinHistory from "./TahsinHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TahsinPage() {
  const scope = await requireSessionScope();
  if (scope.isAdmin || !scope.teacherId) redirect("/");
  const actor = { isAdmin: false, teacherId: scope.teacherId };
  const semester = getSemesterForDate(new Date());
  const [students, academicYear, t, locale, surahs, halaqahMeetings] = await Promise.all([
    getTahsinStudents(actor),
    getActiveAcademicYear(),
    getTranslations("TahsinPanel"),
    getLocale(),
    getTahsinSurahOptions(),
    getTahsinHalaqahMeetingSummaries(actor, semester),
  ]);
  const grades = [...new Set(students.map((student) => student.classGroup.grade))].sort((left, right) => left - right);
  const teachesGrade7 = grades.includes(7);
  const [meeting, history] = await Promise.all([
    teachesGrade7 ? getActiveTahsinMeeting(academicYear, semester) : Promise.resolve(null),
    getTahsinForTeacher(actor, { academicYear, semester }),
  ]);
  const semesterLabel = semester === "GANJIL" ? t("oddSemester") : t("evenSemester");
  const exportGrades = grades.length > 0 ? grades : [7];

  return <AppShell currentPath="/tahsin" userName={scope.session.user.name} isAdmin={false}>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t("academicGrade")}</p>
        <h1 className="mt-1 text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("description")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {exportGrades.map((grade) => (
          <ExportSection
            excelClassName="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white"
            excelContent={<><Download size={15} />{exportGrades.length > 1 ? t("exportGrade", { grade }) : t("exportExcel")}</>}
            excelHref={`/api/reports/export-tahsin?semester=${semester}&classLevel=${grade}&programType=ACADEMIC`}
            key={grade}
          />
        ))}
      </div>
    </header>
    <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-300" size={20} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">{t("activeMeeting")}</h2>
          {teachesGrade7 ? (
            meeting ? <>
              <p className="mt-1 text-base font-semibold text-emerald-950 dark:text-emerald-100">{halaqahMeetings.length > 0 ? t("grade7Meeting", { meeting: meeting.meetingNumber }) : t("meetingOnly", { meeting: meeting.meetingNumber })}</p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{formatTahsinMeetingDate(meeting.meetingDate, locale)}</p>
            </> : <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{t("noMeeting")}</p>
          ) : null}
          {halaqahMeetings.map((halaqah) => (
            <div className="mt-2" key={halaqah.classGroupId}>
              <p className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
                {halaqah.latestMeeting
                  ? t("halaqahMeeting", { grade: halaqah.grade, meeting: halaqah.latestMeeting.meetingNumber })
                  : t("halaqahNoMeeting", { grade: halaqah.grade })}
              </p>
              {halaqah.latestMeeting ? <p className="mt-0.5 text-sm text-emerald-800 dark:text-emerald-300">{formatTahsinMeetingDate(halaqah.latestMeeting.meetingDate, locale)}</p> : null}
            </div>
          ))}
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{academicYear} · {semesterLabel}</p>
          {halaqahMeetings.length > 0 ? <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{t("halaqahMeetingHint")}</p> : null}
        </div>
      </div>
    </section>
    <TahsinQuickEntry students={students} surahs={surahs} />
    <TahsinHistory locale={locale} records={history} surahs={surahs} />
  </AppShell>;
}
