import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BarChart3,
  Download,
  FileText,
  RotateCcw,
  Target,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { getTeacherReportData } from "@/lib/reports";
import BottomNav from "@/components/BottomNav";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan - TahfidzFlow",
};

export default async function ReportsPage() {
  const { teacherId, isAdmin } = await requireSessionScope();

  if (!teacherId) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
        <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 sm:max-w-3xl sm:px-8">
          <div className="text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-100 text-blue-900 shadow-lg">
              <BarChart3 size={28} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold">Laporan</h1>
            <p className="mt-2 text-slate-600">
              Laporan tersedia untuk akun guru.
            </p>
          </div>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/admin"
          >
            <ArrowLeft size={17} strokeWidth={2.3} />
            Panel Admin
          </Link>
        </section>
      </main>
    );
  }

  const data = await getTeacherReportData(teacherId);

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
            <h1 className="mt-3 text-2xl font-semibold">Laporan</h1>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan progres halaqah dan santri Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
              href="/api/reports/export-teacher"
            >
              <Download aria-hidden="true" size={16} strokeWidth={2.2} />
              Excel
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/api/reports/pdf-teacher"
            >
              <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
              PDF
            </a>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
              <BarChart3 aria-hidden="true" size={22} strokeWidth={2.3} />
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Rata-rata skor</p>
              <p className="mt-3 text-4xl font-semibold">{data.avgScore || "-"}</p>
              <p className="mt-1 text-sm text-slate-300">
                dari {data.totalHafalan + data.totalMurojaah} catatan
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Perlu cek</p>
              <p className="mt-1 text-xl font-semibold">{data.needsReviewCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Santri aktif</p>
            <p className="mt-2 text-2xl font-semibold">{data.studentCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Hafalan</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalHafalan}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Murojaah</p>
            <p className="mt-2 text-2xl font-semibold">{data.totalMurojaah}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Target aktif</p>
            <p className="mt-2 text-2xl font-semibold">{data.activeTargetCount}</p>
          </article>
        </section>

        {data.classGroups.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">Halaqah</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.classGroups.map((cg) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={cg.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-950">{cg.name}</p>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      {cg.level}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {cg.studentCount} santri
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Progres Santri</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 pr-4 font-semibold text-slate-700">Nama</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700">Halaqah</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center">Hafalan</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center">Murojaah</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700 text-center">Skor</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-700">Terakhir</th>
                  <th className="pb-3 font-semibold text-slate-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr
                    className="border-b border-slate-100"
                    key={s.id}
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {s.fullName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{s.halaqahName}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">
                      {s.hafalanCount}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-900">
                      {s.murojaahCount}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span
                        className={
                          s.avgScore >= 85
                            ? "font-semibold text-emerald-700"
                            : s.avgScore >= 70
                              ? "font-semibold text-amber-700"
                              : s.avgScore > 0
                                ? "font-semibold text-red-700"
                                : "text-slate-400"
                        }
                      >
                        {s.avgScore || "-"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{s.lastRange}</td>
                    <td className="py-3 text-center">
                      {s.needsReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          <AlertTriangle aria-hidden="true" size={10} />
                          Cek
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                          {s.lastStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isAdmin ? (
          <section className="mt-6">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/admin/reports"
            >
              <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
              Laporan Admin (semua guru)
            </Link>
          </section>
        ) : null}

        <BottomNav currentPath="/reports" />
      </section>
    </main>
  );
}
