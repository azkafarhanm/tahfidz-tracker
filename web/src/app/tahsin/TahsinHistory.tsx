"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { getVisibleTahsinHistory, toggleTahsinHistoryExpanded } from "@/lib/tahsin-history-state";
import TahsinRecordActions from "./TahsinRecordActions";

type HistoryRecord = {
  id: string;
  jilid: number;
  startPage: number;
  endPage: number | null;
  score: number | null;
  status: string;
  notes: string | null;
  date: Date;
  meeting: { meetingNumber: number } | null;
  student: { fullName: string };
};

function formatPageRange(startPage: number, endPage: number | null) {
  return endPage === null || endPage === startPage ? String(startPage) : `${startPage}–${endPage}`;
}

export default function TahsinHistory({ locale, records }: { locale: string; records: HistoryRecord[] }) {
  const t = useTranslations("TahsinPanel");
  const [expanded, setExpanded] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const visibleRecords = getVisibleTahsinHistory(records, expanded);

  useEffect(() => {
    function handleCreated(event: Event) {
      const recordId = (event as CustomEvent<{ recordId?: string }>).detail?.recordId;
      if (!recordId) return;
      setHighlightedId(recordId);
      const timeout = window.setTimeout(() => setHighlightedId(null), 4000);
      return () => window.clearTimeout(timeout);
    }
    window.addEventListener("tahsin-record-created", handleCreated);
    return () => window.removeEventListener("tahsin-record-created", handleCreated);
  }, []);

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("historyTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("historyDescription")}</p>
        </div>
        {records.length > 5 ? <button aria-expanded={expanded} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={() => setExpanded(toggleTahsinHistoryExpanded)} type="button">{expanded ? <ChevronUp aria-hidden="true" size={15} /> : <ChevronDown aria-hidden="true" size={15} />}{expanded ? t("hideAll") : t("showAll", { count: records.length })}</button> : null}
      </div>
      {records.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">{t("historyEmpty")}</p> : (
        <div className="mt-4 space-y-3">
          {visibleRecords.map((record) => (
            <article className={`rounded-2xl border p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 dark:shadow-none ${highlightedId === record.id ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50" : "border-slate-200 bg-white"}`} key={record.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <BookOpen aria-hidden="true" size={17} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{record.student.fullName}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{record.meeting ? t("meetingOnly", { meeting: record.meeting.meetingNumber }) : t("legacy")}</p>
                  </div>
                </div>
                <time className="shrink-0 pt-1 text-xs text-slate-500 dark:text-slate-400">{record.date.toLocaleDateString(locale)}</time>
              </div>
              <p className="mt-3 text-sm">{t("volume")} {record.jilid} · {t("pages")} {formatPageRange(record.startPage, record.endPage)} · {t("score")} {record.score ?? "-"} · {record.status}</p>
              {record.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{record.notes}</p> : null}
              <div className="mt-3 flex justify-end">
                <TahsinRecordActions record={record} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
