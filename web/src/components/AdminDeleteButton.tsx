"use client";

import { Trash2 } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { useScrollPreservingRefresh } from "@/hooks/useScrollPreservingRefresh";

type ActionResult =
  | void
  | {
      ok?: boolean;
      error?: string | null;
      message?: string | null;
      success?: string | null;
    };

type AdminDeleteButtonProps = {
  action: () => Promise<ActionResult>;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  deletingLabel: string;
  confirmMessage: string;
  dialogTitle?: string;
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
  dialogTitle,
  disabled = false,
  disabledReason,
}: AdminDeleteButtonProps) {
  const refresh = useScrollPreservingRefresh();

  return (
    <ConfirmActionDialogButton
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      confirmMessage={confirmMessage}
      dialogTitle={dialogTitle}
      disabled={disabled}
      disabledReason={disabledReason}
      icon={<Trash2 aria-hidden="true" size={16} strokeWidth={2.2} />}
      label={label}
      onAction={action}
      onSuccess={() => refresh()}
      pendingLabel={deletingLabel}
      tone="danger"
    />
  );
}
