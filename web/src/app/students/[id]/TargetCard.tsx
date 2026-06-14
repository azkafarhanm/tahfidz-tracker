"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, PencilLine } from "lucide-react";
import { actionButtonClass } from "@/components/action-button-styles";
import { badge } from "@/lib/colors";
import TargetActions from "@/components/TargetActions";

type TargetItem = {
  id: string;
  type: string;
  range: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  timeProgress: number;
  isOverdue: boolean;
  ayahProgress: number;
  coveredAyahs: number;
  totalAyahs: number;
};

export default function TargetCard({
  target,
  studentId,
}: {
  target: TargetItem;
  studentId: string;
}) {
  const t = useTranslations("StudentDetail");
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <article data-highlight={target.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{target.type}</p>
          <p className="mt-1 truncate font-semibold text-slate-950 dark:text-white">
            {target.range}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            className={actionButtonClass("neutral")}
            href={`/students/${studentId}/targets/${target.id}/edit`}
            title={t("editTargetTitle")}
          >
            <PencilLine aria-hidden="true" size={13} strokeWidth={2.2} />
            {t("editButton")}
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              target.isOverdue ? badge.error : badge.success
            }`}
          >
            {target.isOverdue ? t("targetBadgeOverdue") : t("targetBadgeAktif")}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={13} strokeWidth={2.2} />
            {target.startDate} - {target.endDate}
          </span>
          <span className="font-medium">
            {target.coveredAyahs}/{target.totalAyahs} {t("targetAyahProgress")}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              target.ayahProgress >= 100
                ? "bg-emerald-500"
                : target.isOverdue
                  ? "bg-red-400"
                  : target.ayahProgress > 75
                    ? "bg-amber-400"
                    : "bg-emerald-400"
            }`}
            style={{ width: `${target.ayahProgress}%` }}
          />
        </div>
      </div>

      {target.notes ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {target.notes}
        </p>
      ) : null}

      <TargetActions targetId={target.id} onActionSuccess={() => setHidden(true)} />
    </article>
  );
}
