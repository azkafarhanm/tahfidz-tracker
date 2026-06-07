"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { cancelTarget, completeTarget } from "@/lib/target-actions";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";

export default function TargetActions({
  targetId,
  onActionSuccess,
}: {
  targetId: string;
  onActionSuccess?: () => void;
}) {
  const t = useTranslations("TargetActions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex items-center gap-2">
        <ConfirmActionDialogButton
          cancelLabel={t("cancelDelete")}
          confirmLabel={t("confirmComplete")}
          confirmMessage={t("confirmCompleteMessage")}
          dialogTitle={t("complete")}
          icon={<CheckCircle2 aria-hidden="true" size={12} strokeWidth={2.2} />}
          label={t("complete")}
          onAction={async () => {
            setError(null);
            const result = await completeTarget(targetId);
            if (result.ok) {
              onActionSuccess?.();
              router.refresh();
            } else {
              setError(result.error ?? "Error");
            }
            return result;
          }}
          pendingLabel={t("completing")}
          tone="success"
        />
        <ConfirmActionDialogButton
          cancelLabel={t("cancelDelete")}
          confirmLabel={t("confirmCancel")}
          confirmMessage={t("cancelConfirmMessage")}
          dialogTitle={t("cancel")}
          icon={<XCircle aria-hidden="true" size={12} strokeWidth={2.2} />}
          label={t("cancel")}
          onAction={async () => {
            setError(null);
            const result = await cancelTarget(targetId);
            if (result.ok) {
              onActionSuccess?.();
              router.refresh();
            } else {
              setError(result.error ?? "Error");
            }
            return result;
          }}
          pendingLabel={t("processing")}
          tone="warning"
        />
      </div>
    </div>
  );
}
