import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import { getJakartaDayKey } from "@/lib/jakarta-date";

export function parseMeetingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

type MeetingStatusTodayInput = {
  date: Date;
  status: MeetingAttendanceStatus;
};

export function getTodayMeetingStatus(
  statuses: MeetingStatusTodayInput[],
  todayKey = getJakartaDayKey(new Date()),
) {
  return statuses.find(
    (meeting) => meeting.date.toISOString().slice(0, 10) === todayKey,
  )?.status ?? null;
}

export function buildMeetingStatusCounts(
  groups: { status: MeetingAttendanceStatus; _count: { _all: number } }[],
) {
  const counts: Record<MeetingAttendanceStatus, number> = {
    [MeetingAttendanceStatus.HADIR]: 0,
    [MeetingAttendanceStatus.IZIN]: 0,
    [MeetingAttendanceStatus.SAKIT]: 0,
    [MeetingAttendanceStatus.ALFA]: 0,
  };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export function groupMeetingTimelineByMonth<T extends { dateKey: string }>(
  meetings: T[],
  locale: string,
) {
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
  const groups = new Map<string, { monthKey: string; label: string; meetings: T[] }>();

  for (const meeting of meetings) {
    const monthKey = meeting.dateKey.slice(0, 7);
    const existing = groups.get(monthKey);
    if (existing) {
      existing.meetings.push(meeting);
      continue;
    }
    groups.set(monthKey, {
      monthKey,
      label: monthFormatter.format(new Date(`${monthKey}-01T00:00:00.000Z`)),
      meetings: [meeting],
    });
  }

  return [...groups.values()];
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
