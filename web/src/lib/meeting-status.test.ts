import { describe, expect, it } from "vitest";
import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import {
  buildMeetingTimeline,
  buildMeetingStatusCounts,
  buildSemesterMeetingStatistics,
  buildStudentMeetingStatistics,
  getTodayMeetingStatus,
  groupMeetingTimelineByMonth,
  parseMeetingDate,
} from "@/lib/meeting-status";

describe("parseMeetingDate", () => {
  it("accepts a real date-only value", () => {
    expect(parseMeetingDate("2026-07-21")?.toISOString()).toBe(
      "2026-07-21T00:00:00.000Z",
    );
  });

  it("rejects malformed and impossible dates", () => {
    expect(parseMeetingDate("21-07-2026")).toBeNull();
    expect(parseMeetingDate("2026-02-30")).toBeNull();
  });
});

describe("buildMeetingTimeline", () => {
  it("keeps a status without activity and groups Jakarta-day activities", () => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
    const result = buildMeetingTimeline(
      [
        {
          id: "meeting-21",
          date: new Date("2026-07-21T00:00:00.000Z"),
          status: MeetingAttendanceStatus.HADIR,
          note: null,
        },
        {
          id: "meeting-20",
          date: new Date("2026-07-20T00:00:00.000Z"),
          status: MeetingAttendanceStatus.IZIN,
          note: "Acara keluarga",
        },
      ],
      [
        {
          id: "hafalan-1",
          type: "Hafalan",
          range: "Al-Mulk 1-10",
          date: new Date("2026-07-20T10:00:00.000Z"),
        },
      ],
      formatter,
    );

    expect(result[0].activities).toEqual([]);
    expect(result[1].activities).toEqual([
      { id: "hafalan-1", type: "Hafalan", range: "Al-Mulk 1-10" },
    ]);
    expect(result[1].note).toBe("Acara keluarga");
  });
});

describe("getTodayMeetingStatus", () => {
  it("uses today's exact date instead of the latest prior status", () => {
    const todayStatus = getTodayMeetingStatus(
      [
        {
          date: new Date("2026-07-21T00:00:00.000Z"),
          status: MeetingAttendanceStatus.HADIR,
        },
      ],
      "2026-07-22",
    );

    expect(todayStatus).toBeNull();
  });
});

describe("buildMeetingStatusCounts", () => {
  it("maps grouped semester totals and fills absent statuses with zero", () => {
    const counts = buildMeetingStatusCounts(
      [
        { status: MeetingAttendanceStatus.HADIR, _count: { _all: 22 } },
        { status: MeetingAttendanceStatus.IZIN, _count: { _all: 2 } },
        { status: MeetingAttendanceStatus.ALFA, _count: { _all: 3 } },
      ],
    );

    expect(counts).toEqual({ HADIR: 22, IZIN: 2, SAKIT: 0, ALFA: 3 });
  });
});

describe("buildSemesterMeetingStatistics", () => {
  it("calculates the halaqah-wide total and a rounded attendance rate", () => {
    expect(
      buildSemesterMeetingStatistics([
        { status: MeetingAttendanceStatus.HADIR, _count: { _all: 22 } },
        { status: MeetingAttendanceStatus.IZIN, _count: { _all: 2 } },
        { status: MeetingAttendanceStatus.SAKIT, _count: { _all: 1 } },
        { status: MeetingAttendanceStatus.ALFA, _count: { _all: 2 } },
      ]),
    ).toEqual({
      totalMeetings: 27,
      hadir: 22,
      izin: 2,
      sakit: 1,
      alfa: 2,
      attendanceRate: 81,
    });
  });

  it("returns zero percent when the active semester has no meetings", () => {
    expect(buildSemesterMeetingStatistics([])).toEqual({
      totalMeetings: 0,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      attendanceRate: 0,
    });
  });
});

describe("buildStudentMeetingStatistics", () => {
  it("keeps each student's grouped attendance independent", () => {
    const statistics = buildStudentMeetingStatistics([
      {
        studentId: "student-a",
        status: MeetingAttendanceStatus.HADIR,
        _count: { _all: 3 },
      },
      {
        studentId: "student-a",
        status: MeetingAttendanceStatus.IZIN,
        _count: { _all: 1 },
      },
      {
        studentId: "student-b",
        status: MeetingAttendanceStatus.ALFA,
        _count: { _all: 2 },
      },
    ]);

    expect(statistics.get("student-a")).toEqual({
      totalMeetings: 4,
      hadir: 3,
      izin: 1,
      sakit: 0,
      alfa: 0,
      attendanceRate: 75,
    });
    expect(statistics.get("student-b")).toEqual({
      totalMeetings: 2,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 2,
      attendanceRate: 0,
    });
  });
});

describe("groupMeetingTimelineByMonth", () => {
  it("preserves newest-first month and meeting order", () => {
    const groups = groupMeetingTimelineByMonth(
      [
        { id: "jul-22", dateKey: "2026-07-22" },
        { id: "jul-20", dateKey: "2026-07-20" },
        { id: "jun-30", dateKey: "2026-06-30" },
      ],
      "id-ID",
    );

    expect(groups.map(({ monthKey, meetings }) => ({
      monthKey,
      ids: meetings.map((meeting) => meeting.id),
    }))).toEqual([
      { monthKey: "2026-07", ids: ["jul-22", "jul-20"] },
      { monthKey: "2026-06", ids: ["jun-30"] },
    ]);
    expect(groups[0].label).toContain("2026");
  });
});
