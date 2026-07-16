"use client";

import { createContext, useContext, useRef, useState } from "react";
import { LoaderCircle, Repeat2, Save } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";
import { markServerActionReturn } from "@/hooks/usePanelScrollRestoration";
import type { RecordType } from "@/lib/record-conversion";

type EditRecordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  currentType: RecordType;
  labels: {
    hafalan: string;
    murojaah: string;
    confirmTitle: string;
    confirmDescription: string;
    pendingTitle: string;
    pendingDescription: string;
    cancel: string;
    confirm: string;
    processing: string;
  };
};

const EditRecordPendingContext = createContext(false);

export function EditRecordSaveButton({
  saveLabel,
  savingLabel,
}: {
  saveLabel: string;
  savingLabel: string;
}) {
  const isPending = useContext(EditRecordPendingContext);

  return (
    <button
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98] disabled:cursor-wait disabled:opacity-75"
      disabled={isPending}
      type="submit"
    >
      {isPending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" size={17} strokeWidth={2.2} />
      ) : (
        <Save aria-hidden="true" size={17} strokeWidth={2.2} />
      )}
      {isPending ? savingLabel : saveLabel}
    </button>
  );
}

export default function EditRecordForm({
  action,
  children,
  className,
  currentType,
  labels,
}: EditRecordFormProps) {
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const conversionSubmittingRef = useRef(false);
  const [selectedType, setSelectedType] = useState<RecordType>(currentType);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [conversionSubmitting, setConversionSubmitting] = useState(false);
  const sourceLabel = currentType === "hafalan" ? labels.hafalan : labels.murojaah;
  const destinationLabel = selectedType === "hafalan" ? labels.hafalan : labels.murojaah;

  return (
    <EditRecordPendingContext.Provider value={conversionSubmitting}>
      <div ref={formContainerRef}>
        <form
          action={action}
          aria-busy={conversionSubmitting}
          className={className}
          inert={conversionSubmitting}
          onSubmit={(event) => {
            if (conversionSubmittingRef.current) {
              event.preventDefault();
              return;
            }

            const requestedType = new FormData(event.currentTarget).get("activityType");
            const nextType = requestedType === "hafalan" || requestedType === "murojaah"
              ? requestedType
              : currentType;
            setSelectedType(nextType);

            if (nextType !== currentType) {
              event.preventDefault();
              setConfirmationOpen(true);
              return;
            }
            markServerActionReturn();
          }}
        >
          {children}
        </form>
      </div>

      <ConfirmActionDialog
        cancelLabel={labels.cancel}
        confirmLabel={labels.confirm}
        description={labels.confirmDescription
          .replace("{source}", sourceLabel)
          .replace("{destination}", destinationLabel)}
        icon={<Repeat2 aria-hidden="true" size={18} strokeWidth={2.2} />}
        hideActionsWhilePending
        onConfirm={async () => {
          if (conversionSubmittingRef.current) return;
          const form = formContainerRef.current?.querySelector("form");
          if (!form) return;

          conversionSubmittingRef.current = true;
          setConversionSubmitting(true);
          markServerActionReturn();
          await action(new FormData(form));
          return { ok: true };
        }}
        onOpenChange={setConfirmationOpen}
        open={confirmationOpen}
        pendingLabel={labels.processing}
        pendingDescription={labels.pendingDescription}
        pendingIcon={<LoaderCircle aria-hidden="true" className="animate-spin" size={18} strokeWidth={2.2} />}
        pendingTitle={labels.pendingTitle}
        showSuccessToast={false}
        title={labels.confirmTitle}
        tone="warning"
      />
    </EditRecordPendingContext.Provider>
  );
}
