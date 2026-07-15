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
    activityType: string;
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
  const changed = selectedType !== currentType;
  const sourceLabel = currentType === "hafalan" ? labels.hafalan : labels.murojaah;
  const destinationLabel = selectedType === "hafalan" ? labels.hafalan : labels.murojaah;

  return (
    <>
      <div ref={formContainerRef}>
        <form
          action={action}
          className={className}
          onSubmit={(event) => {
            if (changed && !confirmedRef.current) {
              event.preventDefault();
              setConfirmationOpen(true);
              return;
            }
            confirmedRef.current = false;
            markServerActionReturn();
          }}
        >
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <legend className="px-1 text-sm font-semibold text-slate-950 dark:text-white">
            {labels.activityType}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["hafalan", "murojaah"] as const).map((type) => (
              <label
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:has-checked:border-emerald-500 dark:has-checked:bg-emerald-950/40 dark:has-checked:text-emerald-300"
                key={type}
              >
                <input
                  checked={selectedType === type}
                  className="h-4 w-4 accent-emerald-800"
                  name="activityType"
                  onChange={() => setSelectedType(type)}
                  type="radio"
                  value={type}
                />
                {type === "hafalan" ? labels.hafalan : labels.murojaah}
              </label>
            ))}
          </div>
        </fieldset>

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
