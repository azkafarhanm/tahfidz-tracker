import { describe, expect, it } from "vitest";

import {
  getQuickLogSessionPreferenceKey,
  getQuickLogSmartDefault,
} from "@/lib/quick-log-smart-default";

const student = {
  latestHafalanMaterial: { surah: "Al-Muzzammil", fromAyah: 1, toAyah: 20 },
  latestMurojaahMaterial: { surah: "Al-Mulk", fromAyah: 1, toAyah: 30 },
};

describe("getQuickLogSmartDefault", () => {
  it("uses only the student's latest Hafalan material for Hafalan", () => {
    expect(getQuickLogSmartDefault(student, "HAFALAN")).toEqual(
      student.latestHafalanMaterial,
    );
  });

  it("uses only the student's latest Murojaah material for Murojaah", () => {
    expect(getQuickLogSmartDefault(student, "MUROJAAH")).toEqual(
      student.latestMurojaahMaterial,
    );
  });

  it("does not fall back from Hafalan to Murojaah", () => {
    expect(
      getQuickLogSmartDefault(
        { ...student, latestHafalanMaterial: null },
        "HAFALAN",
      ),
    ).toBeNull();
  });

  it("does not fall back from Murojaah to Hafalan", () => {
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
