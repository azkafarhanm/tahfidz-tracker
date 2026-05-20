import { describe, expect, it } from "vitest";
import { parseRecordDateTime } from "./form-helpers";

describe("parseRecordDateTime", () => {
  it("converts device-local date and time to UTC using browser timezone offset", () => {
    const parsed = parseRecordDateTime("2026-05-20", "08:15", "-420");

    expect(parsed?.toISOString()).toBe("2026-05-20T01:15:00.000Z");
  });

  it("rejects rolled-over calendar dates", () => {
    expect(parseRecordDateTime("2026-02-31", "08:15", "-420")).toBeNull();
  });

  it("falls back to a stable UTC interpretation when timezone offset is missing", () => {
    const parsed = parseRecordDateTime("2026-05-20", "08:15");

    expect(parsed?.toISOString()).toBe("2026-05-20T08:15:00.000Z");
  });

  it("ignores malformed timezone offsets instead of partially parsing them", () => {
    const parsed = parseRecordDateTime("2026-05-20", "08:15", "-420junk");

    expect(parsed?.toISOString()).toBe("2026-05-20T08:15:00.000Z");
  });

  it("ignores impossible timezone offsets", () => {
    const parsed = parseRecordDateTime("2026-05-20", "08:15", "900");

    expect(parsed?.toISOString()).toBe("2026-05-20T08:15:00.000Z");
  });
});
