import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import { getJakartaDayKey } from "@/lib/jakarta-date";

export function parseMeetingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

type MeetingStatusSummaryInput = {
  date: Date;
  status: MeetingAttendanceStatus;
};

export function summarizeMeetingStatuses(
  statuses: MeetingStatusSummaryInput[],
  todayKey = getJakartaDayKey(new Date()),
) {
  const today = parseMeetingDate(todayKey);
  if (!today) throw new Error("Invalid Jakarta day key");

  const rollingStart = new Date(today);
  rollingStart.setUTCDate(rollingStart.getUTCDate() - 29);
  const rollingStartKey = rollingStart.toISOString().slice(0, 10);
  const counts: Record<MeetingAttendanceStatus, number> = {
    [MeetingAttendanceStatus.HADIR]: 0,
    [MeetingAttendanceStatus.IZIN]: 0,
    [MeetingAttendanceStatus.SAKIT]: 0,
    [MeetingAttendanceStatus.ALFA]: 0,
  };
  let todayStatus: MeetingAttendanceStatus | null = null;

  for (const meeting of statuses) {
    const day = meeting.date.toISOString().slice(0, 10);
    if (day === todayKey) todayStatus = meeting.status;
    if (day >= rollingStartKey && day <= todayKey) counts[meeting.status] += 1;
  }

  return { todayStatus, counts, rollingStartKey, todayKey };
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
