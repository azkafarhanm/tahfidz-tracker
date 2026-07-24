import { describe, expect, it } from "vitest";

import {
  getCenteredSurahScrollTop,
  getSelectedSurahIndex,
  getVisibleSurahOptions,
  shouldOpenSurahPickerUpward,
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

describe("shouldOpenSurahPickerUpward", () => {
  it("keeps the list below the input when there is enough space", () => {
    expect(shouldOpenSurahPickerUpward(100, 148, 600, 208)).toBe(false);
  });

  it("moves the list above the input when the keyboard leaves more space there", () => {
    expect(shouldOpenSurahPickerUpward(250, 298, 400, 208)).toBe(true);
  });

  it("keeps the default direction when neither side has more space", () => {
    expect(shouldOpenSurahPickerUpward(120, 160, 280, 208)).toBe(false);
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
