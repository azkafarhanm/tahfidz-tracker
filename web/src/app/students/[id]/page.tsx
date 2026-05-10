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
  PencilLine,
  PlusCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import { getStudentDetailData } from "@/lib/students";
import { getStudentProgressData } from "@/lib/reports";
import AppShell from "@/components/AppShell";
import InitialsAvatar from "@/components/InitialsAvatar";
import DeactivateButton from "./DeactivateButton";
import TargetActions from "@/components/TargetActions";
import { getSessionScope, requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

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
  searchParams?: Promise<{
    success?: string;
  }>;
};

function recordStatusClass(record: RecordItem) {
  return record.needsReview
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
}

function LatestRecordCard({
  icon: Icon,
  label,
  record,
  t,
}: {
  icon: typeof BookOpen;
  label: string;
  record: RecordItem | null;
  t: (key: string) => string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 truncate font-semibold text-slate-950 dark:text-white">
            {record?.range ?? t("noRecordYet")}
          </p>
          {record ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{record.date}</span>
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

function TargetCard({ target, studentId, t }: { target: TargetItem; studentId: string; t: (key: string) => string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{target.type}</p>
          <p className="mt-1 truncate font-semibold text-slate-950 dark:text-white">
            {target.range}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700"
            href={`/students/${studentId}/targets/${target.id}/edit`}
            title={t("editTargetTitle")}
          >
            <PencilLine aria-hidden="true" size={13} strokeWidth={2.2} />
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${target.isOverdue ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"}`}>
            {target.isOverdue ? t("targetBadgeOverdue") : t("targetBadgeAktif")}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={13} strokeWidth={2.2} />
            {target.startDate} - {target.endDate}
          </span>
          <span className="font-medium">{target.timeProgress}% {t("targetTimeProgress")}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${target.isOverdue ? "bg-red-400" : target.timeProgress > 75 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${target.timeProgress}%` }}
          />
        </div>
      </div>

      {target.notes ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {target.notes}
        </p>
      ) : null}

      <TargetActions targetId={target.id} />
    </article>
  );
}

function ActivityRow({ record, studentId, t }: { record: RecordItem; studentId: string; t: (key: string) => string }) {
  const Icon = record.type === "Hafalan" ? BookOpen : RotateCcw;
  const recordType = record.type === "Hafalan" ? "hafalan" : "murojaah";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-800 dark:bg-slate-800 dark:text-emerald-400">
          <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-950 dark:text-white">{record.type === "Hafalan" ? t("hafalanButton") : t("murojaahButton")}</p>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                {record.range}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-800 dark:hover:bg-slate-800"
                href={`/students/${studentId}/records/${recordType}/${record.id}/edit`}
              >
                <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
              </Link>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {record.date}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${recordStatusClass(record)}`}
            >
              {record.status}
            </span>
            {record.score !== null ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {t("scoreLabel")} {record.score}
              </span>
            ) : null}
          </div>
          {record.notes ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{record.notes}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("Students");
  const scope = await getSessionScope();
  if (!scope) {
    return { title: `${t("heading")} - TahfidzFlow` };
  }

  const teacherId = scope.teacherId;
  const student = await getStudentDetailData(id, teacherId);
  return {
    title: student ? `${student.fullName} - TahfidzFlow` : `${t("heading")} - TahfidzFlow`,
  };
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: StudentDetailPageProps) {
  const { id } = await params;
  const pageParams = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const student = await getStudentDetailData(id, teacherId);

  if (!student) {
    notFound();
  }

  const progress = await getStudentProgressData(id, isAdmin ? null : teacherId);
  const t = await getTranslations("StudentDetail");

  return (
    <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
         <header className="flex items-center justify-between gap-4">
           <div className="flex items-start gap-3 min-w-0">
             <InitialsAvatar name={student.fullName} size="lg" />
             <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href="/students"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 truncate text-2xl font-semibold text-slate-950 dark:text-white">
              {student.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {student.classSummary}
            </p>
            </div>
           </div>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              href={`/students/${student.id}/edit`}
            >
              <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
              {t("editButton")}
            </Link>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
              href={`/api/reports/export-student?studentId=${student.id}`}
            >
              <Download aria-hidden="true" size={14} strokeWidth={2.2} />
              {t("excelButton")}
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              href={`/api/reports/pdf-student?studentId=${student.id}`}
            >
              <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
              {t("pdfButton")}
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

        {pageParams?.success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            {pageParams.success}
          </div>
        ) : null}

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("summaryLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {student.activeTargets.length}
              </p>
              <p className="mt-1 text-sm text-slate-300">{t("activeTargetsSubtext")}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("needsReviewLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {student.needsReviewCount}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">{t("genderLabel")}</p>
              <p className="mt-1 font-semibold">{student.gender}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-slate-300">{t("joinDateLabel")}</p>
              <p className="mt-1 font-semibold">{student.joinDate}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <Link
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            href={`/students/${student.id}/hafalan/new`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            {t("hafalanButton")}
          </Link>
          <Link
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            href={`/students/${student.id}/murojaah/new`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            {t("murojaahButton")}
          </Link>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <LatestRecordCard
            icon={BookOpen}
            label={t("latestHafalanLabel")}
            record={student.latestHafalan}
            t={t}
          />
          <LatestRecordCard
            icon={RotateCcw}
            label={t("latestMurojaahLabel")}
            record={student.latestMurojaah}
            t={t}
          />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("targetActiveHeading")}</h2>
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950"
                href={`/students/${student.id}/targets/new`}
              >
                <PlusCircle aria-hidden="true" size={14} strokeWidth={2.2} />
                {t("addTargetButton")}
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <Target aria-hidden="true" size={15} strokeWidth={2.2} />
                {student.activeTargets.length}
              </span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {student.activeTargets.length > 0 ? (
              student.activeTargets.map((target) => (
                <TargetCard key={target.id} target={target} studentId={student.id} t={t} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                {t("emptyTargets")}
              </div>
            )}
          </div>
        </section>

        {student.notes ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center gap-2">
              <ClipboardList
                aria-hidden="true"
                className="text-emerald-800 dark:text-emerald-400"
                size={18}
                strokeWidth={2.2}
              />
              <h2 className="font-semibold">{t("notesHeading")}</h2>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{student.notes}</p>
          </section>
        ) : null}

        <section className="mt-6 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("recentActivityHeading")}</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
                  studentId={student.id}
                  t={t}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                {t("emptyActivity")}
              </div>
            )}
          </div>
        </section>

        {progress && progress.records.length > 6 ? (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("allHistoryHeading")}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {progress.records.length} {t("allHistoryBadge")}
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[550px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableType")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableAyat")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 text-center dark:text-slate-300">{t("tableSkor")}</th>
                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.records.map((r) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={r.id}>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{r.date}</td>
                      <td className="py-3 pr-4">
                        <span className={
                          r.type === "Hafalan"
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                            : "rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
                        }>
                          {r.type === "Hafalan" ? t("hafalanButton") : t("murojaahButton")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-950 dark:text-white">{r.range}</td>
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
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
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

        {!isAdmin ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{t("deactivateHeading")}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("deactivateDescription")}
                </p>
              </div>
              <DeactivateButton studentId={student.id} />
            </div>
          </section>
        ) : null}

      </AppShell>
  );
}
