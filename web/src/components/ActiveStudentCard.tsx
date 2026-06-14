"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, RotateCcw, Target } from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import StudentCardActions from "@/components/StudentCardActions";
import { badge, widget } from "@/lib/colors";

type LatestRecord = {
  date: string;
  range: string;
  status: string;
} | null;

type ActiveStudentCardProps = {
  activeTargetCount: number;
  canManage: boolean;
  classSummary: string;
  fullName: string;
  id: string;
  latestHafalan: LatestRecord;
  latestMurojaah: LatestRecord;
  needsReview: boolean;
};

export default function ActiveStudentCard({
  activeTargetCount,
  canManage,
  classSummary,
  fullName,
  id,
  latestHafalan,
  latestMurojaah,
  needsReview,
}: ActiveStudentCardProps) {
  const t = useTranslations("Students");
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) {
    return null;
  }

  return (
    <article data-highlight={id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <InitialsAvatar name={fullName} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950 dark:text-white">
              {fullName}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {classSummary}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${needsReview ? badge.warning : badge.success}`}
        >
          {needsReview ? t("badgeNeedsReview") : t("badgeAktif")}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className={`flex items-start gap-3 rounded-2xl p-3 ${widget.elevated}`}>
          <BookOpen
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-400"
            size={17}
            strokeWidth={2.2}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("latestHafalanLabel")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {latestHafalan?.range ?? t("noRecordYet")}
            </p>
            {latestHafalan ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {latestHafalan.date} - {latestHafalan.status}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`flex items-start gap-3 rounded-2xl p-3 ${widget.elevated}`}>
          <RotateCcw
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-400"
            size={17}
            strokeWidth={2.2}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("latestMurojaahLabel")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {latestMurojaah?.range ?? t("noRecordYet")}
            </p>
            {latestMurojaah ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {latestMurojaah.date} - {latestMurojaah.status}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
        <span className="inline-flex min-w-0 items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
          <Target aria-hidden="true" size={16} strokeWidth={2.2} />
          {activeTargetCount} {t("targetCountLabel")}
        </span>
        <StudentCardActions
          canManage={canManage}
          isActive
          onStatusChanged={() => setIsHidden(true)}
          studentId={id}
          studentName={fullName}
        />
      </div>
    </article>
  );
}
