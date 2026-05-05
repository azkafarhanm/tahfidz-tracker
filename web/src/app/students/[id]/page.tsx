import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { getStudentDetailData } from "@/lib/students";
import { getStudentProgressData } from "@/lib/reports";
import BottomNav from "@/components/BottomNav";
import { getSessionScope, requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentDetail = NonNullable<
  Awaited<ReturnType<typeof getStudentDetailData>>
>;
type RecordItem = StudentDetail["recentActivity"][number];
type TargetItem = StudentDetail["activeTargets"][number];

type StudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function recordStatusClass(record: RecordItem) {
  return record.needsReview
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-50 text-emerald-800";
}

function LatestRecordCard({
  icon: Icon,
  label,
  record,
}: {
  icon: typeof BookOpen;
  label: string;
  record: RecordItem | null;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate font-semibold text-slate-950">
            {record?.range ?? "Belum ada catatan"}
          </p>
          {record ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">{record.date}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${recordStatusClass(record)}`}
              >
                {record.status}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TargetCard({ target }: { target: TargetItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{target.type}</p>
          <p className="mt-1 truncate font-semibold text-slate-950">
            {target.range}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Aktif
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays aria-hidden="true" size={15} strokeWidth={2.2} />
        {target.startDate} - {target.endDate}
      </div>
      {target.notes ? (
        <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {target.notes}
        </p>
      ) : null}
    </article>
  );
}

function ActivityRow({ record }: { record: RecordItem }) {
  const Icon = record.type === "Hafalan" ? BookOpen : RotateCcw;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-800">
          <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{record.type}</p>
              <p className="mt-1 truncate text-sm text-slate-600">
                {record.range}
              </p>
            </div>
            <p className="shrink-0 text-xs font-medium text-slate-500">
              {record.date}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${recordStatusClass(record)}`}
            >
              {record.status}
            </span>
            {record.score !== null ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Nilai {record.score}
              </span>
            ) : null}
          </div>
          {record.notes ? (
            <p className="mt-3 text-sm text-slate-600">{record.notes}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const scope = await getSessionScope();
  if (!scope) {
    return { title: "Santri - TahfidzFlow" };
  }

  const teacherId = scope.teacherId;
  const student = await getStudentDetailData(id, teacherId);
  return { title: student ? `${student.fullName} - TahfidzFlow` : "Santri - TahfidzFlow" };
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id } = await params;
  const { teacherId, isAdmin } = await requireSessionScope();
  const student = await getStudentDetailData(id, teacherId);

  if (!student) {
    notFound();
  }

  const progress = await getStudentProgressData(id, isAdmin ? null : teacherId);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/students"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Santri
            </Link>
            <h1 className="mt-3 truncate text-2xl font-semibold text-slate-950">
              {student.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {student.classSummary}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
              href={`/api/reports/export-student?studentId=${student.id}`}
            >
              <Download aria-hidden="true" size={14} strokeWidth={2.2} />
              Excel
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href={`/api/reports/pdf-student?studentId=${student.id}`}
            >
              <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
              PDF
            </a>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20">
              {student.fullName
                .split(" ")
                .slice(0, 2)
                .map((name) => name[0])
                .join("")}
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">Ringkasan santri</p>
              <p className="mt-3 text-4xl font-semibold">
                {student.activeTargets.length}
              </p>
              <p className="mt-1 text-sm text-slate-300">target aktif</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">Perlu cek</p>
              <p className="mt-1 text-xl font-semibold">
                {student.needsReviewCount}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">Gender</p>
              <p className="mt-1 font-semibold">{student.gender}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">Bergabung</p>
              <p className="mt-1 font-semibold">{student.joinDate}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <Link
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
            href={`/students/${student.id}/hafalan/new`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
              <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            Hafalan
          </Link>
          <Link
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
            href={`/students/${student.id}/murojaah/new`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
              <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            Murojaah
          </Link>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <LatestRecordCard
            icon={BookOpen}
            label="Hafalan terakhir"
            record={student.latestHafalan}
          />
          <LatestRecordCard
            icon={RotateCcw}
            label="Murojaah terakhir"
            record={student.latestMurojaah}
          />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Target aktif</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <Target aria-hidden="true" size={15} strokeWidth={2.2} />
              {student.activeTargets.length}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {student.activeTargets.length > 0 ? (
              student.activeTargets.map((target) => (
                <TargetCard key={target.id} target={target} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2">
                Belum ada target aktif untuk santri ini.
              </div>
            )}
          </div>
        </section>

        {student.notes ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList
                aria-hidden="true"
                className="text-emerald-800"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">Catatan</h2>
            </div>
            <p className="mt-3 text-sm text-slate-600">{student.notes}</p>
          </section>
        ) : null}

        <section className="mt-6 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <CheckCircle2 aria-hidden="true" size={15} strokeWidth={2.2} />
              {student.recentActivity.length}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {student.recentActivity.length > 0 ? (
              student.recentActivity.map((record) => (
                <ActivityRow
                  key={`${record.type}-${record.id}`}
                  record={record}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                Belum ada aktivitas untuk santri ini.
              </div>
            )}
          </div>
        </section>

        {progress && progress.records.length > 6 ? (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Semua Riwayat</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                {progress.records.length} catatan
              </span>
            </div>
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
                  {progress.records.map((r) => (
                    <tr className="border-b border-slate-100" key={r.id}>
                      <td className="py-3 pr-4 text-slate-600">{r.date}</td>
                      <td className="py-3 pr-4">
                        <span className={
                          r.type === "Hafalan"
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
                        }>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-950">{r.range}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={
                          r.score !== null && r.score >= 85
                            ? "font-semibold text-emerald-700"
                            : r.score !== null && r.score >= 70
                              ? "font-semibold text-amber-700"
                              : r.score !== null
                                ? "font-semibold text-red-700"
                                : "text-slate-400"
                        }>
                          {r.score ?? "-"}
                        </span>
                      </td>
                      <td className="py-3">
                        {r.needsReview ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
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
          </section>
        ) : null}

        <BottomNav currentPath="/students" />
      </section>
    </main>
  );
}
