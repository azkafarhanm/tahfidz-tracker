"use client";

import { useTransition } from "react";
import { reactivateTeacherStudent } from "@/app/students/[id]/edit/actions";

export default function ReactivateStudentButton({ studentId }: { studentId: string; studentName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await reactivateTeacherStudent(studentId);
        });
      }}
      type="button"
    >
      {isPending ? "Memproses..." : "Aktifkan"}
    </button>
  );
}
