import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function generateMetadata() {
  const t = await getTranslations("OfflinePage");
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function OfflinePage() {
  const t = await getTranslations("OfflinePage");

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center text-center sm:max-w-lg">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-800 shadow-lg shadow-amber-900/10 dark:bg-amber-950 dark:text-amber-300">
          <WifiOff aria-hidden="true" size={28} strokeWidth={2.2} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">{t("heading")}</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {t("description")}
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-950"
          href="/"
        >
          {t("homeButton")}
        </Link>
      </section>
    </main>
  );
}
