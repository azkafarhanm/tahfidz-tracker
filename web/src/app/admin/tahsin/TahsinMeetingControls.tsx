"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState, useTransition } from "react";
import { CalendarDays, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { actionButtonClass } from "@/components/action-button-styles";
import { resetTahsinMeetingTimelineAction } from "@/app/tahsin/actions";
import { createTahsinMeetingFormData } from "@/lib/tahsin-meeting-control-state";

type Props = { canManage: boolean };

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function TahsinMeetingControls({ canManage }: Props) {
  const t = useTranslations("AdminTahsinMeeting");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(todayInputValue);
  const [isResetting, startResetTransition] = useTransition();
  const titleId = useId();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || isResetting) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isResetting, open]);

  function openResetDialog() {
    setMeetingDate(todayInputValue());
    setOpen(true);
  }

  function resetTimeline() {
    startResetTransition(async () => {
      const result = await resetTahsinMeetingTimelineAction(createTahsinMeetingFormData(meetingDate));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("resetSuccess"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-5">
      <button className={actionButtonClass("warning")} disabled={!canManage || isResetting} onClick={openResetDialog} type="button">
        <RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />{t("reset")}
      </button>

      {mounted && open ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => !isResetting && setOpen(false)}>
          <div aria-labelledby={titleId} aria-modal="true" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"><CalendarDays size={20} /></span><div><h2 className="font-semibold text-slate-950 dark:text-white" id={titleId}>{t("resetTitle")}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("meetingDate")}</p></div></div>
              <button aria-label={t("cancel")} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" disabled={isResetting} onClick={() => setOpen(false)} type="button"><X size={18} /></button>
            </div>
            <input className="mt-5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-950" disabled={isResetting} onChange={(event) => setMeetingDate(event.target.value)} required type="date" value={meetingDate} />
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("resetConfirmation", { date: formatMeetingDate(meetingDate) })}</p>
            <div className="mt-5 flex justify-end gap-2"><button className={actionButtonClass("neutral")} disabled={isResetting} onClick={() => setOpen(false)} type="button">{t("cancel")}</button><button className={actionButtonClass("warning")} disabled={isResetting} onClick={resetTimeline} type="button">{isResetting ? t("resetting") : t("resetConfirm")}</button></div>
          </div>
        </div>, document.body,
      ) : null}
    </div>
  );
}
