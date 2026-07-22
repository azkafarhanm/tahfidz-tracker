import { BookOpen, CalendarCheck2, RotateCcw } from "lucide-react";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { badge } from "@/lib/colors";

type MeetingItem = {
  id: string;
  date: string;
  dateKey: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALFA";
  note: string | null;
  activityCountText: string;
  activities: {
    id: string;
    type: "Hafalan" | "Murojaah";
    range: string;
  }[];
};

type Props = {
  studentId: string;
  meetings: MeetingItem[];
  labels: {
    heading: string;
    description: string;
    add: string;
    update: string;
    note: string;
    noActivity: string;
    empty: string;
    hafalan: string;
    murojaah: string;
    statuses: Record<MeetingItem["status"], string>;
  };
};

function statusClass(status: MeetingItem["status"]) {
  if (status === "HADIR") return badge.success;
  if (status === "IZIN") return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200";
  if (status === "SAKIT") return "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
  return "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200";
}

export default function MeetingHistorySection({ studentId, meetings, labels }: Props) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{labels.heading}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.description}</p>
        </div>
        <WorkflowContextLink
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-950"
          href={`/students/${studentId}/meeting-status`}
        >
          <CalendarCheck2 aria-hidden="true" size={15} strokeWidth={2.2} />
          {labels.add}
        </WorkflowContextLink>
      </div>

      <div className="mt-3 space-y-3">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
              data-highlight={meeting.id}
              key={meeting.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{meeting.date}</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(meeting.status)}`}>
                    {labels.statuses[meeting.status]}
                  </span>
                </div>
                <WorkflowContextLink
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-400"
                  href={`/students/${studentId}/meeting-status?date=${meeting.dateKey}`}
                >
                  {labels.update}
                </WorkflowContextLink>
              </div>

              {meeting.note ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{labels.note}:</span>{" "}
                  {meeting.note}
                </p>
              ) : null}

              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {meeting.activities.length > 0 ? (
                  <>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {meeting.activityCountText}
                    </p>
                    {meeting.activities.map((activity) => (
                      <div className="flex items-start gap-2 text-sm" key={`${activity.type}-${activity.id}`}>
                        {activity.type === "Hafalan" ? (
                          <BookOpen aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" size={15} />
                        ) : (
                          <RotateCcw aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-400" size={15} />
                        )}
                        <p>
                          <span className="font-medium">{activity.type === "Hafalan" ? labels.hafalan : labels.murojaah}</span>
                          <span className="text-slate-500 dark:text-slate-400"> - {activity.range}</span>
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{labels.noActivity}</p>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center dark:border-slate-700 dark:bg-slate-900/70">
            <CalendarCheck2 aria-hidden="true" className="mx-auto text-emerald-800 dark:text-emerald-400" size={24} />
            <p className="mt-3 text-sm font-semibold">{labels.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
}
