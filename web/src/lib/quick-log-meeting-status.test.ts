import { describe, expect, it } from "vitest";

import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";
import { shouldAllowQuickLogRecordEntry } from "@/lib/quick-log-meeting-status";

describe("shouldAllowQuickLogRecordEntry", () => {
  it("keeps Boarding Quick Log unchanged", () => {
    expect(shouldAllowQuickLogRecordEntry(false, null)).toBe(true);
  });

  it("waits for an Academic meeting status when today is not recorded", () => {
    expect(shouldAllowQuickLogRecordEntry(true, null)).toBe(false);
  });

  it.each([
    MeetingAttendanceStatus.HADIR,
    MeetingAttendanceStatus.IZIN,
    MeetingAttendanceStatus.SAKIT,
    MeetingAttendanceStatus.ALFA,
  ])("allows normal Quick Log for an existing %s status", (status) => {
    expect(shouldAllowQuickLogRecordEntry(true, status)).toBe(true);
  });

  it("allows records after Quick Log creates HADIR", () => {
    expect(
      shouldAllowQuickLogRecordEntry(true, MeetingAttendanceStatus.HADIR, true),
    ).toBe(true);
  });

  it.each([
    MeetingAttendanceStatus.IZIN,
    MeetingAttendanceStatus.SAKIT,
    MeetingAttendanceStatus.ALFA,
  ])("blocks records after Quick Log creates %s", (status) => {
    expect(shouldAllowQuickLogRecordEntry(true, status, true)).toBe(false);
  });
});
