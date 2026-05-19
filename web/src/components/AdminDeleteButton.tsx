"use client";

import { useId, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

type AdminDeleteButtonProps = {
  action: () => Promise<void>;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  deletingLabel: string;
  confirmMessage: string;
  disabled?: boolean;
  disabledReason?: string;
};

export default function AdminDeleteButton({
  action,
  label,
  confirmLabel,
  cancelLabel,
  deletingLabel,
  confirmMessage,
  disabled = false,
  disabledReason,
}: AdminDeleteButtonProps) {
  const reasonId = useId();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (disabled) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <button
          aria-disabled="true"
          aria-describedby={disabledReason ? reasonId : undefined}
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-rose-100 px-4 text-sm font-semibold text-rose-400 opacity-70 focus:outline-none focus:ring-4 focus:ring-rose-100 dark:border-rose-950 dark:text-rose-500 dark:focus:ring-rose-950"
          onClick={(event) => event.preventDefault()}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} strokeWidth={2.2} />
          {label}
        </button>
        {disabledReason ? (
          <p
            className="max-w-64 px-1 text-xs font-medium text-slate-500 dark:text-slate-400"
            id={reasonId}
          >
            {disabledReason}
          </p>
        ) : null}
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-2 dark:border-rose-900 dark:bg-rose-950/40">
        <span className="px-2 text-xs font-medium text-rose-800 dark:text-rose-300">
          {confirmMessage}
        </span>
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-rose-700 px-3 text-xs font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await action();
            });
          }}
          type="button"
        >
          {isPending ? deletingLabel : confirmLabel}
        </button>
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={isPending}
          onClick={() => setConfirmed(false)}
          type="button"
        >
          {cancelLabel}
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
      onClick={() => setConfirmed(true)}
      type="button"
    >
      <Trash2 aria-hidden="true" size={16} strokeWidth={2.2} />
      {label}
    </button>
  );
}
