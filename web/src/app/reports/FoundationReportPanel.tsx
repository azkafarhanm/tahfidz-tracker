"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Download, FileText, Landmark, RotateCcw } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import ExportSection from "@/components/ExportSection";
import { markFoundationReportedAction, undoFoundationReportAction } from "./foundation-actions";

type FoundationReportPanelProps = {
  today: string;
  suggested: { from: string; to: string };
  last: { periodStart: string; periodEnd: string } | null;
};

function nextDay(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Downloads the Boarding report for the foundation and records when a report
 * was handed in. Only the explicit "mark as reported" button closes a period,
 * so downloading to check a file never moves the next report's start date.
 */
export default function FoundationReportPanel({ today, suggested, last }: FoundationReportPanelProps) {
  const t = useTranslations("Reports");
  const locale = useLocale();
  const router = useRouter();
  const [from, setFrom] = useState(suggested.from);
  const [to, setTo] = useState(suggested.to);
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const formatDay = (dayKey: string) => formatter.format(new Date(`${dayKey}T00:00:00.000Z`));
  const period = `${formatDay(from)} – ${formatDay(to)}`;
  const valid = Boolean(from) && Boolean(to) && from <= to && to <= today;
  const query = `from=${from}&to=${to}`;
  const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Landmark aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("foundationHeading")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("foundationDescription")}</p>
          <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {last
              ? t("foundationLast", { period: `${formatDay(last.periodStart)} – ${formatDay(last.periodEnd)}` })
              : t("foundationNever")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">{t("foundationFrom")}
          <input className={inputClass} max={to || today} onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
        </label>
        <label className="text-sm font-medium">{t("foundationTo")}
          <input className={inputClass} max={today} min={from} onChange={(event) => setTo(event.target.value)} type="date" value={to} />
        </label>
      </div>
      {!valid ? <p className="mt-2 text-xs text-red-700 dark:text-red-400">{t("foundationInvalid")}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {valid ? (
          <ExportSection
            excelClassName="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
            excelContent={<><Download aria-hidden="true" size={16} strokeWidth={2.2} />{t("excelButton")}</>}
            excelHref={`/api/reports/foundation-excel?${query}`}
            pdfClassName="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            pdfContent={<><FileText aria-hidden="true" size={16} strokeWidth={2.2} />{t("pdfButton")}</>}
            pdfHref={`/api/reports/foundation-pdf?${query}`}
          />
        ) : null}
        <ConfirmActionDialogButton
          cancelLabel={t("foundationCancel")}
          confirmLabel={t("foundationMarkConfirm")}
          confirmMessage={t("foundationMarkMessage", { period, next: formatDay(nextDay(to)) })}
          dialogTitle={t("foundationMarkTitle")}
          disabled={!valid}
          icon={<CheckCircle2 aria-hidden="true" size={16} />}
          label={t("foundationMark")}
          onAction={() => markFoundationReportedAction(from, to)}
          onSuccess={() => router.refresh()}
          pendingLabel={t("foundationSaving")}
          tone="success"
        />
        {last ? (
          <ConfirmActionDialogButton
            cancelLabel={t("foundationCancel")}
            confirmLabel={t("foundationUndoConfirm")}
            confirmMessage={t("foundationUndoMessage", { period: `${formatDay(last.periodStart)} – ${formatDay(last.periodEnd)}` })}
            dialogTitle={t("foundationUndoTitle")}
            icon={<RotateCcw aria-hidden="true" size={16} />}
            label={t("foundationUndo")}
            onAction={() => undoFoundationReportAction()}
            onSuccess={() => router.refresh()}
            pendingLabel={t("foundationSaving")}
            tone="warning"
          />
        ) : null}
      </div>
    </section>
  );
}
