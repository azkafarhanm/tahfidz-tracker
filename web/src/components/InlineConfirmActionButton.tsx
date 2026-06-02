"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  actionButtonClass,
  compactActionButtonClass,
  type ActionButtonTone,
} from "@/components/action-button-styles";
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
  tone?: Extract<ActionButtonTone, "danger" | "warning" | "success">;
};

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
          className={actionButtonClass(tone, "cursor-not-allowed opacity-70")}
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
          className={actionButtonClass(tone)}
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
        className={compactActionButtonClass(tone)}
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
        className={compactActionButtonClass("neutral")}
        disabled={isPending}
        onClick={() => setConfirmed(false)}
        type="button"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
