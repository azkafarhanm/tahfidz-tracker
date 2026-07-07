import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Lock,
  PencilLine,
  PlusCircle,
  RotateCcw,
  Target,
  UserX,
} from "lucide-react";
import { getStudentDetailData } from "@/lib/students";
import AppShell from "@/components/AppShell";
import ExportSection from "@/components/ExportSection";
import InitialsAvatar from "@/components/InitialsAvatar";
import ScrollToHighlightedItem from "@/components/ScrollToHighlightedItem";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import ActivityRow from "./ActivityRow";
import TargetCard from "./TargetCard";
import ReactivateStudentButton from "@/components/ReactivateStudentButton";
import ProgramBadge from "@/components/ProgramBadge";
import { getSessionScope, requireSessionScope } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";
import { badge, heroSummary, backLink } from "@/lib/colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentDetail = Extract<
  NonNullable<Awaited<ReturnType<typeof getStudentDetailData>>>,
  { recentActivity: unknown }
>;
type RecordItem = StudentDetail["recentActivity"][number];

type StudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ programType?: string; returnTo?: string }>;
};

function recordStatusClass(record: RecordItem) {
  return record.needsReview ? badge.warning : badge.success;
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
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${badge.success}`}>
          <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 truncate font-semibold text-slate-950 dark:text-white">
            {record?.range ?? t("noRecordYet")}
          </p>
          {record ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {record.date}
              </span>
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

export async function generateMetadata({ params }: StudentDetailPageProps) {
  const t = await getTranslations("Students");
  await params;
  await getSessionScope();
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: StudentDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("StudentDetail");
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const query = await searchParams;
  const student = await getStudentDetailData(id, teacherId, locale);

  if (!student) {
    notFound();
  }

  // Extract programType for back navigation (available when student is fully loaded)
  const programType = "programType" in student ? student.programType : undefined;
  // When the user arrived from an explicit workflow origin, return there so the
  // teacher keeps that working position. Validated against open redirect like
  // other returnTo uses; only known teacher origins are honored so the normal
  // list → detail → Back behavior is preserved otherwise.
  const rawReturnTo = query?.returnTo;
  const paramProgramType =
    query?.programType === "ACADEMIC" || query?.programType === "BOARDING"
      ? query.programType
      : undefined;
  const detailHref = `/students/${student.id}${paramProgramType ? `?programType=${paramProgramType}` : ""}`;
  const isDashboardReturn =
    rawReturnTo === "/" || rawReturnTo?.startsWith("/?") === true;
  const returnToHref =
    rawReturnTo &&
    (rawReturnTo.startsWith("/quick-log") || isDashboardReturn) &&
    !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : undefined;
  const studentsBackHref = returnToHref
    ?? (programType ? `/students?programType=${programType}` : "/students");

  if ("isUnauthorized" in student) {
    return (
      <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
        <div className="mx-auto max-w-lg py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <Lock aria-hidden="true" size={32} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">
              {t("accessDeniedHeading")}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              {t("accessDeniedDescription")}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
              {t("accessDeniedHelp")}
            </p>
            <div className="mt-8">
              <WorkflowContextLink
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-emerald-900 dark:hover:bg-emerald-800"
                compatibilityKeys={["programType"]}
                href={studentsBackHref}
                preferStoredContext
                restoreContext
              >
                {t("backToStudents")}
              </WorkflowContextLink>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if ("isInactive" in student) {
    return (
      <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
        <div className="mx-auto max-w-lg py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <UserX aria-hidden="true" size={32} strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">
              {t("inactiveHeading")}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              {t.rich("inactiveDescription", {
                name: () => (
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {student.fullName}
                  </span>
                ),
              })}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
              {t("inactiveArchiveNote")}
            </p>

            {student.isOwnStudent ? (
              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {t("inactiveOwnerHint")}
                </p>
                <div className="flex justify-center gap-3">
                  <WorkflowContextLink
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    compatibilityKeys={["programType"]}
                    href={studentsBackHref}
                    preferStoredContext
                    restoreContext
                  >
                    {t("cancelReactivateButton")}
                  </WorkflowContextLink>
                  <ReactivateStudentButton studentId={student.id} studentName={student.fullName} />
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <WorkflowContextLink
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-emerald-900 dark:hover:bg-emerald-800"
                  compatibilityKeys={["programType"]}
                  href={studentsBackHref}
                  preferStoredContext
                  restoreContext
                >
                  {t("backToStudents")}
                </WorkflowContextLink>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
         <ScrollToHighlightedItem />
         <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <InitialsAvatar name={student.fullName} size="lg" />
              <div className="min-w-0">
             <WorkflowContextLink
               className={backLink}
               compatibilityKeys={["programType"]}
               href={studentsBackHref}
               preferStoredContext
               restoreContext
             >
               <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
               {t("backLink")}
             </WorkflowContextLink>
             <h1 className="mt-3 truncate text-2xl font-semibold text-slate-950 dark:text-white">
               {student.fullName}
             </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {student.classSummary}
              </p>
              {programType && (
                <div className="mt-1">
                  <ProgramBadge programType={programType} />
                </div>
              )}
              </div>
            </div>
           <div className="flex flex-wrap items-center gap-2">
             <WorkflowContextLink
               className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
               href={`/students/${student.id}/edit?returnTo=${encodeURIComponent(detailHref)}`}
             >
               <PencilLine aria-hidden="true" size={14} strokeWidth={2.2} />
               {t("editButton")}
             </WorkflowContextLink>
              <ExportSection
                excelHref={`/api/reports/export-student?studentId=${student.id}`}
                excelClassName="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-3 text-xs font-semibold text-white transition hover:bg-emerald-950"
                excelContent={
                  <>
                    <Download aria-hidden="true" size={14} strokeWidth={2.2} />
                    {t("excelButton")}
                  </>
                }
                pdfHref={`/api/reports/pdf-student?studentId=${student.id}`}
                pdfClassName="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                pdfContent={
                  <>
                    <FileText aria-hidden="true" size={14} strokeWidth={2.2} />
                    {t("pdfButton")}
                  </>
                }
              />
            </div>
         </header>

        <section className={`mt-6 rounded-[1.75rem] p-5 sm:p-6 ${heroSummary}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">{t("summaryLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">
                {student.activeTargets.length}
              </p>
              <p className="mt-1 text-sm text-slate-300">{t("activeTargetsSubtext")}</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs text-slate-300">{t("needsReviewLabel")}</p>
                <p className="mt-1 text-xl font-semibold">
                  {student.needsReviewCount}
                </p>
              </div>
              {student.tasmiJuzSummary ? (
                <div className="rounded-2xl bg-violet-500/20 px-3 py-2 text-right">
                  <p className="text-xs text-violet-200">{t("tasmiSummary")}</p>
                  <p className="mt-1 text-sm font-semibold text-violet-100">
                    {student.tasmiJuzSummary}
                  </p>
                </div>
              ) : null}
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

        <section className="mt-5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-3 sm:gap-3">
          <WorkflowContextLink
            className="flex min-h-16 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] min-[390px]:px-2.5 sm:gap-3 sm:px-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            href={`/students/${student.id}/hafalan/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${badge.success}`}>
              <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <span className="whitespace-nowrap leading-tight">{t("hafalanButton")}</span>
          </WorkflowContextLink>
          <WorkflowContextLink
            className="flex min-h-16 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md active:scale-[0.98] min-[390px]:px-2.5 sm:gap-3 sm:px-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            href={`/students/${student.id}/murojaah/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${badge.success}`}>
              <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <span className="whitespace-nowrap leading-tight">{t("murojaahButton")}</span>
          </WorkflowContextLink>
          <WorkflowContextLink
            className="flex min-h-16 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:border-violet-300 hover:shadow-md active:scale-[0.98] min-[390px]:px-2.5 sm:gap-3 sm:px-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            href={`/students/${student.id}/tasmi/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 sm:h-9 sm:w-9 dark:bg-violet-950 dark:text-violet-400">
              <Award aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <span className="whitespace-nowrap leading-tight">{t("tasmiButton")}</span>
          </WorkflowContextLink>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
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
          <LatestRecordCard
            icon={Award}
            label={t("latestTasmiLabel")}
            record={student.latestTasmi}
            t={t}
          />
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("targetActiveHeading")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <WorkflowContextLink
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-950"
                href={`/students/${student.id}/targets/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
              >
                <PlusCircle aria-hidden="true" size={14} strokeWidth={2.2} />
                {t("addTargetButton")}
              </WorkflowContextLink>
              <span className={`inline-flex items-center gap-2 rounded-full ${badge.success} px-3 py-1 text-xs font-medium`}>
                <Target aria-hidden="true" size={15} strokeWidth={2.2} />
                {student.activeTargets.length}
              </span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {student.activeTargets.length > 0 ? (
              student.activeTargets.map((target) => (
                <TargetCard key={target.id} target={target} studentId={student.id} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70">
                <div className={`mx-auto grid h-11 w-11 place-items-center rounded-2xl ${badge.success}`}>
                  <Target aria-hidden="true" size={20} strokeWidth={2.2} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("emptyTargets")}
                </p>
                <WorkflowContextLink
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-950"
                  href={`/students/${student.id}/targets/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
                >
                  <PlusCircle aria-hidden="true" size={14} strokeWidth={2.2} />
                  {t("addTargetButton")}
                </WorkflowContextLink>
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

        {student.tasmiRecords.length > 0 ? (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("tasmiHeading")}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <WorkflowContextLink
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-950"
                  href={`/students/${student.id}/tasmi/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
                >
                  <PlusCircle aria-hidden="true" size={14} strokeWidth={2.2} />
                  {t("tasmiButton")}
                </WorkflowContextLink>
                <span className={`inline-flex items-center gap-2 rounded-full ${badge.neutral} px-3 py-1 text-xs font-medium`}>
                  <Award aria-hidden="true" size={15} strokeWidth={2.2} />
                  {student.tasmiJuzSummary || student.tasmiRecords.length}
                </span>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableDate")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableJuz")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableGrade")}</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{t("tableStatus")}</th>
                    <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">{t("tableExaminer")}</th>
                  </tr>
                </thead>
                <tbody>
                  {student.tasmiRecords.map((tr) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={tr.id}>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{tr.date}</td>
                      <td className="py-3 pr-4 font-medium text-slate-950 dark:text-white">Juz {tr.juz}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{tr.grade}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${tr.status === "Lulus" ? badge.success : badge.warning}`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{tr.examinerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mt-6 flex flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("recentActivityHeading")}</h2>
            <span className={`inline-flex items-center gap-2 rounded-full ${badge.neutral} px-3 py-1 text-xs font-medium`}>
              <CheckCircle2 aria-hidden="true" size={15} strokeWidth={2.2} />
              {student.recentActivity.length}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {student.recentActivity.length > 0 ? (
              student.recentActivity.map((record) => (
                <ActivityRow
                  detailHref={detailHref}
                  key={`${record.type}-${record.id}`}
                  record={record}
                  studentId={student.id}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center dark:border-slate-700 dark:bg-slate-900/70">
                <div className={`mx-auto grid h-11 w-11 place-items-center rounded-2xl ${badge.success}`}>
                  <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {t("emptyActivity")}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <WorkflowContextLink
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-950"
                    href={`/students/${student.id}/hafalan/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
                  >
                    <BookOpen aria-hidden="true" size={14} strokeWidth={2.2} />
                    {t("hafalanButton")}
                  </WorkflowContextLink>
                  <WorkflowContextLink
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    href={`/students/${student.id}/murojaah/new${paramProgramType ? `?programType=${paramProgramType}` : ""}`}
                  >
                    <RotateCcw aria-hidden="true" size={14} strokeWidth={2.2} />
                    {t("murojaahButton")}
                  </WorkflowContextLink>
                </div>
              </div>
            )}
          </div>
        </section>

        {student.historyRecords.length > 6 ? (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("allHistoryHeading")}</h2>
              <span className={`rounded-full ${badge.success} px-3 py-1 text-xs font-medium`}>
                {student.historyRecords.length} {t("allHistoryBadge")}
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
                  {student.historyRecords.map((r) => (
                    <tr className="border-b border-slate-100 dark:border-slate-800" key={r.id}>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                        {r.date}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${r.type === "Hafalan" ? badge.success : r.type === "Tasmi'" ? "bg-violet-50 text-violet-800 dark:bg-violet-900 dark:text-violet-100" : badge.progress}`}>
                          {r.type === "Hafalan" ? t("hafalanButton") : r.type === "Tasmi'" ? t("tasmiButton") : t("murojaahButton")}
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
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.warning}`}>
                            {r.status}
                          </span>
                        ) : (
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.success}`}>
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

      </AppShell>
  );
}
