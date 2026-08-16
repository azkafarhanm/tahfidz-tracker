"use client";

import { useState, useTransition } from "react";
import { RotateCcw, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import ConfirmActionDialogButton from "@/components/ConfirmActionDialogButton";
import { actionButtonClass } from "@/components/action-button-styles";
import {
  advanceTahsinMeetingAction,
  resetTahsinMeetingTimelineAction,
} from "@/app/tahsin/actions";
import {
  createTahsinMeetingFormData,
  isTahsinMeetingControlDisabled,
} from "@/lib/tahsin-meeting-control-state";

type Props = {
  meetingDate: string;
  canManage: boolean;
};

export default function TahsinMeetingControls({ meetingDate, canManage }: Props) {
  const t = useTranslations("AdminTahsinMeeting");
  const router = useRouter();
  const [isAdvancing, startAdvanceTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);
  const isPending = isTahsinMeetingControlDisabled(isAdvancing, isResetting);

  function refreshWithSuccess(message: string) {
    toast.success(message);
    router.refresh();
  }

  function advance() {
    startAdvanceTransition(async () => {
      const result = await advanceTahsinMeetingAction(createTahsinMeetingFormData(meetingDate));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshWithSuccess(t("advanceSuccess"));
    });
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button
        className={actionButtonClass("success")}
        disabled={!canManage || isPending}
        onClick={advance}
        type="button"
      >
        <SkipForward aria-hidden="true" size={16} strokeWidth={2.2} />
        {isAdvancing ? t("advancing") : t("advance")}
      </button>
      <ConfirmActionDialogButton
        cancelLabel={t("cancel")}
        confirmLabel={t("resetConfirm")}
        confirmMessage={t("resetConfirmation")}
        dialogTitle={t("resetTitle")}
        disabled={!canManage || isPending}
        disabledReason={!canManage ? t("noActiveMeeting") : undefined}
        icon={<RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />}
        label={t("reset")}
        onAction={async () => {
          const result = await resetTahsinMeetingTimelineAction(createTahsinMeetingFormData(meetingDate));
          if (result.ok) {
            refreshWithSuccess(t("resetSuccess"));
            setIsResetting(false);
            return { ...result, success: undefined };
          }
          return result;
        }}
        onError={() => setIsResetting(false)}
        onStart={() => setIsResetting(true)}
        onSuccess={() => setIsResetting(false)}
        pendingLabel={t("resetting")}
        showSuccessToast={false}
        tone="warning"
      />
    </div>
  );
}
