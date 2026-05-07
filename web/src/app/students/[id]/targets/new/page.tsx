import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Hash,
  Target,
} from "lucide-react";
import { createTarget } from "@/lib/target-actions";
import { getStudentFormContext } from "@/lib/students";
import { todayInputValue } from "@/lib/format";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewTargetPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewTargetPage({ params, searchParams }: NewTargetPageProps) {
  const { teacherId } = await requireSessionScope();
  const { id } = await params;
  const query = await searchParams;

  const ctx = await getStudentFormContext(id, teacherId);
  if (!ctx) {
    notFound();
  }

  const action = createTarget.bind(null, id);
  const today = todayInputValue();
  const defaultEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
            href={`/students/${id}`}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {ctx.fullName}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <Target aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Tambah Target</h1>
              <p className="mt-1 text-sm text-slate-600">{ctx.classSummary}</p>
            </div>
          </div>
        </header>

        {query?.error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {query.error}
          </div>
        ) : null}

        <form
          action={action}
          className="mt-5 space-y-5"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Target aria-hidden="true" className="text-emerald-800" size={17} strokeWidth={2.2} />
              Jenis target
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-100">
                <input className="sr-only" defaultChecked name="type" type="radio" value="HAFALAN" />
                Hafalan
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-900">
                <input className="sr-only" name="type" type="radio" value="MUROJAAH" />
                Murojaah
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Target aria-hidden="true" className="text-emerald-800" size={17} strokeWidth={2.2} />
              Materi target
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="surah">Surah</label>
                <input
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  id="surah"
                  name="surah"
                  placeholder="Contoh: Al-Mulk"
                  required
                  type="text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="fromAyah">Ayat awal</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <Hash aria-hidden="true" className="text-slate-400" size={14} strokeWidth={2.2} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                      id="fromAyah"
                      max={286}
                      min={1}
                      name="fromAyah"
                      placeholder="1"
                      required
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="toAyah">Ayat akhir</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <Hash aria-hidden="true" className="text-slate-400" size={14} strokeWidth={2.2} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                      id="toAyah"
                      max={286}
                      min={1}
                      name="toAyah"
                      placeholder="20"
                      required
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarDays aria-hidden="true" className="text-emerald-800" size={17} strokeWidth={2.2} />
              Jadwal
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="startDate">Mulai</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  defaultValue={today}
                  id="startDate"
                  name="startDate"
                  required
                  type="date"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="endDate">Target selesai</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  defaultValue={defaultEnd}
                  id="endDate"
                  name="endDate"
                  required
                  type="date"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ClipboardList aria-hidden="true" className="text-emerald-800" size={17} strokeWidth={2.2} />
              Catatan
            </div>
            <textarea
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              name="notes"
              placeholder="Opsional — catatan tambahan tentang target ini"
              rows={3}
            />
          </section>

          <div className="sticky bottom-0 -mx-4 flex items-center gap-3 bg-[#f7f4ee]/90 px-4 pb-5 pt-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
            <Link
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900"
              href={`/students/${id}`}
            >
              Batal
            </Link>
            <button
              className="flex-1 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              Simpan Target
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
