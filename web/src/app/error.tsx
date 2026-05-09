"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-red-100 text-red-900 shadow-lg dark:bg-red-950 dark:text-red-400">
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
          <h1 className="mt-6 text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {process.env.NODE_ENV === "development" && error.message
              ? error.message
              : t("fallbackMessage")}
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/"
          >
            {t("backToHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
