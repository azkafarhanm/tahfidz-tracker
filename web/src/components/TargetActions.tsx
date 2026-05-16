"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { cancelTarget, completeTarget } from "@/lib/target-actions";

export default function TargetActions({ targetId }: { targetId: string }) {
  const t = useTranslations("TargetActions");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        aria-busy={isPending}
        className="rounded-xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await completeTarget(targetId);
          });
        }}
        type="button"
      >
        {t("complete")}
      </button>
      <button
        aria-busy={isPending}
        className="rounded-xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await cancelTarget(targetId);
          });
        }}
        type="button"
      >
        {t("cancel")}
      </button>
    </div>
  );
}
