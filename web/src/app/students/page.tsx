import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  getLiveInactiveStudentsData,
  getLiveStudentsPageData,
} from "@/lib/students-page-live";
import ActiveStudentCard from "@/components/ActiveStudentCard";
import AppShell from "@/components/AppShell";
import InactiveStudentsSection from "@/components/InactiveStudentsSection";
import LiveSearchForm from "@/components/LiveSearchForm";
import StudentsPageAutoRefresh from "@/components/StudentsPageAutoRefresh";
import { requireSessionScope } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";

export const runtime = "nodejs";

export async function generateMetadata() {
  const t = await getTranslations("Students");
  return { title: `${t("heading")} - TahfidzFlow` };
}

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
    page?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const page = parsePage(params?.page);
  const locale = await getLocale();
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const status = params?.status === "inactive" && !isAdmin ? "inactive" : "active";
  const isInactiveView = status === "inactive";
  const studentPage = await getLiveStudentsPageData(query, teacherId, locale, page, PAGE_SIZE);
  const inactiveStudents = !isAdmin ? await getLiveInactiveStudentsData(teacherId) : [];
  const filteredInactiveStudents = query
    ? inactiveStudents.filter((student) => {
        const normalizedQuery = query.toLowerCase();
        return (
          student.fullName.toLowerCase().includes(normalizedQuery) ||
          student.classSummary.toLowerCase().includes(normalizedQuery)
        );
      })
    : inactiveStudents;
  const t = await getTranslations("Students");
  const buildPageHref = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    if (nextPage > 1) nextParams.set("page", String(nextPage));
    const search = nextParams.toString();
    return search ? `/students?${search}` : "/students";
  };
  const buildStatusHref = (nextStatus: "active" | "inactive") => {
    const nextParams = new URLSearchParams();
    if (nextStatus === "inactive") nextParams.set("status", "inactive");
    if (query) nextParams.set("q", query);
    const search = nextParams.toString();
    return search ? `/students?${search}` : "/students";
  };
  const hasPreviousPage = studentPage.page > 1;
  const hasNextPage = studentPage.page < studentPage.totalPages;
  const searchAction = isInactiveView ? "/students?status=inactive" : "/students";

  return (
    <AppShell currentPath="/students" userName={session.user.name} isAdmin={isAdmin}>
        <StudentsPageAutoRefresh />
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

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-100">
                {isInactiveView ? t("inactiveHeading") : t("activeStudentsLabel")}
              </p>
              <p className="mt-3 text-4xl font-semibold">
                {isInactiveView ? inactiveStudents.length : studentPage.totalCount}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {isInactiveView ? t("inactiveDescription") : t("activeStudentsSubtext")}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-slate-300">
                {isInactiveView ? t("activeStudentsLabel") : t("needsReviewLabel")}
              </p>
              <p className="mt-1 text-xl font-semibold">
                {isInactiveView
                  ? studentPage.totalCount
                  : studentPage.students.filter((student) => student.needsReview).length}
              </p>
            </div>
          </div>
        </section>

        {!isAdmin ? (
          <div className="mt-5 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <Link
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                !isInactiveView
                  ? "bg-emerald-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              href={buildStatusHref("active")}
              scroll={false}
            >
              {t("activeTab")}
            </Link>
            <Link
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                isInactiveView
                  ? "bg-emerald-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              href={buildStatusHref("inactive")}
              scroll={false}
            >
              {t("inactiveTab")}
            </Link>
          </div>
        ) : null}

        <LiveSearchForm
          action={searchAction}
          buttonLabel={t("searchButton")}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none dark:focus-within:border-emerald-400 dark:focus-within:ring-emerald-900"
          defaultValue={query}
          inputClassName="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder-slate-500"
          placeholder={t("searchPlaceholder")}
        />

        <section className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isInactiveView ? t("inactiveHeading") : t("listHeading")}
            </h2>
            <div className="flex items-center gap-2">
              {!isAdmin && !isInactiveView ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
                  href="/students/new"
                >
                  <PlusCircle aria-hidden="true" size={16} strokeWidth={2.2} />
                  {t("addButton")}
                </Link>
              ) : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {isInactiveView
                  ? `${filteredInactiveStudents.length}/${inactiveStudents.length} ${t("inactiveCountBadge")}`
                  : `${studentPage.students.length}/${studentPage.totalCount} ${t("activeCountBadge")}`}
              </span>
            </div>
          </div>

          {!isInactiveView ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {studentPage.students.length > 0 ? (
                studentPage.students.map((student) => (
                  <ActiveStudentCard
                    activeTargetCount={student.activeTargetCount}
                    canManage={!isAdmin}
                    classSummary={student.classSummary}
                    fullName={student.fullName}
                    id={student.id}
                    key={student.id}
                    latestHafalan={student.latestHafalan}
                    latestMurojaah={student.latestMurojaah}
                    needsReview={student.needsReview}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  {query ? t("emptySearch") : t("emptyNoStudents")}
                </div>
              )}
            </div>
          ) : (
            <InactiveStudentsSection
              emptyMessage={query ? t("emptyInactiveSearch") : t("emptyInactiveStudents")}
              showHeading={false}
              students={filteredInactiveStudents}
            />
          )}

          {!isInactiveView && studentPage.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {hasPreviousPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(studentPage.page - 1)}
                >
                  <ChevronLeft aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {studentPage.page} / {studentPage.totalPages}
              </span>
              {hasNextPage ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  href={buildPageHref(studentPage.page + 1)}
                >
                  <ChevronRight aria-hidden="true" size={16} strokeWidth={2.2} />
                </Link>
              ) : (
                <span className="h-10 w-10" aria-hidden="true" />
              )}
            </div>
          ) : null}
        </section>

      </AppShell>
  );
}
