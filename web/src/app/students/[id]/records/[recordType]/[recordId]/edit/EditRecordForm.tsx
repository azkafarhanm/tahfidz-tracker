"use client";

import { useRef, useState } from "react";
import { Repeat2 } from "lucide-react";
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
    cancel: string;
    confirm: string;
    processing: string;
  };
};

export default function EditRecordForm({
  action,
  children,
  className,
  currentType,
  labels,
}: EditRecordFormProps) {
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const confirmedRef = useRef(false);
  const [selectedType, setSelectedType] = useState<RecordType>(currentType);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const sourceLabel = currentType === "hafalan" ? labels.hafalan : labels.murojaah;
  const destinationLabel = selectedType === "hafalan" ? labels.hafalan : labels.murojaah;

  return (
    <>
      <div ref={formContainerRef}>
        <form
          action={action}
          className={className}
          onSubmit={(event) => {
            const requestedType = new FormData(event.currentTarget).get("activityType");
            const nextType = requestedType === "hafalan" || requestedType === "murojaah"
              ? requestedType
              : currentType;
            setSelectedType(nextType);

            if (nextType !== currentType && !confirmedRef.current) {
              event.preventDefault();
              setConfirmationOpen(true);
              return;
            }
            confirmedRef.current = false;
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
        onConfirm={async () => {
          confirmedRef.current = true;
          formContainerRef.current?.querySelector("form")?.requestSubmit();
          return { ok: true };
        }}
        onOpenChange={setConfirmationOpen}
        open={confirmationOpen}
        pendingLabel={labels.processing}
        showSuccessToast={false}
        title={labels.confirmTitle}
        tone="warning"
      />
    </>
  );
}
