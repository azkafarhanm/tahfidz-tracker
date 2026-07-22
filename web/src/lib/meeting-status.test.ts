import { describe, expect, it } from "vitest";
import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import {
  buildMeetingTimeline,
  parseMeetingDate,
  summarizeMeetingStatuses,
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

describe("summarizeMeetingStatuses", () => {
  it("uses today's exact date instead of the latest prior status", () => {
    const summary = summarizeMeetingStatuses(
      [
        {
          date: new Date("2026-07-21T00:00:00.000Z"),
          status: MeetingAttendanceStatus.HADIR,
        },
      ],
      "2026-07-22",
    );

    expect(summary.todayStatus).toBeNull();
    expect(summary.counts.HADIR).toBe(1);
  });

  it("counts only the inclusive rolling 30-day window", () => {
    const summary = summarizeMeetingStatuses(
      [
        { date: new Date("2026-07-22T00:00:00.000Z"), status: MeetingAttendanceStatus.SAKIT },
        { date: new Date("2026-06-23T00:00:00.000Z"), status: MeetingAttendanceStatus.IZIN },
        { date: new Date("2026-06-22T00:00:00.000Z"), status: MeetingAttendanceStatus.ALFA },
        { date: new Date("2026-07-23T00:00:00.000Z"), status: MeetingAttendanceStatus.HADIR },
      ],
      "2026-07-22",
    );

    expect(summary.todayStatus).toBe(MeetingAttendanceStatus.SAKIT);
    expect(summary.counts).toEqual({ HADIR: 0, IZIN: 1, SAKIT: 1, ALFA: 0 });
    expect(summary.rollingStartKey).toBe("2026-06-23");
  });
});
