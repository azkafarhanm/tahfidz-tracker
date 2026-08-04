import { describe, expect, it } from "vitest";
import { formatRecordMaterial } from "@/lib/record-material-format";

describe("formatRecordMaterial", () => {
  it("formats the surah and complete ayah range consistently", () => {
    expect(
      formatRecordMaterial({
        surah: "Al-Mujadilah",
        fromAyah: 12,
        toAyah: 18,
      }),
    ).toBe("Al-Mujadilah 12\u201318");
  });

  it("keeps both boundaries visible for a single ayah", () => {
    expect(
      formatRecordMaterial({ surah: "Al-Fatihah", fromAyah: 7, toAyah: 7 }),
    ).toBe("Al-Fatihah 7\u20137");
  });
});
