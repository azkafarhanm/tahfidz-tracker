"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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

type ImpactItem = {
  label: string;
  count: number;
};

type TypeToConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  impactItems?: ImpactItem[];
  warningMessage?: string;
  tone?: Extract<ActionButtonTone, "danger" | "warning">;
  onConfirm: () => Promise<ActionResult>;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  onError?: (message: string) => void;
};

const iconWrapClasses = {
  danger: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
} as const;

function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmWord,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  impactItems,
  warningMessage,
  tone = "danger",
  onConfirm,
  onSuccess,
  onError,
}: TypeToConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setInputValue("");
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

  const isConfirmEnabled = inputValue.trim().toUpperCase() === confirmWord.toUpperCase();

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
            <Trash2 aria-hidden="true" size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2
              className="text-base font-semibold text-slate-950 dark:text-white"
              id={titleId}
            >
              {title}
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
              id={descriptionId}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Impact Summary */}
        {impactItems && impactItems.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
              Data yang akan dihapus:
            </p>
            <ul className="mt-2 space-y-1">
              {impactItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm text-red-700 dark:text-red-300"
                >
                  <span>- {item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Warning */}
        {warningMessage ? (
          <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
            {warningMessage}
          </p>
        ) : null}

        {/* Type to confirm */}
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ketik <span className="font-bold text-red-700 dark:text-red-400">{confirmWord}</span> untuk konfirmasi:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-950 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-red-600"
            placeholder={confirmWord}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className={actionButtonClass("neutral")}
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={compactActionButtonClass(tone, "min-h-10 min-w-[5.5rem] rounded-xl text-sm")}
            disabled={isPending || !isConfirmEnabled}
            onClick={() => {
              startTransition(async () => {
                const result = await onConfirm();

                if (result && typeof result === "object" && result.ok === false) {
                  const message = result.error ?? "";
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
                  if (successMessage) {
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
    </div>,
    document.body,
  );
}

type TypeToConfirmButtonProps = {
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  confirmMessage: string;
  confirmWord: string;
  dialogTitle?: string;
  impactItems?: ImpactItem[];
  warningMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
  onAction: () => Promise<ActionResult>;
  onError?: (message: string) => void;
  onSuccess?: (result: Exclude<ActionResult, void>) => void;
  compact?: boolean;
};

export default function TypeToConfirmButton({
  label,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  confirmMessage,
  confirmWord,
  dialogTitle,
  impactItems,
  warningMessage,
  disabled = false,
  disabledReason,
  onAction,
  onError,
  onSuccess,
  compact = false,
}: TypeToConfirmButtonProps) {
  const reasonId = useId();
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <button
          aria-describedby={disabledReason ? reasonId : undefined}
          aria-disabled="true"
          className={compact
            ? compactActionButtonClass("danger", "cursor-not-allowed opacity-70")
            : actionButtonClass("danger", "cursor-not-allowed opacity-70")
          }
          onClick={(event) => event.preventDefault()}
          type="button"
        >
          <Trash2 aria-hidden="true" size={compact ? 12 : 16} strokeWidth={2.2} />
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
      <button
        className={compact
          ? compactActionButtonClass("danger")
          : actionButtonClass("danger")
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        <Trash2 aria-hidden="true" size={compact ? 12 : 16} strokeWidth={2.2} />
        {label}
      </button>

      <TypeToConfirmDialog
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        description={confirmMessage}
        confirmWord={confirmWord}
        impactItems={impactItems}
        onConfirm={onAction}
        onError={onError}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
        open={open}
        pendingLabel={pendingLabel}
        title={dialogTitle ?? label}
        warningMessage={warningMessage}
      />
    </>
  );
}

export { TypeToConfirmDialog };
export type { TypeToConfirmDialogProps, ImpactItem, ActionResult };
