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
    "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950",
  warning:
    "border-amber-200 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-950",
  success:
    "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950",
} as const;

const confirmWrapClasses = {
  danger:
    "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
  warning:
    "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  success:
    "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
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
          className={`inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold opacity-70 ${idleClasses[tone]}`}
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
          <p className="text-xs font-medium text-red-700 dark:text-red-300">
            {inlineError}
          </p>
        ) : null}
        <button
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition ${idleClasses[tone]}`}
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
    <div className={`flex max-w-full flex-wrap items-center gap-2 rounded-2xl border p-2 ${confirmWrapClasses[tone]}`}>
      {confirmMessage ? (
        <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-200">
          {confirmMessage}
        </span>
      ) : null}
      <button
        className="inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
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
