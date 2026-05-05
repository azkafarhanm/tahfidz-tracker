import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Hash,
  PencilLine,
  RotateCcw,
  Save,
} from "lucide-react";
import { recordStatusOptions } from "@/lib/format";
import { getStudentFormContext } from "@/lib/students";
import { getRecordData } from "@/lib/records";
import { updateRecord } from "@/lib/record-actions";
import DeleteRecordButton from "./DeleteRecordButton";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EditRecordPageProps = {
  params: Promise<{
    id: string;
    recordType: "hafalan" | "murojaah";
    recordId: string;
  }>;
  searchParams?: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: EditRecordPageProps) {
  const { recordType } = await params;
  return {
    title: `Edit ${recordType === "hafalan" ? "Hafalan" : "Murojaah"} - TahfidzFlow`,
  };
}

export default async function EditRecordPage({
  params,
  searchParams,
}: EditRecordPageProps) {
  const { id, recordType, recordId } = await params;
  const { teacherId, isAdmin } = await requireSessionScope();
  const query = await searchParams;

  const [record, student] = await Promise.all([
    getRecordData(recordId, recordType, isAdmin ? null : teacherId),
    getStudentFormContext(id, teacherId),
  ]);

  if (!record || !student) {
    notFound();
  }

  if (record.studentId !== student.id) {
    redirect(`/students/${id}`);
  }

  const action = updateRecord.bind(null, student.id, recordType, recordId);
  const Icon = recordType === "hafalan" ? BookOpen : RotateCcw;
  const typeLabel = recordType === "hafalan" ? "Hafalan" : "Murojaah";

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
              {student.fullName}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Edit {typeLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {record.surah} {record.fromAyah}-{record.toAyah}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <PencilLine aria-hidden="true" size={22} strokeWidth={2.3} />
          </div>
        </header>

        {query?.error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {query.error}
          </div>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Materi {typeLabel}</h2>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Surah</span>
              <input
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                defaultValue={record.surah}
                name="surah"
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
                    defaultValue={record.fromAyah}
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
                    defaultValue={record.toAyah}
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
                  defaultValue={record.status}
                  name="status"
                  required
                >
                  {recordStatusOptions.map((option) => (
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
                  defaultValue={record.score ?? ""}
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
                  defaultValue={record.date}
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
                  defaultValue={record.time}
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
              defaultValue={record.notes}
              name="notes"
              placeholder="Opsional"
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

        <section className="mt-6 rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Hapus catatan</p>
              <p className="mt-1 text-xs text-slate-500">
                Catatan {record.surah} {record.fromAyah}-{record.toAyah} akan dihapus permanen.
              </p>
            </div>
            <DeleteRecordButton
              studentId={student.id}
              recordType={recordType}
              recordId={recordId}
            />
          </div>
        </section>
      </section>
    </main>
  );
}
