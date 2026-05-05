import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  PencilLine,
  Target,
  AlertTriangle,
} from "lucide-react";
import { getStudentProgressData } from "@/lib/reports";
import { requireAdminScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminStudentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: AdminStudentDetailPageProps) {
  const { id } = await params;
  await requireAdminScope();
  const data = await getStudentProgressData(id, null);
  return { title: data ? `${data.fullName} - Admin - TahfidzFlow` : "Santri - TahfidzFlow" };
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
  const { id } = await params;
  await requireAdminScope();
  const data = await getStudentProgressData(id, null);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/admin/students"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Direktori Santri
            </Link>
            <h1 className="mt-3 truncate text-2xl font-semibold">{data.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {data.halaqahName} ({data.halaqahLevel}) &middot; {data.academicClassName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href={`/admin/students/${id}/edit`}
            >
              <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
              Edit
            </Link>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
              href={`/api/reports/export-student?studentId=${id}`}
            >
              <Download aria-hidden="true" size={14} strokeWidth={2.2} />
              Excel
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href={`/api/reports/pdf-student?studentId=${id}`}
            >
              <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
              PDF
            </a>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Rata-rata skor</p>
              <p className="mt-3 text-4xl font-semibold">{data.avgScore || "-"}</p>
              <p className="mt-1 text-sm text-slate-300">
                {data.records.length} catatan total
              </p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">Hafalan</p>
                <p className="mt-1 text-xl font-semibold">{data.hafalanCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">Murojaah</p>
                <p className="mt-1 text-xl font-semibold">{data.murojaahCount}</p>
              </div>
            </div>
          </div>
        </section>

        {data.activeTargets.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">Target Aktif</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {data.activeTargets.map((t, i) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={i}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={
                        t.type === "Hafalan"
                          ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                          : "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800"
                      }
                    >
                      {t.type}
                    </span>
                    <Target className="text-emerald-800" size={16} strokeWidth={2.2} />
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">{t.range}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t.startDate} — {t.endDate}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="text-lg font-semibold">Riwayat Hafalan & Murojaah</h2>
          {data.records.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[550px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Tanggal</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Tipe</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Ayat</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 text-center">Skor</th>
                    <th className="pb-3 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr className="border-b border-slate-100" key={r.id}>
                      <td className="py-3 pr-4 text-slate-600">{r.date}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            r.type === "Hafalan"
                              ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                              : "rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
                          }
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-950">{r.range}</td>
                      <td className="py-3 pr-4 text-center">
                        <span
                          className={
                            r.score !== null && r.score >= 85
                              ? "font-semibold text-emerald-700"
                              : r.score !== null && r.score >= 70
                                ? "font-semibold text-amber-700"
                                : r.score !== null
                                  ? "font-semibold text-red-700"
                                  : "text-slate-400"
                          }
                        >
                          {r.score ?? "-"}
                        </span>
                      </td>
                      <td className="py-3">
                        {r.needsReview ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                            <AlertTriangle aria-hidden="true" size={10} />
                            {r.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
              Belum ada catatan hafalan atau murojaah.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
