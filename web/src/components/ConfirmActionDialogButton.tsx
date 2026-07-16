"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, useTransition } from "react";
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

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  pendingTitle?: string;
  pendingDescription?: string;
  pendingIcon?: React.ReactNode;
  hideActionsWhilePending?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
  tone?: Extract<ActionButtonTone, "danger" | "warning" | "success">;
  onConfirm: () => Promise<ActionResult>;
  onBeforeConfirm?: () => void;
  onRollback?: () => void;
  showSuccessToast?: boolean;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  onError?: (message: string) => void;
};

const iconWrapClasses = {
  danger:
    "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
} as const;

function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  pendingTitle,
  pendingDescription,
  pendingIcon,
  hideActionsWhilePending = false,
  icon,
  children,
  confirmDisabled = false,
  tone = "danger",
  onConfirm,
  onBeforeConfirm,
  onRollback,
  showSuccessToast = true,
  onSuccess,
  onError,
}: ConfirmActionDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPending, onOpenChange, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onClick={() => {
        if (!isPending) onOpenChange(false);
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
            {isPending && pendingIcon ? pendingIcon : icon}
          </span>
          <div className="min-w-0">
            <h2
              className="text-base font-semibold text-slate-950 dark:text-white"
              id={titleId}
            >
              {isPending && pendingTitle ? pendingTitle : title}
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
              id={descriptionId}
            >
              {isPending && pendingDescription ? pendingDescription : description}
            </p>
          </div>
        </div>

        {!isPending && children ? <div className="mt-5">{children}</div> : null}

        {isPending && hideActionsWhilePending ? null : (
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className={actionButtonClass("neutral")}
            disabled={isPending || confirmDisabled}
            onClick={() => onOpenChange(false)}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={compactActionButtonClass(tone, "min-h-10 min-w-[5.5rem] rounded-xl text-sm")}
            disabled={isPending}
            onClick={() => {
              onBeforeConfirm?.();
              startTransition(async () => {
                const result = await onConfirm();

                if (result && typeof result === "object" && result.ok === false) {
                  const message = result.error ?? "";
                  onRollback?.();
                  onOpenChange(false);
                  if (message) {
                    toast.error(message);
                    playNotificationSound("error");
                    onError?.(message);
                  }
                  return;
                }

                onOpenChange(false);

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
        )}
      </div>
    </div>,
    document.body,
  );
}

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
  onStart?: () => void;
  onRollback?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  showSuccessToast?: boolean;
  tone?: Extract<ActionButtonTone, "danger" | "warning" | "success">;
};

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
  onStart,
  onRollback,
  onError,
  onSuccess,
  showSuccessToast = true,
  tone = "danger",
}: ConfirmActionDialogButtonProps) {
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

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

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        {inlineError ? (
          <p className="text-xs font-medium text-red-700 dark:text-red-300">
            {inlineError}
          </p>
        ) : null}
        <button
          className={actionButtonClass(tone)}
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

      <ConfirmActionDialog
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        description={confirmMessage}
        icon={icon}
        onBeforeConfirm={onStart}
        onConfirm={onAction}
        onError={(message) => {
          setInlineError(message || null);
          onError?.(message);
        }}
        onOpenChange={setOpen}
        onRollback={onRollback}
        onSuccess={onSuccess}
        open={open}
        pendingLabel={pendingLabel}
        showSuccessToast={showSuccessToast}
        title={dialogTitle ?? label}
        tone={tone}
      />
    </>
  );
}

export { ConfirmActionDialog };
export type { ConfirmActionDialogProps, ActionResult };
