import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getAdminDashboardData } from "@/lib/admin";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin - TahfidzFlow",
};

const managementAreas = [
  {
    title: "Guru",
    description: "Kelola akun guru, aktivasi, dan pembagian akses.",
    icon: ShieldCheck,
    href: "/admin/teachers",
    actionLabel: "Buka modul",
  },
  {
    title: "Kelas Akademik",
    description: "Susun kelas sekolah seperti 7A, 8B, dan 9C.",
    icon: GraduationCap,
    href: "/admin/classes",
    actionLabel: "Buka modul",
  },
  {
    title: "Halaqah",
    description: "Atur kelompok halaqah dan level pembelajaran.",
    icon: Users,
    href: "/admin/halaqah",
    actionLabel: "Buka modul",
  },
  {
    title: "Santri",
    description: "Tambah santri dan hubungkan ke guru, kelas, dan halaqah.",
    icon: BookOpen,
    href: "/admin/students",
    actionLabel: "Buka modul",
  },
  {
    title: "Laporan",
    description: "Ringkasan progres seluruh guru dan santri.",
    icon: ClipboardList,
    href: "/admin/reports",
    actionLabel: "Buka laporan",
  },
];

export default async function AdminDashboardPage() {
  const { session } = await requireAdminScope();
  const dashboard = await getAdminDashboardData();
  const userName = session.user.name?.split(" ")[0] ?? "Admin";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-6xl sm:px-8">
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
              Panel Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan sistem untuk {userName} dan fondasi Phase 4.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Pengguna aktif</p>
              <p className="mt-3 text-4xl font-semibold">
                {dashboard.counts.activeTeacherCount + dashboard.counts.adminCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                admin dan guru aktif
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Total catatan</p>
              <p className="mt-1 text-xl font-semibold">
                {dashboard.counts.totalRecordCount}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Guru aktif</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.counts.activeTeacherCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              dari {dashboard.counts.teacherCount} akun guru
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Santri aktif</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.counts.activeStudentCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              dari {dashboard.counts.studentCount} total santri
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Kelas</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.counts.academicClassCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              kelas akademik aktif
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Halaqah</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.counts.classGroupCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              grup halaqah aktif
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Target aktif</p>
            <p className="mt-2 text-2xl font-semibold">
              {dashboard.counts.activeTargetCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">semua guru</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Area pengelolaan berikutnya</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Phase 4
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {managementAreas.map((area) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={area.title}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                      <area.icon aria-hidden="true" size={18} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950">{area.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {area.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {area.href ? (
                      <Link
                        className="inline-flex items-center rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950"
                        href={area.href}
                      >
                        {area.actionLabel}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                        {area.actionLabel}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Guru terbaru</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {dashboard.recentTeachers.length}
                </span>
                <Link
                  className="text-xs font-semibold text-emerald-800 transition hover:text-emerald-950"
                  href="/admin/teachers"
                >
                  Lihat semua
                </Link>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {dashboard.recentTeachers.length > 0 ? (
                dashboard.recentTeachers.map((teacher) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    key={teacher.id}
                  >
                    <p className="font-semibold text-slate-950">
                      {teacher.fullName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{teacher.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {teacher.studentCount} santri
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {teacher.classGroupCount} halaqah
                      </span>
                      <span
                        className={
                          teacher.isActive
                            ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-800"
                            : "rounded-full bg-amber-100 px-3 py-1 text-amber-800"
                        }
                      >
                        {teacher.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                  Belum ada data guru untuk ditampilkan.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
              <ClipboardList aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Langkah terbaik berikutnya</h2>
              <p className="mt-1 text-sm text-slate-600">
                Fondasi admin sekarang sudah ada. Langkah implementasi paling
                bernilai berikutnya adalah CRUD santri, guru, kelas akademik,
                dan halaqah agar aplikasi tidak lagi bergantung pada seed data.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-white transition hover:bg-emerald-950"
              href="/admin/reports"
            >
              <ClipboardList aria-hidden="true" size={16} strokeWidth={2.2} />
              Laporan Admin
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/reports"
            >
              <Target aria-hidden="true" size={16} strokeWidth={2.2} />
              Laporan Guru
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
