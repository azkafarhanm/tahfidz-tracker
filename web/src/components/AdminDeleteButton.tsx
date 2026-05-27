"use client";

import { Trash2 } from "lucide-react";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

type AdminDeleteButtonProps = {
  action: () => Promise<void>;
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
      pendingLabel={deletingLabel}
      showSuccessToast={false}
      tone="danger"
    />
  );
}
