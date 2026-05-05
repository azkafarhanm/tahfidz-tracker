"use client";

import { useState, useTransition } from "react";
import { deleteRecord } from "@/lib/record-actions";

export default function DeleteRecordButton({
  studentId,
  recordType,
  recordId,
}: {
  studentId: string;
  recordType: "hafalan" | "murojaah";
  recordId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        onClick={() => setConfirmed(true)}
        type="button"
      >
        Hapus
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteRecord(studentId, recordType, recordId);
          });
        }}
        type="button"
      >
        {isPending ? "Menghapus..." : "Ya, hapus"}
      </button>
      <button
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        onClick={() => setConfirmed(false)}
        type="button"
      >
        Batal
      </button>
    </div>
  );
}
