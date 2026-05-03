import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  PenLine,
  Save,
} from "lucide-react";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  getQuickLogStudents,
  parseQuickLogInput,
  quickLogStatusLabels,
  quickLogTypeLabels,
} from "@/lib/quick-log";
import { todayInputValue, nowTimeValue } from "@/lib/format";
import { createQuickLogRecord } from "./actions";
import BottomNav from "@/components/BottomNav";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuickLogPageProps = {
  searchParams?: Promise<{
    text?: string;
    error?: string;
  }>;
};

export const metadata = {
  title: "Catat Cepat - TahfidzFlow",
};

export default async function QuickLogPage({
  searchParams,
}: QuickLogPageProps) {
  const params = await searchParams;
  const input = params?.text?.trim() ?? "";
  const error = params?.error;
  const { teacherId } = await requireSessionScope();
  const students = await getQuickLogStudents(teacherId);
  const parseResult = input ? parseQuickLogInput(input, students) : null;
  const parsedRecord = parseResult?.ok ? parseResult.record : null;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Catat Cepat
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Hafalan dan murojaah dari satu baris catatan.
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PenLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {error}
          </div>
        ) : null}

        <form action="/quick-log" className="mt-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <PenLine
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Catatan</h2>
            </div>

            <textarea
              autoFocus
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              defaultValue={input}
              name="text"
              placeholder="Afdal Al-Mulk 1-10 lancar"
            />

            <button
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
              type="submit"
            >
              <CheckCircle2 aria-hidden="true" size={17} strokeWidth={2.2} />
              Parse
            </button>
          </section>
        </form>

        {parseResult && !parseResult.ok ? (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Belum bisa diparse</p>
            <div className="mt-2 space-y-1">
              {parseResult.errors.map((message, i) => (
                <p key={i}>{message}</p>
              ))}
            </div>
          </section>
        ) : null}

        {parsedRecord ? (
          <form action={createQuickLogRecord} className="mt-4 space-y-4">
            <input name="sourceText" type="hidden" value={input} />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">Santri</h2>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Nama
                </span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  defaultValue={parsedRecord.student.id}
                  name="studentId"
                  required
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} - {student.classSummary}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">Materi</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Jenis
                  </span>
                  <select
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    defaultValue={parsedRecord.type}
                    name="type"
                    required
                  >
                    {Object.entries(quickLogTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Surah
                  </span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    defaultValue={parsedRecord.surah}
                    name="surah"
                    required
                    type="text"
                  />
                </label>
              </div>

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
                      defaultValue={parsedRecord.fromAyah}
                      max={286}
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
                      defaultValue={parsedRecord.toAyah}
                      max={286}
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
              <h2 className="font-semibold">Penilaian</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <select
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    defaultValue={parsedRecord.status}
                    name="status"
                    required
                  >
                    {Object.values(RecordStatus).map((value) => (
                      <option key={value} value={value}>
                        {quickLogStatusLabels[value]}
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
                    defaultValue={parsedRecord.score ?? ""}
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
              <h2 className="font-semibold">Catatan</h2>

              <textarea
                className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={parsedRecord.notes ?? ""}
                name="notes"
                placeholder="Opsional"
              />
            </section>

            <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur">
              <Link
                className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                href="/quick-log"
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
        ) : null}

        {!parsedRecord ? (
          <BottomNav currentPath="/quick-log" />
        ) : null}
      </section>
    </main>
  );
}
