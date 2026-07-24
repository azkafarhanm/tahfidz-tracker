import { describe, expect, it } from "vitest";

import {
  getCenteredSurahScrollTop,
  getSurahPickerListMaxHeight,
  getSelectedSurahIndex,
  getVisibleSurahOptions,
} from "@/lib/surah-picker";
import type { SurahInfo } from "@/lib/surahs";

const options = [
  { number: 72, name: "Al-Jinn", ayahs: 28 },
  { number: 73, name: "Al-Muzzammil", ayahs: 20 },
  { number: 74, name: "Al-Muddatstsir", ayahs: 56 },
  { number: 75, name: "Al-Qiyamah", ayahs: 40 },
] satisfies SurahInfo[];

describe("getVisibleSurahOptions", () => {
  it("shows the entire Juz list when the dropdown opens", () => {
    expect(
      getVisibleSurahOptions(options, "Al-Muzzammil", false),
    ).toEqual(options);
  });

  it("filters only after the teacher starts searching", () => {
    expect(
      getVisibleSurahOptions(options, "muddat", true),
    ).toEqual([{ number: 74, name: "Al-Muddatstsir", ayahs: 56 }]);
  });

  it("shows all options for an empty explicit query", () => {
    expect(getVisibleSurahOptions(options, "", true)).toEqual(options);
  });
});

describe("getCenteredSurahScrollTop", () => {
  it("centers the selected item for the initial dropdown position", () => {
    expect(getCenteredSurahScrollTop(320, 32, 208)).toBe(232);
  });

  it("does not produce a negative position near the start of the list", () => {
    expect(getCenteredSurahScrollTop(16, 32, 208)).toBe(0);
  });
});

describe("getSurahPickerListMaxHeight", () => {
  it("keeps the normal list height when it fits in the visual viewport", () => {
    expect(getSurahPickerListMaxHeight(180, 720, 208)).toBe(208);
  });

  it("shrinks the list to stay above the virtual keyboard", () => {
    expect(getSurahPickerListMaxHeight(380, 500, 208)).toBe(116);
  });

  it("does not produce a negative height when no visible space remains", () => {
    expect(getSurahPickerListMaxHeight(520, 500, 208)).toBe(0);
  });
});

describe("getSelectedSurahIndex", () => {
  it("positions the active option at the selected Surah", () => {
    expect(getSelectedSurahIndex(options, "Al-Muzzammil")).toBe(1);
  });

  it("falls back safely when no Surah is selected", () => {
    expect(getSelectedSurahIndex(options, "")).toBe(0);
  });
});
