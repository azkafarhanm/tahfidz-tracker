import { describe, expect, it } from "vitest";
import { formatTahsinMeetingDate } from "./tahsin-date-format";

describe("Tahsin meeting date formatting", () => {
  const meetingDate = new Date("2026-08-16T00:00:00.000Z");

  it("uses the application locale while preserving the UTC meeting date", () => {
    expect(formatTahsinMeetingDate(meetingDate, "id")).toBe("16 Agustus 2026");
    expect(formatTahsinMeetingDate(meetingDate, "en")).toBe("August 16, 2026");
    expect(formatTahsinMeetingDate(meetingDate, "ar")).not.toContain("August");
  });
});
