"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { changePassword } from "./actions";

export default function ChangePasswordPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
            href="/profile"
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            Profil
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <KeyRound aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Ubah Password</h1>
              <p className="mt-1 text-sm text-slate-600">
                Perbarui password login akun Anda.
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form
          className="mt-5 space-y-4"
          action={(formData) => {
            startTransition(async () => {
              await changePassword(formData);
            });
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="currentPassword">
              Password saat ini
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="currentPassword"
              name="currentPassword"
              required
              type="password"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="newPassword">
              Password baru
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="newPassword"
              maxLength={72}
              minLength={4}
              name="newPassword"
              required
              type="password"
            />
            <p className="mt-1 text-xs text-slate-500">Minimal 4 karakter.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
              Konfirmasi password baru
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              id="confirmPassword"
              maxLength={72}
              minLength={4}
              name="confirmPassword"
              required
              type="password"
            />
          </div>

          <button
            className="w-full rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-950 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </section>
    </main>
  );
}
