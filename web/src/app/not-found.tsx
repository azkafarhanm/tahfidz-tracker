import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <p className="text-6xl font-bold text-emerald-900 dark:text-emerald-400">404</p>
          <h1 className="mt-4 text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t("description")}
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
