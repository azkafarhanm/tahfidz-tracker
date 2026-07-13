"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";
import { CalendarDays, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";

type MeetingTimelineItem = {
  meetingNumber: number;
  meetingDate: string;
};

type Props = {
  resetAction: (formData: FormData) => void | Promise<void>;
  timeline: MeetingTimelineItem[];
};

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function FormativeMeetingControls({ resetAction, timeline }: Props) {
  const t = useTranslations("AdminAcademicYear");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(todayInputValue);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  function openResetDialog() {
    setMeetingDate(todayInputValue());
    setOpen(true);
  }

  return (
    <div className="mt-4 space-y-4">
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {timeline.map((meeting) => (
          <li className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" key={meeting.meetingNumber}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("formativeMeetingNumber", { meeting: meeting.meetingNumber })}</p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{formatMeetingDate(meeting.meetingDate)}</p>
          </li>
        ))}
      </ol>

      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={openResetDialog} type="button"><RotateCcw aria-hidden="true" size={15} strokeWidth={2.2} />{t("formativeMeetingReset")}</button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
              <div aria-labelledby={titleId} aria-modal="true" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(event) => event.stopPropagation()} role="dialog">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CalendarDays size={20} /></span><div><h3 className="font-semibold text-slate-950 dark:text-white" id={titleId}>{t("formativeMeetingResetDialogTitle")}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("formativeMeetingResetDateLabel")}</p></div></div>
                  <button aria-label={t("cancel")} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(false)} type="button"><X size={18} /></button>
                </div>
                <form action={resetAction} className="mt-5">
                  <input className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-950" name="meetingDate" onChange={(event) => setMeetingDate(event.target.value)} required type="date" value={meetingDate} />
                  <div className="mt-5 flex justify-end gap-2"><button className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={() => setOpen(false)} type="button">{t("cancel")}</button><button className="min-h-10 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-950" type="submit">{t("formativeMeetingResetConfirm")}</button></div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
