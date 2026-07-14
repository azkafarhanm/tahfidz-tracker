type JuzRange = {
  juz: number;
  surah: string;
  fromAyah: number;
  toAyah: number;
};

const juzRanges: JuzRange[] = [
  { juz: 1, surah: "Al-Fatihah", fromAyah: 1, toAyah: 7 },
  { juz: 1, surah: "Al-Baqarah", fromAyah: 1, toAyah: 141 },
  { juz: 2, surah: "Al-Baqarah", fromAyah: 142, toAyah: 252 },
  { juz: 3, surah: "Al-Baqarah", fromAyah: 253, toAyah: 286 },
  { juz: 3, surah: "Ali Imran", fromAyah: 1, toAyah: 92 },
  { juz: 4, surah: "Ali Imran", fromAyah: 93, toAyah: 200 },
  { juz: 4, surah: "An-Nisa", fromAyah: 1, toAyah: 23 },
  { juz: 5, surah: "An-Nisa", fromAyah: 24, toAyah: 147 },
  { juz: 6, surah: "An-Nisa", fromAyah: 148, toAyah: 176 },
  { juz: 6, surah: "Al-Maidah", fromAyah: 1, toAyah: 81 },
  { juz: 7, surah: "Al-Maidah", fromAyah: 82, toAyah: 120 },
  { juz: 7, surah: "Al-An'am", fromAyah: 1, toAyah: 110 },
  { juz: 8, surah: "Al-An'am", fromAyah: 111, toAyah: 165 },
  { juz: 8, surah: "Al-A'raf", fromAyah: 1, toAyah: 87 },
  { juz: 9, surah: "Al-A'raf", fromAyah: 88, toAyah: 206 },
  { juz: 9, surah: "Al-Anfal", fromAyah: 1, toAyah: 40 },
  { juz: 10, surah: "Al-Anfal", fromAyah: 41, toAyah: 75 },
  { juz: 10, surah: "At-Tawbah", fromAyah: 1, toAyah: 92 },
  { juz: 11, surah: "At-Tawbah", fromAyah: 93, toAyah: 129 },
  { juz: 11, surah: "Yunus", fromAyah: 1, toAyah: 109 },
  { juz: 11, surah: "Hud", fromAyah: 1, toAyah: 5 },
  { juz: 12, surah: "Hud", fromAyah: 6, toAyah: 123 },
  { juz: 12, surah: "Yusuf", fromAyah: 1, toAyah: 52 },
  { juz: 13, surah: "Yusuf", fromAyah: 53, toAyah: 111 },
  { juz: 13, surah: "Ar-Ra'd", fromAyah: 1, toAyah: 43 },
  { juz: 13, surah: "Ibrahim", fromAyah: 1, toAyah: 52 },
  { juz: 14, surah: "Al-Hijr", fromAyah: 1, toAyah: 99 },
  { juz: 14, surah: "An-Nahl", fromAyah: 1, toAyah: 128 },
  { juz: 15, surah: "Al-Isra", fromAyah: 1, toAyah: 111 },
  { juz: 15, surah: "Al-Kahf", fromAyah: 1, toAyah: 74 },
  { juz: 16, surah: "Al-Kahf", fromAyah: 75, toAyah: 110 },
  { juz: 16, surah: "Maryam", fromAyah: 1, toAyah: 98 },
  { juz: 16, surah: "Taha", fromAyah: 1, toAyah: 135 },
  { juz: 17, surah: "Al-Anbiya", fromAyah: 1, toAyah: 112 },
  { juz: 17, surah: "Al-Hajj", fromAyah: 1, toAyah: 78 },
  { juz: 18, surah: "Al-Mu'minun", fromAyah: 1, toAyah: 118 },
  { juz: 18, surah: "An-Nur", fromAyah: 1, toAyah: 64 },
  { juz: 18, surah: "Al-Furqan", fromAyah: 1, toAyah: 20 },
  { juz: 19, surah: "Al-Furqan", fromAyah: 21, toAyah: 77 },
  { juz: 19, surah: "Asy-Syu'ara", fromAyah: 1, toAyah: 227 },
  { juz: 19, surah: "An-Naml", fromAyah: 1, toAyah: 55 },
  { juz: 20, surah: "An-Naml", fromAyah: 56, toAyah: 93 },
  { juz: 20, surah: "Al-Qasas", fromAyah: 1, toAyah: 88 },
  { juz: 21, surah: "Al-Ankabut", fromAyah: 1, toAyah: 69 },
  { juz: 21, surah: "Ar-Rum", fromAyah: 1, toAyah: 60 },
  { juz: 21, surah: "Luqman", fromAyah: 1, toAyah: 34 },
  { juz: 21, surah: "As-Sajdah", fromAyah: 1, toAyah: 30 },
  { juz: 22, surah: "Al-Ahzab", fromAyah: 1, toAyah: 73 },
  { juz: 22, surah: "Saba", fromAyah: 1, toAyah: 54 },
  { juz: 22, surah: "Fatir", fromAyah: 1, toAyah: 45 },
  { juz: 23, surah: "Ya-Sin", fromAyah: 1, toAyah: 83 },
  { juz: 23, surah: "As-Saffat", fromAyah: 1, toAyah: 182 },
  { juz: 23, surah: "Sad", fromAyah: 1, toAyah: 88 },
  { juz: 24, surah: "Az-Zumar", fromAyah: 1, toAyah: 75 },
  { juz: 24, surah: "Ghafir", fromAyah: 1, toAyah: 85 },
  { juz: 25, surah: "Fussilat", fromAyah: 1, toAyah: 54 },
  { juz: 25, surah: "Asy-Syura", fromAyah: 1, toAyah: 53 },
  { juz: 25, surah: "Az-Zukhruf", fromAyah: 1, toAyah: 89 },
  { juz: 25, surah: "Ad-Dukhan", fromAyah: 1, toAyah: 59 },
  { juz: 25, surah: "Al-Jasiyah", fromAyah: 1, toAyah: 37 },
  { juz: 26, surah: "Al-Ahqaf", fromAyah: 1, toAyah: 35 },
  { juz: 26, surah: "Muhammad", fromAyah: 1, toAyah: 38 },
  { juz: 26, surah: "Al-Fath", fromAyah: 1, toAyah: 29 },
  { juz: 26, surah: "Al-Hujurat", fromAyah: 1, toAyah: 18 },
  { juz: 26, surah: "Qaf", fromAyah: 1, toAyah: 45 },
  { juz: 27, surah: "Adz-Dzariyat", fromAyah: 1, toAyah: 60 },
  { juz: 27, surah: "At-Tur", fromAyah: 1, toAyah: 49 },
  { juz: 27, surah: "An-Najm", fromAyah: 1, toAyah: 62 },
  { juz: 27, surah: "Al-Qamar", fromAyah: 1, toAyah: 55 },
  { juz: 27, surah: "Ar-Rahman", fromAyah: 1, toAyah: 78 },
  { juz: 27, surah: "Al-Waqi'ah", fromAyah: 1, toAyah: 96 },
  { juz: 28, surah: "Al-Hadid", fromAyah: 1, toAyah: 29 },
  { juz: 28, surah: "Al-Mujadilah", fromAyah: 1, toAyah: 22 },
  { juz: 28, surah: "Al-Hashr", fromAyah: 1, toAyah: 24 },
  { juz: 28, surah: "Al-Mumtahanah", fromAyah: 1, toAyah: 13 },
  { juz: 28, surah: "As-Saff", fromAyah: 1, toAyah: 14 },
  { juz: 28, surah: "Al-Jumu'ah", fromAyah: 1, toAyah: 11 },
  { juz: 28, surah: "Al-Munafiqun", fromAyah: 1, toAyah: 11 },
  { juz: 28, surah: "At-Taghabun", fromAyah: 1, toAyah: 18 },
  { juz: 28, surah: "At-Talaq", fromAyah: 1, toAyah: 12 },
  { juz: 28, surah: "At-Tahrim", fromAyah: 1, toAyah: 12 },
  { juz: 29, surah: "Al-Mulk", fromAyah: 1, toAyah: 30 },
  { juz: 29, surah: "Al-Qalam", fromAyah: 1, toAyah: 52 },
  { juz: 29, surah: "Al-Haqqah", fromAyah: 1, toAyah: 52 },
  { juz: 29, surah: "Al-Ma'arij", fromAyah: 1, toAyah: 44 },
  { juz: 29, surah: "Nuh", fromAyah: 1, toAyah: 28 },
  { juz: 29, surah: "Al-Jinn", fromAyah: 1, toAyah: 28 },
  { juz: 29, surah: "Al-Muzzammil", fromAyah: 1, toAyah: 20 },
  { juz: 29, surah: "Al-Muddathir", fromAyah: 1, toAyah: 56 },
  { juz: 29, surah: "Al-Qiyamah", fromAyah: 1, toAyah: 40 },
  { juz: 29, surah: "Al-Insan", fromAyah: 1, toAyah: 31 },
  { juz: 29, surah: "Al-Mursalat", fromAyah: 1, toAyah: 50 },
  { juz: 30, surah: "An-Naba", fromAyah: 1, toAyah: 40 },
  { juz: 30, surah: "An-Nazi'at", fromAyah: 1, toAyah: 46 },
  { juz: 30, surah: "Abasa", fromAyah: 1, toAyah: 42 },
  { juz: 30, surah: "At-Takwir", fromAyah: 1, toAyah: 29 },
  { juz: 30, surah: "Al-Infitar", fromAyah: 1, toAyah: 19 },
  { juz: 30, surah: "Al-Mutaffifin", fromAyah: 1, toAyah: 36 },
  { juz: 30, surah: "Al-Insyiqaq", fromAyah: 1, toAyah: 25 },
  { juz: 30, surah: "Al-Buruj", fromAyah: 1, toAyah: 22 },
  { juz: 30, surah: "At-Tariq", fromAyah: 1, toAyah: 17 },
  { juz: 30, surah: "Al-A'la", fromAyah: 1, toAyah: 19 },
  { juz: 30, surah: "Al-Ghasyiyah", fromAyah: 1, toAyah: 26 },
  { juz: 30, surah: "Al-Fajr", fromAyah: 1, toAyah: 30 },
  { juz: 30, surah: "Al-Balad", fromAyah: 1, toAyah: 20 },
  { juz: 30, surah: "Asy-Syams", fromAyah: 1, toAyah: 15 },
  { juz: 30, surah: "Al-Lail", fromAyah: 1, toAyah: 21 },
  { juz: 30, surah: "Ad-Duha", fromAyah: 1, toAyah: 11 },
  { juz: 30, surah: "Asy-Syarh", fromAyah: 1, toAyah: 8 },
  { juz: 30, surah: "At-Tin", fromAyah: 1, toAyah: 8 },
  { juz: 30, surah: "Al-Alaq", fromAyah: 1, toAyah: 19 },
  { juz: 30, surah: "Al-Qadr", fromAyah: 1, toAyah: 5 },
  { juz: 30, surah: "Al-Bayyinah", fromAyah: 1, toAyah: 8 },
  { juz: 30, surah: "Az-Zalzalah", fromAyah: 1, toAyah: 8 },
  { juz: 30, surah: "Al-Adiyat", fromAyah: 1, toAyah: 11 },
  { juz: 30, surah: "Al-Qari'ah", fromAyah: 1, toAyah: 11 },
  { juz: 30, surah: "At-Takatsur", fromAyah: 1, toAyah: 8 },
  { juz: 30, surah: "Al-Asr", fromAyah: 1, toAyah: 3 },
  { juz: 30, surah: "Al-Humazah", fromAyah: 1, toAyah: 9 },
  { juz: 30, surah: "Al-Fil", fromAyah: 1, toAyah: 5 },
  { juz: 30, surah: "Quraisy", fromAyah: 1, toAyah: 4 },
  { juz: 30, surah: "Al-Ma'un", fromAyah: 1, toAyah: 7 },
  { juz: 30, surah: "Al-Kautsar", fromAyah: 1, toAyah: 3 },
  { juz: 30, surah: "Al-Kafirun", fromAyah: 1, toAyah: 6 },
  { juz: 30, surah: "An-Nasr", fromAyah: 1, toAyah: 3 },
  { juz: 30, surah: "Al-Lahab", fromAyah: 1, toAyah: 5 },
  { juz: 30, surah: "Al-Ikhlas", fromAyah: 1, toAyah: 4 },
  { juz: 30, surah: "Al-Falaq", fromAyah: 1, toAyah: 5 },
  { juz: 30, surah: "An-Nas", fromAyah: 1, toAyah: 6 },
];

export function getSurahNamesForJuz(juz: number): string[] {
  return [...new Set(
    juzRanges
      .filter((range) => range.juz === juz)
      .map((range) => range.surah),
  )];
}

export function getJuz(surah: string, ayah: number): number | null {
  const match = juzRanges.find(
    (r) => r.surah === surah && ayah >= r.fromAyah && ayah <= r.toAyah,
  );
  return match?.juz ?? null;
}

export function getJuzLabel(surah: string, fromAyah: number, toAyah: number): string {
  const startJuz = getJuz(surah, fromAyah);
  const endJuz = getJuz(surah, toAyah);

  if (!startJuz && !endJuz) return "";
  if (!startJuz || !endJuz) return `Juz ${startJuz ?? endJuz}`;
  if (startJuz === endJuz) return `Juz ${startJuz}`;
  return `Juz ${startJuz}-${endJuz}`;
}
