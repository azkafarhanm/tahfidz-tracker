import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getStudentsData, getInactiveStudentsData } from "@/lib/students";
import AppShell from "@/components/AppShell";
import ReactivateStudentButton from "@/components/ReactivateStudentButton";
import DeleteStudentButton from "@/components/DeleteStudentButton";
import InitialsAvatar from "@/components/InitialsAvatar";
import LiveSearchForm from "@/components/LiveSearchForm";
import { requireSessionScope } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Students");
  return { title: `${t("heading")} - TahfidzFlow` };
}

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
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const students = await getStudentsData(query, teacherId, locale);
  const inactiveStudents = !isAdmin ? await getInactiveStudentsData(teacherId) : [];
  const t = await getTranslations("Students");

  return (
    <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              {t("backLink")}
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {t("heading")}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
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
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
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
              <p className="text-sm text-emerald-100">{t("activeStudentsLabel")}</p>
              <p className="mt-3 text-4xl font-semibold">{students.length}</p>
              <p className="mt-1 text-sm text-slate-300">
                {t("activeStudentsSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">{t("needsReviewLabel")}</p>
              <p className="mt-1 text-xl font-semibold">
                {students.filter((student) => student.needsReview).length}
              </p>
            </div>
          </div>
        </section>

        <LiveSearchForm
          action="/students"
          buttonLabel={t("searchButton")}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-900"
          defaultValue={query}
          inputClassName="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder-slate-500"
          placeholder={t("searchPlaceholder")}
        />

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("listHeading")}</h2>
            <div className="flex items-center gap-2">
              {!isAdmin ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                  href="/students/new"
                >
                  <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("addButton")}
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {students.length} {t("activeCountBadge")}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {students.length > 0 ? (
              students.map((student) => (
                <Link
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                  href={`/students/${student.id}`}
                  key={student.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <InitialsAvatar name={student.fullName} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950 dark:text-white">
                          {student.fullName}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {student.classSummary}
                        </p>
                      </div>
                    </div>
                    <span
                      className={
                        student.needsReview
                          ? "shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                          : "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                      }
                    >
                      {student.needsReview ? t("badgeNeedsReview") : t("badgeAktif")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                      <BookOpen
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={17}
                        strokeWidth={2.2}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {t("latestHafalanLabel")}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {student.latestHafalan?.range ?? t("noRecordYet")}
                        </p>
                        {student.latestHafalan ? (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {student.latestHafalan.date} -{" "}
                            {student.latestHafalan.status}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                      <RotateCcw
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-emerald-800 dark:text-emerald-400"
                        size={17}
                        strokeWidth={2.2}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {t("latestMurojaahLabel")}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {student.latestMurojaah?.range ??
                            t("noRecordYet")}
                        </p>
                        {student.latestMurojaah ? (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {student.latestMurojaah.date} -{" "}
                            {student.latestMurojaah.status}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                      <Target
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.2}
                      />
                      {student.activeTargetCount} {t("targetCountLabel")}
                    </span>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                      {t("detailLink")}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                {query
                  ? t("emptySearch")
                  : t("emptyNoStudents")}
              </div>
            )}
          </div>
        </section>

        {!isAdmin && inactiveStudents.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">{t("inactiveHeading")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("inactiveDescription")}
            </p>
            <div className="mt-3 space-y-3">
              {inactiveStudents.map((s) => {
                const deleteBlockers = [
                  s.totalRecordCount > 0
                    ? t("deleteBlockedRecordItem", {
                        count: s.totalRecordCount,
                      })
                    : null,
                  s.summativeScoreCount > 0
                    ? t("deleteBlockedSummativeItem", {
                        count: s.summativeScoreCount,
                      })
                    : null,
                  s.activeTargetCount > 0
                    ? t("deleteBlockedTargetItem", {
                        count: s.activeTargetCount,
                      })
                    : null,
                ].filter(Boolean);
                const deleteDisabledReason =
                  deleteBlockers.length > 0
                    ? t("deleteBlockedReason", {
                        items: deleteBlockers.join(", "),
                      })
                    : undefined;

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
                    key={s.id}
                  >
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={s.fullName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">{s.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.classSummary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReactivateStudentButton studentId={s.id} studentName={s.fullName} />
                    <DeleteStudentButton
                      disabledReason={deleteDisabledReason}
                      studentId={s.id}
                    />
                  </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

      </AppShell>
  );
}
