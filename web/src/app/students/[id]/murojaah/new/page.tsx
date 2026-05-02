import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Hash,
  RotateCcw,
  Save,
} from "lucide-react";
import { RecordStatus } from "@/generated/prisma-next/enums";
import { getStudentFormContext } from "@/lib/students";
import { createMurojaahRecord } from "../actions";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewMurojaahPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

const statusOptions = [
  { value: RecordStatus.LANCAR, label: "Lancar" },
  { value: RecordStatus.CUKUP, label: "Cukup" },
  { value: RecordStatus.PERLU_MUROJAAH, label: "Perlu murojaah" },
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default async function NewMurojaahPage({
  params,
  searchParams,
}: NewMurojaahPageProps) {
  const { id } = await params;
  const session = await auth();
  const teacherId = session?.user?.role !== "ADMIN" ? session?.user?.teacherId : null;
  const student = await getStudentFormContext(id, teacherId);
  const error = (await searchParams)?.error;

  if (!student) {
    notFound();
  }

  const action = createMurojaahRecord.bind(null, student.id);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href={`/students/${student.id}`}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Detail santri
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Tambah Murojaah
            </h1>
            <p className="mt-1 truncate text-sm text-slate-600">
              {student.fullName} - {student.classSummary}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <RotateCcw aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {error}
          </div>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <RotateCcw
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Materi murojaah</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Surah</span>
              <input
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                name="surah"
                placeholder="Contoh: Al-Baqarah"
                required
                type="text"
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Ayat awal
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <Hash
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                    size={16}
                    strokeWidth={2.2}
                  />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                    min={1}
                    name="fromAyah"
                    required
                    type="number"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Ayat akhir
                </span>
                <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <Hash
                    aria-hidden="true"
                    className="shrink-0 text-slate-400"
                    size={16}
                    strokeWidth={2.2}
                  />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                    min={1}
                    name="toAyah"
                    required
                    type="number"
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Penilaian</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Status
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  defaultValue={RecordStatus.CUKUP}
                  name="status"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Nilai
                </span>
                <input
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  max={100}
                  min={0}
                  name="score"
                  placeholder="Opsional"
                  type="number"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Tanggal
              </span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <CalendarDays
                  aria-hidden="true"
                  className="shrink-0 text-slate-400"
                  size={17}
                  strokeWidth={2.2}
                />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                  defaultValue={todayInputValue()}
                  name="date"
                  required
                  type="date"
                />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Waktu
              </span>
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <Clock
                  aria-hidden="true"
                  className="shrink-0 text-slate-400"
                  size={17}
                  strokeWidth={2.2}
                />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                  defaultValue={nowTimeValue()}
                  name="time"
                  required
                  type="time"
                />
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Catatan</h2>
            </div>

            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              name="notes"
              placeholder="Opsional, contoh: ayat 7-9 masih sering tertukar."
            />
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur">
            <Link
              className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              href={`/students/${student.id}`}
            >
              Batal
            </Link>
            <button
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <Save aria-hidden="true" size={17} strokeWidth={2.2} />
              Simpan
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
