import { describe, expect, it } from "vitest";
import { matchesSurahSearch, surahList } from "./surahs";

function findSurah(name: string) {
  const surah = surahList.find((item) => item.name === name);
  if (!surah) throw new Error(`Missing test Surah: ${name}`);
  return surah;
}

describe("matchesSurahSearch", () => {
  it.each([
    ["An-Naba", "annaba"],
    ["An-Naba", "an naba"],
    ["An-Naba", "naba"],
    ["Ali Imran", "aliimran"],
    ["Al-Kahf", "alkahfi"],
  ])("matches %s using the common query %s", (surahName, query) => {
    expect(matchesSurahSearch(findSurah(surahName), query)).toBe(true);
  });

  it("continues to match Surah numbers", () => {
    expect(matchesSurahSearch(findSurah("An-Naba"), "78")).toBe(true);
  });

  it("does not match an unrelated normalized name", () => {
    expect(matchesSurahSearch(findSurah("An-Naba"), "alkahfi")).toBe(false);
  });
});
