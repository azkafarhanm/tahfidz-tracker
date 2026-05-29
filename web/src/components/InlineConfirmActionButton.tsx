"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/feedback";

type ActionResult =
  | void
  | {
      ok?: boolean;
      error?: string | null;
      message?: string | null;
      success?: string | null;
    };

type InlineConfirmActionButtonProps = {
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  confirmMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
  onAction: () => Promise<ActionResult>;
  onError?: (message: string) => void;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  showSuccessToast?: boolean;
  tone?: "danger" | "warning" | "success";
};

const idleClasses = {
  danger:
    "border-rose-200/70 text-rose-500 hover:bg-rose-50/60 hover:border-rose-300/80 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40",
  warning:
    "border-amber-200/70 text-amber-600 hover:bg-amber-50/60 hover:border-amber-300/80 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/40",
  success:
    "border-emerald-200/70 text-emerald-600 hover:bg-emerald-50/60 hover:border-emerald-300/80 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
} as const;

const confirmWrapClasses = {
  danger:
    "border-rose-200/80 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30",
  warning:
    "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30",
  success:
    "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30",
} as const;

export default function InlineConfirmActionButton({
  label,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  confirmMessage,
  disabled = false,
  disabledReason,
  icon,
  onAction,
  onError,
  onSuccess,
  showSuccessToast = true,
  tone = "danger",
}: InlineConfirmActionButtonProps) {
  const reasonId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <button
          aria-describedby={disabledReason ? reasonId : undefined}
          aria-disabled="true"
          className={`inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold opacity-70 dark:bg-slate-900 ${idleClasses[tone]}`}
          onClick={(event) => event.preventDefault()}
          type="button"
        >
          {icon}
          {label}
        </button>
        {disabledReason ? (
          <p
            className="max-w-72 text-xs font-medium text-slate-500 dark:text-slate-400"
            id={reasonId}
          >
            {disabledReason}
          </p>
        ) : null}
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        {inlineError ? (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {inlineError}
          </p>
        ) : null}
        <button
          className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-900 dark:focus-visible:ring-offset-slate-900 ${idleClasses[tone]}`}
          onClick={() => {
            setInlineError(null);
            setConfirmed(true);
          }}
          type="button"
        >
          {icon}
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border p-1.5 ${confirmWrapClasses[tone]}`}>
      {confirmMessage ? (
        <span className="px-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
          {confirmMessage}
        </span>
      ) : null}
      <button
        className="inline-flex min-h-7 items-center justify-center rounded-lg bg-slate-950 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-slate-900"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await onAction();

            if (result && typeof result === "object" && result.ok === false) {
              const message = result.error ?? "";
              setConfirmed(false);
              setInlineError(message || null);
              if (message) {
                toast.error(message);
                playNotificationSound("error");
                onError?.(message);
              }
              return;
            }

            setConfirmed(false);
            setInlineError(null);

            if (result && typeof result === "object") {
              onSuccess?.(result);
              const successMessage = result.message ?? result.success ?? null;
              if (showSuccessToast && successMessage) {
                toast.success(successMessage);
                playNotificationSound("success");
              }
            }
          });
        }}
        type="button"
      >
        {isPending ? pendingLabel : confirmLabel}
      </button>
      <button
        className="inline-flex min-h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
        disabled={isPending}
        onClick={() => setConfirmed(false)}
        type="button"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
