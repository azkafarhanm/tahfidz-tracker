import { describe, expect, it } from "vitest";

import {
  getQuickLogSessionPreferenceKey,
  getQuickLogSmartDefault,
} from "@/lib/quick-log-smart-default";

const student = {
  latestHafalanMaterial: { surah: "Al-Muzzammil", fromAyah: 1 },
  latestMurojaahMaterial: { surah: "Al-Mulk", fromAyah: 1 },
};

describe("getQuickLogSmartDefault", () => {
  it("uses the latest Hafalan material for Hafalan", () => {
    expect(getQuickLogSmartDefault(student, "HAFALAN")).toEqual(
      student.latestHafalanMaterial,
    );
  });

  it("switches to the independent Murojaah material", () => {
    expect(getQuickLogSmartDefault(student, "MUROJAAH")).toEqual(
      student.latestMurojaahMaterial,
    );
  });

  it("returns no database default when that record type has no history", () => {
    expect(
      getQuickLogSmartDefault(
        { ...student, latestMurojaahMaterial: null },
        "MUROJAAH",
      ),
    ).toBeNull();
  });
});

describe("getQuickLogSessionPreferenceKey", () => {
  it("keeps Hafalan and Murojaah session fallbacks isolated", () => {
    expect(getQuickLogSessionPreferenceKey("HAFALAN")).toBe("hafalan");
    expect(getQuickLogSessionPreferenceKey("MUROJAAH")).toBe("murojaah");
  });
});
