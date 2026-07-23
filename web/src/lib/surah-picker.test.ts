import { describe, expect, it } from "vitest";

import {
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

describe("getSelectedSurahIndex", () => {
  it("positions the active option at the selected Surah", () => {
    expect(getSelectedSurahIndex(options, "Al-Muzzammil")).toBe(1);
  });

  it("falls back safely when no Surah is selected", () => {
    expect(getSelectedSurahIndex(options, "")).toBe(0);
  });
});
