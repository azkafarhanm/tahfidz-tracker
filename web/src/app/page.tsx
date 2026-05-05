import {
  BarChart3,
  BookOpen,
  PenLine,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import LogoutButton from "@/components/LogoutButton";
import BottomNav from "@/components/BottomNav";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - TahfidzFlow",
};

export default async function DashboardPreview() {
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const dashboard = await getDashboardData(teacherId);
  const userName = session?.user?.name?.split(" ")[0] ?? "Ustadz";
  const quickActions = [
    { label: "Hafalan", href: "/students", icon: BookOpen },
    { label: "Murojaah", href: "/students", icon: RotateCcw },
    { label: "Quick Log", href: "/quick-log", icon: PenLine },
    ...(isAdmin
      ? [{ label: "Admin", href: "/admin", icon: ShieldCheck }]
      : []),
    { label: "Laporan", href: "/reports", icon: BarChart3 },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Assalamu&apos;alaikum
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {userName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Ringkasan hari ini</p>
              <p className="mt-3 text-4xl font-semibold">
                {dashboard.todayRecordCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">setoran tercatat</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Target pekan ini</p>
              <p className="mt-1 text-xl font-semibold">
                {dashboard.targetProgress}%
              </p>
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 motion-safe:animate-progress origin-left"
              style={{ width: `${dashboard.targetProgress}%` }}
            />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
              href={action.href}
              key={action.label}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                <action.icon aria-hidden="true" size={18} strokeWidth={2.2} />
              </span>
              {action.label}
            </Link>
          ))}
        </section>

        <section className="mt-6 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {dashboard.needsReviewCount} perlu cek
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {dashboard.recentRecords.length > 0 ? (
              dashboard.recentRecords.map((record) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md"
                  key={record.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {record.student}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {record.type} - {record.range}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs font-medium text-slate-500">
                      <p>{record.date}</p>
                      <p className="mt-1">{record.time}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      {record.status}
                    </span>
                    <Link
                      className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                      href={`/students/${record.studentId}`}
                    >
                      Detail
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                Belum ada aktivitas. Mulai dengan mencatat hafalan atau
                murojaah pertama.
              </div>
            )}
          </div>
        </section>

        <BottomNav currentPath="/" />
      </section>
    </main>
  );
}
