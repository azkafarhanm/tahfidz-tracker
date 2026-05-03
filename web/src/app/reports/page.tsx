import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { requireSessionScope } from "@/lib/session";

export default async function ReportsPage() {
  await requireSessionScope();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-100 text-blue-900 shadow-lg">
            <BarChart3 size={28} strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Laporan</h1>
          <p className="mt-2 text-slate-600">
            Fitur laporan sedang dalam pengembangan
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tersedia di fase berikutnya
          </p>
        </div>

        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
          href="/"
        >
          <ArrowLeft size={17} strokeWidth={2.3} />
          Kembali ke Home
        </Link>
      </section>
    </main>
  );
}
