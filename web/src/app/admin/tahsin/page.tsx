import Link from "next/link";
import { CalendarDays, Layers3, RotateCcw } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import TahsinMeetingControls from "./TahsinMeetingControls";
import { getActiveAcademicYear, getSemesterForDate } from "@/lib/academic-year";
import { getActiveTahsinMeeting } from "@/lib/tahsin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export async function generateMetadata() {
  const t = await getTranslations("AdminTahsinMeeting");
  return { title: `${t("title")} - Admin - TahfidzFlow` };
}

export default async function AdminTahsinMeetingPage() {
  const now = new Date();
  const [academicYear, t, locale] = await Promise.all([
    getActiveAcademicYear(),
    getTranslations("AdminTahsinMeeting"),
    getLocale(),
  ]);
  const semester = getSemesterForDate(now);
  const meeting = await getActiveTahsinMeeting(academicYear, semester);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white" href="/admin">
            {t("backToAdmin")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("description")}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CalendarDays aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-base font-semibold">{t("activeContext")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("contextDescription")}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("academicYear")}</dt>
              <dd className="mt-1 text-sm font-semibold">{academicYear}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("semester")}</dt>
              <dd className="mt-1 text-sm font-semibold">{semester === "GANJIL" ? t("oddSemester") : t("evenSemester")}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("run")}</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-semibold"><Layers3 aria-hidden="true" size={15} />{meeting ? t("runValue", { run: meeting.timeline.runNumber }) : t("unavailable")}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("activeMeeting")}</dt>
              <dd className="mt-1 text-sm font-semibold">{meeting ? t("meetingValue", { meeting: meeting.meetingNumber }) : t("unavailable")}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800 sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("meetingDate")}</dt>
              <dd className="mt-1 text-sm font-semibold">{meeting ? formatDate(meeting.meetingDate, locale) : t("unavailable")}</dd>
            </div>
          </dl>

          {meeting ? (
            <TahsinMeetingControls canManage />
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              <RotateCcw aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
              <p>{t("noActiveMeeting")}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
