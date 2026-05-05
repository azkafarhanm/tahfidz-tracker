import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  ShieldCheck,
  Users,
  BookOpen,
  Target,
  TrendingUp,
} from "lucide-react";
import { getAdminReportData } from "@/lib/reports";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan Admin - TahfidzFlow",
};

export default async function AdminReportsPage() {
  await requireAdminScope();
  const data = await getAdminReportData();

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
            <h1 className="mt-3 text-2xl font-semibold">Laporan Admin</h1>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan keseluruhan sistem TahfidzFlow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
              href="/api/reports/export-admin"
            >
              <Download aria-hidden="true" size={16} strokeWidth={2.2} />
              Excel
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/api/reports/pdf-admin"
            >
              <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
              PDF
            </a>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Total catatan</p>
              <p className="mt-3 text-4xl font-semibold">
                {data.totalHafalan + data.totalMurojaah}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {data.totalHafalan} hafalan / {data.totalMurojaah} murojaah
              </p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">Guru</p>
                <p className="mt-1 text-xl font-semibold">{data.totalTeachers}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">Santri</p>
                <p className="mt-1 text-xl font-semibold">{data.totalStudents}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Guru aktif</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalTeachers}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Santri aktif</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalStudents}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total hafalan</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalHafalan}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total murojaah</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalMurojaah}</p>
          </article>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ringkasan per Guru</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              {data.teachers.length} guru
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 pr-4 font-semibold text-slate-700">Nama Guru</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700">Email</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center">Santri</th>
                  <th className="pb-3 font-semibold text-slate-700 text-center">Halaqah</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((t) => (
                  <tr className="border-b border-slate-100" key={t.id}>
                    <td className="py-3 pr-4 font-medium text-slate-950">{t.fullName}</td>
                    <td className="py-3 pr-4 text-slate-600">{t.email}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">{t.studentCount}</td>
                    <td className="py-3 text-center text-slate-900">{t.classGroupCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
            href="/reports"
          >
            <BarChart3 aria-hidden="true" size={16} strokeWidth={2.2} />
            Laporan Guru
          </Link>
        </section>
      </section>
    </main>
  );
}
