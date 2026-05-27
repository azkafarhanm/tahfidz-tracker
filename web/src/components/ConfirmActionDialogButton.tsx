"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
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

type ConfirmActionDialogButtonProps = {
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  confirmMessage: string;
  dialogTitle?: string;
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
  onAction: () => Promise<ActionResult>;
  onError?: (message: string) => void;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  showSuccessToast?: boolean;
  tone?: "danger" | "warning" | "success";
};

const triggerClasses = {
  danger:
    "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950",
  warning:
    "border-amber-200 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-950",
  success:
    "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-950",
} as const;

const iconWrapClasses = {
  danger:
    "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
} as const;

export default function ConfirmActionDialogButton({
  label,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  confirmMessage,
  dialogTitle,
  disabled = false,
  disabledReason,
  icon,
  onAction,
  onError,
  onSuccess,
  showSuccessToast = true,
  tone = "danger",
}: ConfirmActionDialogButtonProps) {
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPending, open]);

  if (disabled) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <button
          aria-describedby={disabledReason ? reasonId : undefined}
          aria-disabled="true"
          className={`inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border bg-white px-4 text-sm font-semibold opacity-70 ${triggerClasses[tone]}`}
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

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        {inlineError ? (
          <p className="text-xs font-medium text-red-700 dark:text-red-300">
            {inlineError}
          </p>
        ) : null}
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border bg-white px-4 text-sm font-semibold transition ${triggerClasses[tone]}`}
          onClick={() => {
            setInlineError(null);
            setOpen(true);
          }}
          type="button"
        >
          {icon}
          {label}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            if (!isPending) setOpen(false);
          }}
        >
          <div
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconWrapClasses[tone]}`}
              >
                {icon}
              </span>
              <div className="min-w-0">
                <h2
                  className="text-base font-semibold text-slate-950 dark:text-white"
                  id={titleId}
                >
                  {dialogTitle ?? label}
                </h2>
                <p
                  className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                  id={descriptionId}
                >
                  {confirmMessage}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={isPending}
                onClick={() => setOpen(false)}
                ref={cancelButtonRef}
                type="button"
              >
                {cancelLabel}
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60 dark:bg-red-700 dark:hover:bg-red-600"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await onAction();

                    if (result && typeof result === "object" && result.ok === false) {
                      const message = result.error ?? "";
                      setOpen(false);
                      setInlineError(message || null);
                      if (message) {
                        toast.error(message);
                        playNotificationSound("error");
                        onError?.(message);
                      }
                      return;
                    }

                    setOpen(false);
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
