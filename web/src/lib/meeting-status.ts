import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import { getJakartaDayKey } from "@/lib/jakarta-date";

export function parseMeetingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

type TimelineActivity = {
  id: string;
  type: "Hafalan" | "Murojaah";
  range: string;
  date: Date;
};

type TimelineStatus = {
  id: string;
  date: Date;
  status: MeetingAttendanceStatus;
  note: string | null;
};

export function buildMeetingTimeline(
  statuses: TimelineStatus[],
  activities: TimelineActivity[],
  dateFormatter: Intl.DateTimeFormat,
) {
  const activitiesByDay = new Map<string, TimelineActivity[]>();
  for (const activity of activities) {
    const day = getJakartaDayKey(activity.date);
    activitiesByDay.set(day, [...(activitiesByDay.get(day) ?? []), activity]);
  }

  return statuses.map((meeting) => {
    const day = meeting.date.toISOString().slice(0, 10);
    return {
      id: meeting.id,
      date: dateFormatter.format(meeting.date),
      dateKey: day,
      status: meeting.status,
      note: meeting.note,
      activities: (activitiesByDay.get(day) ?? []).map(({ id, type, range }) => ({
        id,
        type,
        range,
      })),
    };
  });
}
