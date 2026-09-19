import { describe, expect, it } from "vitest";
import {
  assignSequentialSummativeSubmissionTimes,
  orderSummativeSubmission,
} from "@/lib/summative-submission";

describe("summative submission order", () => {
  it("preserves input order across score categories", () => {
    const ordered = orderSummativeSubmission([
      { inputOrder: 4, surahId: "al-ikhlas" },
      { inputOrder: 0, surahId: "an-nas" },
      { inputOrder: 2, surahId: "al-falaq" },
    ]);

    expect(ordered.map((item) => item.surahId)).toEqual([
      "an-nas",
      "al-falaq",
      "al-ikhlas",
    ]);
  });

  it("moves touched scores to the end, newest touch last", () => {
    const ordered = orderSummativeSubmission(
      [
        { inputOrder: 0, surahId: "an-naba" },
        { inputOrder: 1, surahId: "an-naziat" },
        { inputOrder: 2, surahId: "abasa" },
        { inputOrder: 3, surahId: "al-lail" },
      ],
      ["abasa", "an-naba"],
    );

    expect(ordered.map((item) => item.surahId)).toEqual([
      "an-naziat",
      "al-lail",
      "abasa",
      "an-naba",
    ]);
  });

  it("keeps the last surah of the sheet from winning when it was never touched", () => {
    const ordered = orderSummativeSubmission(
      [
        { inputOrder: 0, surahId: "an-naba" },
        { inputOrder: 9, surahId: "al-lail" },
      ],
      ["an-naba"],
    );

    expect(ordered.at(-1)?.surahId).toBe("an-naba");
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
