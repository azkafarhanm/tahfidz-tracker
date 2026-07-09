import { describe, expect, it } from "vitest";
import { RecordStatus } from "@/generated/prisma-next/enums";
import {
  deriveRecordStatusFromScore,
  recordStatusDisplay,
} from "./record-status";

describe("deriveRecordStatusFromScore", () => {
  it("maps 88-95 to lancar", () => {
    expect(deriveRecordStatusFromScore(88)).toBe(RecordStatus.LANCAR);
    expect(deriveRecordStatusFromScore(95)).toBe(RecordStatus.LANCAR);
  });

  it("maps 81-87 to cukup", () => {
    expect(deriveRecordStatusFromScore(81)).toBe(RecordStatus.CUKUP);
    expect(deriveRecordStatusFromScore(87)).toBe(RecordStatus.CUKUP);
  });

  it("maps 75-80 to perlu murajah", () => {
    expect(deriveRecordStatusFromScore(75)).toBe(RecordStatus.PERLU_MUROJAAH);
    expect(deriveRecordStatusFromScore(80)).toBe(RecordStatus.PERLU_MUROJAAH);
  });

  it("leaves status empty without a score or matching score band", () => {
    expect(deriveRecordStatusFromScore(null)).toBe("");
    expect(deriveRecordStatusFromScore(74)).toBe("");
    expect(deriveRecordStatusFromScore(96)).toBe("");
  });
});

describe("recordStatusDisplay", () => {
  it("shows the read-only labels expected by the input workflow", () => {
    expect(recordStatusDisplay(RecordStatus.LANCAR)).toBe("LANCAR");
    expect(recordStatusDisplay(RecordStatus.CUKUP)).toBe("CUKUP");
    expect(recordStatusDisplay(RecordStatus.PERLU_MUROJAAH)).toBe("PERLU MURAJA'AH");
    expect(recordStatusDisplay("")).toBe("");
  });
});
