type QuranMotivation = {
  surah: string;
  ayah: number;
  arabic: string;
  translation: string;
};

const motivations: QuranMotivation[] = [
  {
    surah: "Al-Qamar",
    ayah: 17,
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    translation: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    surah: "Al-Qamar",
    ayah: 22,
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    translation: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    surah: "Al-Qamar",
    ayah: 32,
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    translation: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    surah: "Al-Qamar",
    ayah: 40,
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    translation: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    surah: "Al-Baqarah",
    ayah: 282,
    arabic: "وَاتَّقُوا اللَّهَ وَيُعَلِّمُكُمُ اللَّهُ",
    translation: "Dan bertakwalah kepada Allah, Allah akan mengajarkan kepadamu.",
  },
  {
    surah: "Az-Zumar",
    ayah: 9,
    arabic: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    translation: "Katakanlah, 'Adakah sama orang-orang yang mengetahui dengan orang yang tidak mengetahui?'",
  },
  {
    surah: "Al-Mujadilah",
    ayah: 11,
    arabic: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    translation: "Allah akan mengangkat derajat orang-orang yang beriman dan berilmu di antaramu beberapa derajat.",
  },
  {
    surah: "Thaha",
    ayah: 114,
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translation: "Dan katakanlah, 'Ya Tuhanku, tambahkanlah ilmu kepadaku.'",
  },
  {
    surah: "Al-Alaq",
    ayah: 1,
    arabic: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    translation: "Bacalah dengan menyebut nama Tuhanmu yang menciptakan.",
  },
  {
    surah: "An-Nahl",
    ayah: 98,
    arabic: "فَإِذَا قَرَأْتَ الْقُرْآنَ فَاسْتَعِذْ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    translation: "Apabila kamu membaca Al-Quran, maka hendaklah kamu meminta perlindungan kepada Allah dari setan yang terkutuk.",
  },
  {
    surah: "Al-Isra",
    ayah: 78,
    arabic: "أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَى غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ",
    translation: "Dirikanlah salat dari sesudah matahari tergelincir sampai gelap malam dan laksanakanlah salat subuh. Sesungguhnya salat subuh itu disaksikan.",
  },
  {
    surah: "Al-Isra",
    ayah: 106,
    arabic: "وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُهْلٍ",
    translation: "Dan Al-Quran itu telah Kami turunkan dengan berangsur-angsur agar kamu membacakannya perlahan-lahan kepada manusia.",
  },
  {
    surah: "Al-Furqan",
    ayah: 32,
    arabic: "وَقَالَ الَّذِينَ كَفَرُوا لَوْلَا نُزِّلَ عَلَيْهِ الْقُرْآنُ جُمْلَةً وَاحِدَةً ۚ كَذَٰلِكَ لِنُثَبِّتَ بِهِ فُؤَادَكَ",
    translation: "Berkatalah orang-orang kafir, 'Mengapa Al-Quran ini tidak diturunkan kepadanya sekaligus?' Demikianlah Kami menurunkannya agar hatimu kuat.",
  },
  {
    surah: "Luqman",
    ayah: 27,
    arabic: "وَلَوْ أَنَّمَا فِي الْأَرْضِ مِن شَجَرَةٍ أَقْلَامٌ وَالْبَحْرُ يَمُدُّهُ مِن بَعْدِهِ سَبْعَةُ أَبْحُرٍ مَّا نَفِدَتْ كَلِمَاتُ اللَّهِ",
    translation: "Seandainya pohon-pohon di bumi menjadi pena dan laut menjadi tinta, niscaya tidak akan habis kalimat Allah.",
  },
  {
    surah: "Al-Hashr",
    ayah: 21,
    arabic: "لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا مُّتَصَدِّعًا مِّنْ خَشْيَةِ اللَّهِ",
    translation: "Kalau Kami turunkan Al-Quran ini kepada sebuah gunung, pasti kamu akan melihatnya tunduk terpecah karena takut kepada Allah.",
  },
  {
    surah: "Al-Ankabut",
    ayah: 49,
    arabic: "بَلْ هُوَ آيَاتٌ بَيِّنَاتٌ فِي صُدُورِ الَّذِينَ أُوتُوا الْعِلْمَ",
    translation: "Sebenarnya, Al-Quran itu adalah ayat-ayat yang jelas dalam dada orang-orang yang diberi ilmu.",
  },
  {
    surah: "Fatir",
    ayah: 28,
    arabic: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    translation: "Sesungguhnya yang takut kepada Allah di antara hamba-hamba-Nya hanyalah ulama.",
  },
  {
    surah: "Al-Baqarah",
    ayah: 151,
    arabic: "كَمَا أَرْسَلْنَا فِيكُمْ رَسُولًا مِّنكُمْ يَتْلُو عَلَيْكُمْ آيَاتِنَا وَيُزَكِّيكُمْ وَيُعَلِّمُكُمُ الْكِتَابَ وَالْحِكْمَةَ",
    translation: "Sebagaimana Kami telah mengutus kepadamu seorang Rasul dari kalanganmu yang membacakan ayat-ayat Kami, menyucikan kamu, dan mengajarkan Al-Kitab dan hikmah kepadamu.",
  },
  {
    surah: "Ali Imran",
    ayah: 79,
    arabic: "وَيُعَلِّمُكُمُ الْكِتَابَ وَالْحِكْمَةَ",
    translation: "Dan mengajarkan kepadamu Al-Kitab dan hikmah.",
  },
  {
    surah: "Ar-Rahman",
    ayah: 1,
    arabic: "الرَّحْمَٰنُ ﴿١﴾ عَلَّمَ الْقُرْآنَ ﴿٢﴾ خَلَقَ الْإِنسَانَ ﴿٣﴾ عَلَّمَهُ الْبَيَانَ",
    translation: "Tuhan Yang Maha Pengasih. Yang mengajarkan Al-Quran. Dia menciptakan manusia. Mengajarkannya pandai berbicara.",
  },
];

export function getAllMotivations(): QuranMotivation[] {
  return motivations;
}

export function getDailyMotivation(): QuranMotivation {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const index = dayOfYear % motivations.length;
  return motivations[index];
}

export type { QuranMotivation };
