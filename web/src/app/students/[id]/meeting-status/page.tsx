import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck2, ClipboardList, Save } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MeetingAttendanceStatus, ProgramType } from "@/generated/prisma-next/enums";
import FormAlert from "@/components/FormAlert";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { backLink } from "@/lib/colors";
import { getJakartaDayKey } from "@/lib/jakarta-date";
import { parseMeetingDate } from "@/lib/meeting-status";
import { prisma } from "@/lib/prisma";
import { getStudentFormContext } from "@/lib/students";
import { requireSessionScope } from "@/lib/session";
import { upsertMeetingStatus } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; date?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("MeetingStatusForm");
  return { title: `${t("title")} - TahfidzFlow` };
}

export default async function MeetingStatusPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const { teacherId } = await requireSessionScope();
  const [student, t] = await Promise.all([
    getStudentFormContext(id, teacherId),
    getTranslations("MeetingStatusForm"),
  ]);

  if (!student || student.programType !== ProgramType.ACADEMIC) notFound();

  const selectedDate = parseMeetingDate(query?.date ?? "");
  const existing = selectedDate
    ? await prisma.meetingStatus.findUnique({
        where: {
          studentId_programType_date: {
            studentId: student.id,
            programType: ProgramType.ACADEMIC,
            date: selectedDate,
          },
        },
        select: { status: true, note: true },
      })
    : null;

  const detailHref = `/students/${student.id}?programType=${ProgramType.ACADEMIC}`;
  const action = upsertMeetingStatus.bind(null, student.id);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header>
          <WorkflowContextLink className={backLink} href={detailHref}>
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
            {t("backLink")}
          </WorkflowContextLink>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {student.fullName} - {student.classSummary}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white">
              <CalendarCheck2 aria-hidden="true" size={22} strokeWidth={2.3} />
            </span>
          </div>
        </header>

        {query?.error ? <FormAlert message={query.error} /> : null}

        <form action={action} className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <label className="block text-sm font-medium" htmlFor="date">{t("dateLabel")}</label>
            <input
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-emerald-900/30"
              defaultValue={query?.date ?? getJakartaDayKey(new Date())}
              id="date"
              name="date"
              required
              type="date"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("dateHelp")}</p>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium">{t("statusLabel")}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.values(MeetingAttendanceStatus).map((status) => (
                  <label className="cursor-pointer" key={status}>
                    <input className="peer sr-only" defaultChecked={existing?.status === status} name="status" required type="radio" value={status} />
                    <span className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold peer-checked:border-emerald-700 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 dark:border-slate-700 dark:bg-slate-800 dark:peer-checked:border-emerald-500 dark:peer-checked:bg-emerald-950 dark:peer-checked:text-emerald-200">
                      {t(`status${status}`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="text-emerald-800 dark:text-emerald-400" size={18} />
              <label className="font-semibold" htmlFor="note">{t("noteLabel")}</label>
            </div>
            <textarea
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-emerald-900/30"
              id="note"
              name="note"
              defaultValue={existing?.note ?? ""}
              placeholder={t("notePlaceholder")}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("noteOptional")}</p>
          </section>

          <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <WorkflowContextLink className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" href={detailHref}>
              {t("cancel")}
            </WorkflowContextLink>
            <button className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-950" type="submit">
              <Save aria-hidden="true" size={17} />
              {t("save")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
