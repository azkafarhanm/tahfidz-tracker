import { describe, expect, it } from "vitest";
import {
  assignSequentialSummativeSubmissionTimes,
  orderSummativeSubmission,
} from "@/lib/summative-submission";

describe("summative submission order", () => {
  it("preserves input order across score categories", () => {
    const ordered = orderSummativeSubmission([
      { inputOrder: 4, surah: "Al-Ikhlas" },
      { inputOrder: 0, surah: "An-Nas" },
      { inputOrder: 2, surah: "Al-Falaq" },
    ]);

    expect(ordered.map((item) => item.surah)).toEqual([
      "An-Nas",
      "Al-Falaq",
      "Al-Ikhlas",
    ]);
  });

  it("makes the final submitted item the latest timestamp", () => {
    const submittedAt = new Date("2026-07-14T08:00:00.000Z");
    const timestamped = assignSequentialSummativeSubmissionTimes(
      [
        { surah: "Al-Mursalat" },
        { surah: "Al-Insan" },
        { surah: "Al-Qiyamah" },
      ],
      submittedAt,
    );

    expect(timestamped.map((item) => item.submittedAt.getTime())).toEqual([
      submittedAt.getTime(),
      submittedAt.getTime() + 1,
      submittedAt.getTime() + 2,
    ]);
    expect(timestamped.at(-1)?.surah).toBe("Al-Qiyamah");
  });
});
