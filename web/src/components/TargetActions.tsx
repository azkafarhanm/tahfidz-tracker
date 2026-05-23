"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cancelTarget, completeTarget } from "@/lib/target-actions";

export default function TargetActions({ targetId }: { targetId: string }) {
  const t = useTranslations("TargetActions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          aria-busy={isPending}
          className="rounded-xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await completeTarget(targetId);
              if (result.ok) {
                router.refresh();
              } else {
                setError(result.error ?? "Error");
              }
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
            setError(null);
            startTransition(async () => {
              const result = await cancelTarget(targetId);
              if (result.ok) {
                router.refresh();
              } else {
                setError(result.error ?? "Error");
              }
            });
          }}
          type="button"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
