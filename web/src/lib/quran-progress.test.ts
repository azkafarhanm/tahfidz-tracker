import { describe, expect, it } from "vitest";
import { getJuz } from "./juz";
import { addRecitation, ayahKey, buildAyahCounts, formatHafalanSummary, formatMurojaahSummary } from "./quran-progress";
import { surahList } from "./surahs";

function juzAyat(...juzNumbers: number[]) {
  const keys = new Set<string>();
  for (const surah of surahList) {
    for (let ayah = 1; ayah <= surah.ayahs; ayah += 1) {
      if (juzNumbers.includes(getJuz(surah.name, ayah) ?? 0)) keys.add(ayahKey(surah.name, ayah));
    }
  }
  return keys;
}

function withRows(keys: Set<string>, rows: Array<[string, number, number]>) {
  const counts = new Map([...keys].map((key) => [key, 1]));
  for (const [surah, fromAyah, toAyah] of rows) addRecitation(counts, { surah, fromAyah, toAyah }, { deduplicate: true });
  return counts;
}

describe("hafalan summary", () => {
  it("counts a finished surah that spans a juz boundary as one surah (Nasuha)", () => {
    // Juz 30–27 complete, then juz 26: Al-Ahqaf, Muhammad, Al-Fath 1–28, and
    // Adz-Dzariyat 1–30 — whose other half, 31–60, already sits in juz 27.
    const ayat = withRows(juzAyat(30, 29, 28, 27), [
      ["Al-Ahqaf", 1, 35],
      ["Muhammad", 1, 38],
      ["Al-Fath", 1, 28],
      ["Adz-Dzariyat", 1, 30],
    ]);
    expect(formatHafalanSummary(ayat)).toBe("4 Juz + 3 Surah + 28 Ayat");
  });

  it("does not count a juz again when a finished surah already contains it", () => {
    // Juz 2 lies wholly inside Al-Baqarah.
    const ayat = withRows(new Set(), [["Al-Baqarah", 1, 286], ["Ali Imran", 1, 15]]);
    expect(formatHafalanSummary(ayat)).toBe("1 Surah + 15 Ayat");
  });

  it("still counts that juz when the surah around it is unfinished", () => {
    const ayat = withRows(new Set(), [["Al-Baqarah", 142, 252]]);
    expect(formatHafalanSummary(ayat)).toBe("1 Juz");
  });

  it("reads zero as 0 Ayat", () => {
    expect(formatHafalanSummary(new Set())).toBe("0 Ayat");
  });
});

describe("murojaah summary", () => {
  it("adds up full passes per surah and leftover recitations, without juz", () => {
    const counts = buildAyahCounts([
      { surah: "Al-Qamar", fromAyah: 1, toAyah: 55 },
      { surah: "Al-Qamar", fromAyah: 1, toAyah: 55 },
      { surah: "Al-Qamar", fromAyah: 1, toAyah: 55 },
      { surah: "Al-Hashr", fromAyah: 4, toAyah: 12 },
      { surah: "Al-Hashr", fromAyah: 4, toAyah: 9 },
    ], { deduplicate: false });
    expect(formatMurojaahSummary(counts)).toBe("3 Surah + 15 Ayat");
  });

  it("never folds a reviewed juz into a juz count", () => {
    const counts = buildAyahCounts(
      surahList.filter((surah) => surah.number >= 78).map((surah) => ({ surah: surah.name, fromAyah: 1, toAyah: surah.ayahs })),
      { deduplicate: false },
    );
    expect(formatMurojaahSummary(counts)).toBe("37 Surah");
  });

  it("reads zero as 0 Ayat", () => {
    expect(formatMurojaahSummary(new Map())).toBe("0 Ayat");
  });
});
