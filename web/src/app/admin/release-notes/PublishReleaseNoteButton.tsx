"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";
import { actionButtonClass } from "@/components/action-button-styles";
import { publishReleaseNote } from "./actions";

type PublishReleaseNoteButtonProps = {
  releaseNoteId: string;
};

export default function PublishReleaseNoteButton({ releaseNoteId }: PublishReleaseNoteButtonProps) {
  const t = useTranslations("AdminReleaseNotes");
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const allChecked = checks.every(Boolean);

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setChecks([false, false, false, false]);
  }

  function toggleCheck(index: number) {
    setChecks((current) => current.map((checked, currentIndex) => (
      currentIndex === index ? !checked : checked
    )));
  }

  const checklist = [
    t("publishChecklistWorkflow"),
    t("publishChecklistClear"),
    t("publishChecklistInternal"),
    t("publishChecklistVersion"),
  ];

  return (
    <>
      <button className={actionButtonClass("success")} onClick={() => setDialogOpen(true)} type="button">
        <Send aria-hidden="true" size={16} strokeWidth={2.2} />
        {t("publish")}
      </button>

      <ConfirmActionDialog
        cancelLabel={t("publishCancel")}
        confirmDisabled={!allChecked}
        confirmLabel={t("publish")}
        description={t("publishDescription")}
        icon={<Send aria-hidden="true" size={20} strokeWidth={2.2} />}
        onConfirm={publishReleaseNote.bind(null, releaseNoteId)}
        onOpenChange={setDialogOpen}
        open={open}
        pendingLabel={t("publishing")}
        title={t("publishTitle")}
        tone="success"
      >
        <fieldset>
          <legend className="text-sm font-semibold text-slate-950 dark:text-white">{t("publishChecklistHeading")}</legend>
          <div className="mt-3 space-y-2">
            {checklist.map((label, index) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300" key={label}>
                <input checked={checks[index]} className="mt-0.5 h-4 w-4 accent-emerald-700" onChange={() => toggleCheck(index)} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {!allChecked ? <p className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300"><CheckCircle2 aria-hidden="true" size={14} strokeWidth={2.2} />{t("publishChecklistRequired")}</p> : null}
        </fieldset>
      </ConfirmActionDialog>
    </>
  );
}
