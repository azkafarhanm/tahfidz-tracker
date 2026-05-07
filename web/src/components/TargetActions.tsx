"use client";

import { useTransition } from "react";
import { cancelTarget, completeTarget } from "@/lib/target-actions";

export default function TargetActions({ targetId }: { targetId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await completeTarget(targetId);
          });
        }}
        type="button"
      >
        Selesai
      </button>
      <button
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await cancelTarget(targetId);
          });
        }}
        type="button"
      >
        Batalkan
      </button>
    </div>
  );
}
