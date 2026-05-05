import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getStudentsData } from "@/lib/students";
import BottomNav from "@/components/BottomNav";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Santri - TahfidzFlow",
};

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const { teacherId, isAdmin } = await requireSessionScope();
  const students = await getStudentsData(query, teacherId);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Santri
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Pantau hafalan, murojaah, dan target aktif.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin/students"
              >
                <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
                Kelola
              </Link>
            ) : null}
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <Users aria-hidden="true" size={22} strokeWidth={2.3} />
            </div>
          </div>
        </header>

        {params?.success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
            {params.success}
          </div>
        ) : null}
        {params?.error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {params.error}
          </div>
        ) : null}

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Santri aktif</p>
              <p className="mt-3 text-4xl font-semibold">{students.length}</p>
              <p className="mt-1 text-sm text-slate-300">
                siap dicatat hari ini
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Perlu cek</p>
              <p className="mt-1 text-xl font-semibold">
                {students.filter((student) => student.needsReview).length}
              </p>
            </div>
          </div>
        </section>

        <form
          action="/students"
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100"
        >
          <Search aria-hidden="true" size={18} strokeWidth={2.2} />
          <input
            className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            defaultValue={query}
            name="q"
            placeholder="Cari nama santri"
            type="search"
          />
          <button
            className="rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
            type="submit"
          >
            Cari
          </button>
        </form>

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daftar santri</h2>
            <div className="flex items-center gap-2">
              {!isAdmin ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                  href="/students/new"
                >
                  <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                  Tambah
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                {students.length} aktif
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {students.length > 0 ? (
              students.map((student) => (
                <Link
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
                  href={`/students/${student.id}`}
                  key={student.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {student.fullName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {student.classSummary}
                      </p>
                    </div>
                    <span
                      className={
                        student.needsReview
                          ? "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                          : "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                      }
                    >
                      {student.needsReview ? "Cek" : "Aktif"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                      <BookOpen
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-emerald-800"
                        size={17}
                        strokeWidth={2.2}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">
                          Hafalan terakhir
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {student.latestHafalan?.range ?? "Belum ada catatan"}
                        </p>
                        {student.latestHafalan ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {student.latestHafalan.date} -{" "}
                            {student.latestHafalan.status}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                      <RotateCcw
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-emerald-800"
                        size={17}
                        strokeWidth={2.2}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">
                          Murojaah terakhir
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {student.latestMurojaah?.range ??
                            "Belum ada catatan"}
                        </p>
                        {student.latestMurojaah ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {student.latestMurojaah.date} -{" "}
                            {student.latestMurojaah.status}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-600">
                      <Target
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {student.activeTargetCount} target aktif
                    </span>
                    <span className="font-semibold text-emerald-800">
                      Detail
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2">
                {query
                  ? "Tidak ada santri yang cocok dengan pencarian ini."
                  : "Belum ada santri aktif untuk ditampilkan saat ini."}
              </div>
            )}
          </div>
        </section>

        <BottomNav currentPath="/students" />
      </section>
    </main>
  );
}
