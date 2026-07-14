import { describe, expect, it } from "vitest";
import { getJuz, getSurahNamesForJuz } from "./juz";

describe("getSurahNamesForJuz", () => {
  it("returns canonical Juz 30 Surahs in Quran order without duplicates", () => {
    const names = getSurahNamesForJuz(30);

    expect(names[0]).toBe("An-Naba");
    expect(names.at(-1)).toBe("An-Nas");
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes Surahs in every Juz represented by the existing range map", () => {
    expect(getSurahNamesForJuz(1)).toContain("Al-Baqarah");
    expect(getSurahNamesForJuz(2)).toContain("Al-Baqarah");
    expect(getSurahNamesForJuz(3)).toContain("Al-Baqarah");
  });

  it("includes Surahs at Juz boundaries based on ayah-range overlap", () => {
    expect(getSurahNamesForJuz(26)).toContain("Adz-Dzariyat");
    expect(getSurahNamesForJuz(27)).toContain("Adz-Dzariyat");
    expect(getSurahNamesForJuz(27)).toContain("Al-Hadid");
    expect(getSurahNamesForJuz(28)).not.toContain("Al-Hadid");
  });

  it("returns an empty list for an unknown Juz", () => {
    expect(getSurahNamesForJuz(0)).toEqual([]);
    expect(getSurahNamesForJuz(31)).toEqual([]);
  });
});

describe("getJuz", () => {
  it("continues to resolve Juz from Surah and ayah", () => {
    expect(getJuz("Al-Baqarah", 141)).toBe(1);
    expect(getJuz("Al-Baqarah", 142)).toBe(2);
    expect(getJuz("Adz-Dzariyat", 30)).toBe(26);
    expect(getJuz("Adz-Dzariyat", 31)).toBe(27);
  });
});
