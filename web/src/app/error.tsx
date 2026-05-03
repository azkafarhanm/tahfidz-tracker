"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-red-100 text-red-900 shadow-lg">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="mt-2 text-slate-600">
            {process.env.NODE_ENV === "development" && error.message
              ? error.message
              : "Silakan coba lagi nanti."}
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/"
          >
            Kembali ke Home
          </Link>
        </div>
      </section>
    </main>
  );
}
