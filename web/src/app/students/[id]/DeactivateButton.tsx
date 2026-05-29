"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { deactivateTeacherStudent } from "./edit/actions";
import InlineConfirmActionButton from "@/components/InlineConfirmActionButton";

export default function DeactivateButton({ studentId }: { studentId: string }) {
  const t = useTranslations("DeactivateStudent");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
      <InlineConfirmActionButton
        cancelLabel={t("buttonCancel")}
        confirmLabel={t("buttonConfirm")}
        confirmMessage={t("confirmMessage")}
        label={t("buttonDeactivate")}
        onAction={async () => {
          setError(null);
          const result = await deactivateTeacherStudent(studentId);
          if (result.ok) {
            router.refresh();
          } else {
            setError(result.error);
          }
          return result;
        }}
        pendingLabel={t("buttonProcessing")}
        tone="warning"
      />
    </div>
  );
}
