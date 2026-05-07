"use client";

import { useState, useTransition } from "react";
import { deleteTeacher } from "../../actions";

export default function DeleteTeacherButton({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:max-w-3xl sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Hapus akun guru</p>
            <p className="mt-1 text-xs text-slate-500">
              Akun {teacherName} dan semua data terkait akan dihapus permanen.
            </p>
          </div>
          <button
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            onClick={() => setConfirmed(true)}
            type="button"
          >
            Hapus
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-red-300 bg-red-50 p-4 sm:max-w-3xl sm:px-8">
      <p className="text-sm font-semibold text-red-900">
        Yakin ingin menghapus akun {teacherName}? Tindakan ini tidak bisa dibatalkan.
      </p>
      <p className="mt-1 text-xs text-red-700">
        Jika guru masih punya santri, hapus akan gagal. Nonaktifkan sebagai gantinya.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          className="rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteTeacher(teacherId);
            });
          }}
          type="button"
        >
          {isPending ? "Menghapus..." : "Ya, hapus permanen"}
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setConfirmed(false)}
          type="button"
        >
          Batal
        </button>
      </div>
    </section>
  );
}
