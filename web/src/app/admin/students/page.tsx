import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  PencilLine,
  PlusCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { toggleStudentActive } from "./actions";
import { getAdminStudentsData } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Santri - Admin - TahfidzFlow",
};

type AdminStudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
  }>;
};

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  await requireAdminScope();

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const { counts, students } = await getAdminStudentsData(query);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-6xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/admin"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Panel Admin
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Direktori Santri
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola data santri, penugasan guru, kelas akademik, halaqah, dan status aktifnya.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
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
              <p className="text-sm text-emerald-100">Santri</p>
              <p className="mt-3 text-4xl font-semibold">
                {counts.filteredStudentCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {query ? `hasil untuk "${query}"` : "tercatat dalam sistem"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Santri aktif</p>
              <p className="mt-1 text-xl font-semibold">
                {counts.activeStudentCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total santri</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.studentCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">seluruh data santri</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Aktif</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.activeStudentCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">siap dipantau guru</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Nonaktif</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.inactiveStudentCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">arsip atau jeda aktif</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Ditampilkan</p>
            <p className="mt-2 text-2xl font-semibold">
              {counts.filteredStudentCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">sesuai pencarian</p>
          </article>
        </section>

        <form
          action="/admin/students"
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100"
        >
          <Search aria-hidden="true" size={18} strokeWidth={2.2} />
          <input
            className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            defaultValue={query}
            name="q"
            placeholder="Cari nama santri, guru, halaqah, atau kelas"
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Daftar santri</h2>
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin/students/new"
              >
                <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                Tambah santri
              </Link>
              {query ? (
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  href="/admin/students"
                >
                  Reset pencarian
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                {counts.filteredStudentCount} terlihat
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {students.length > 0 ? (
              students.map((student) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md"
                  key={student.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {student.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.gender} - Bergabung {student.joinDate}
                      </p>
                    </div>
                    <span
                      className={
                        student.isActive
                          ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                          : "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                      }
                    >
                      {student.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <UserRound
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">{student.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <BookOpen
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">
                        {student.halaqahName} - {student.halaqahLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <GraduationCap
                        aria-hidden="true"
                        className="shrink-0 text-emerald-800"
                        size={16}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">
                        {student.academicClassName}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Target aktif
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950">
                        <Users aria-hidden="true" size={16} strokeWidth={2.2} />
                        {student.activeTargetCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Total catatan
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-950">
                        <BookOpen
                          aria-hidden="true"
                          size={16}
                          strokeWidth={2.2}
                        />
                        {student.totalRecordCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
                      href={`/admin/students/${student.id}/edit`}
                    >
                      <PencilLine
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      Ubah
                    </Link>
                    <form
                      action={toggleStudentActive.bind(
                        null,
                        student.id,
                        !student.isActive,
                      )}
                    >
                      <button
                        className={
                          student.isActive
                            ? "inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-100 px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
                            : "inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
                        }
                        type="submit"
                      >
                        {student.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-3">
                {query
                  ? "Tidak ada santri yang cocok dengan pencarian ini."
                  : "Belum ada data santri untuk ditampilkan."}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
