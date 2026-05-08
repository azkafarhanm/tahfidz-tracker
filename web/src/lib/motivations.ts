type Motivation = {
  type: "quran" | "hadith" | "quote";
  source: string;
  arabic?: string;
  text: string;
};

const motivations: Motivation[] = [
  // ── AL-QURAN ──────────────────────────────────────────────
  {
    type: "quran",
    source: "QS. Al-Qamar: 17",
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    text: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    type: "quran",
    source: "QS. Al-Qamar: 22",
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    text: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    type: "quran",
    source: "QS. Al-Qamar: 32",
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    text: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    type: "quran",
    source: "QS. Al-Qamar: 40",
    arabic: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    text: "Dan sungguh, telah Kami mudahkan Al-Quran untuk pelajaran, maka adakah orang yang mengambil pelajaran?",
  },
  {
    type: "quran",
    source: "QS. Al-Baqarah: 282",
    arabic: "وَاتَّقُوا اللَّهَ وَيُعَلِّمُكُمُ اللَّهُ",
    text: "Dan bertakwalah kepada Allah, Allah akan mengajarkan kepadamu.",
  },
  {
    type: "quran",
    source: "QS. Az-Zumar: 9",
    arabic: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    text: "Katakanlah, 'Adakah sama orang-orang yang mengetahui dengan orang yang tidak mengetahui?'",
  },
  {
    type: "quran",
    source: "QS. Al-Mujadilah: 11",
    arabic: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    text: "Allah akan mengangkat derajat orang-orang yang beriman dan berilmu di antaramu beberapa derajat.",
  },
  {
    type: "quran",
    source: "QS. Thaha: 114",
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    text: "Dan katakanlah, 'Ya Tuhanku, tambahkanlah ilmu kepadaku.'",
  },
  {
    type: "quran",
    source: "QS. Al-Alaq: 1-5",
    arabic: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ۝ خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ۝ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ۝ الَّذِي عَلَّمَ بِالْقَلَمِ ۝ عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ",
    text: "Bacalah dengan menyebut nama Tuhanmu yang menciptakan. Dia menciptakan manusia dari segumpal darah. Bacalah, dan Tuhanmulah Yang Maha Mulia. Yang mengajarkan dengan pena. Mengajarkan manusia apa yang tidak diketahuinya.",
  },
  {
    type: "quran",
    source: "QS. An-Nahl: 98",
    arabic: "فَإِذَا قَرَأْتَ الْقُرْآنَ فَاسْتَعِذْ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    text: "Apabila kamu membaca Al-Quran, maka hendaklah kamu meminta perlindungan kepada Allah dari setan yang terkutuk.",
  },
  {
    type: "quran",
    source: "QS. Al-Isra: 106",
    arabic: "وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُهْلٍ",
    text: "Dan Al-Quran itu telah Kami turunkan dengan berangsur-angsur agar kamu membacakannya perlahan-lahan kepada manusia.",
  },
  {
    type: "quran",
    source: "QS. Al-Furqan: 32",
    arabic: "وَقَالَ الَّذِينَ كَفَرُوا لَوْلَا نُزِّلَ عَلَيْهِ الْقُرْآنُ جُمْلَةً وَاحِدَةً ۚ كَذَٰلِكَ لِنُثَبِّتَ بِهِ فُؤَادَكَ",
    text: "Berkatalah orang-orang kafir, 'Mengapa Al-Quran ini tidak diturunkan sekaligus?' Demikianlah Kami turunkannya berangsur-angsur agar hatimu kuat.",
  },
  {
    type: "quran",
    source: "QS. Luqman: 27",
    arabic: "وَلَوْ أَنَّمَا فِي الْأَرْضِ مِن شَجَرَةٍ أَقْلَامٌ وَالْبَحْرُ يَمُدُّهُ مِن بَعْدِهِ سَبْعَةُ أَبْحُرٍ مَّا نَفِدَتْ كَلِمَاتُ اللَّهِ",
    text: "Seandainya pohon-pohon di bumi menjadi pena dan laut menjadi tinta, niscaya tidak akan habis kalimat Allah.",
  },
  {
    type: "quran",
    source: "QS. Al-Hashr: 21",
    arabic: "لَوْ أَنزَلْنَا هَٰذَا الْقُرْآنَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا مُّتَصَدِّعًا مِّنْ خَشْيَةِ اللَّهِ",
    text: "Kalau Kami turunkan Al-Quran ini kepada sebuah gunung, pasti kamu akan melihatnya tunduk terpecah karena takut kepada Allah.",
  },
  {
    type: "quran",
    source: "QS. Al-Ankabut: 49",
    arabic: "بَلْ هُوَ آيَاتٌ بَيِّنَاتٌ فِي صُدُورِ الَّذِينَ أُوتُوا الْعِلْمَ",
    text: "Sebenarnya, Al-Quran itu adalah ayat-ayat yang jelas dalam dada orang-orang yang diberi ilmu.",
  },
  {
    type: "quran",
    source: "QS. Fatir: 28",
    arabic: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
    text: "Sesungguhnya yang takut kepada Allah di antara hamba-hamba-Nya hanyalah ulama.",
  },
  {
    type: "quran",
    source: "QS. Ar-Rahman: 1-4",
    arabic: "الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ ۝ خَلَقَ الْإِنسَانَ ۝ عَلَّمَهُ الْبَيَانَ",
    text: "Tuhan Yang Maha Pengasih. Yang mengajarkan Al-Quran. Dia menciptakan manusia. Mengajarkannya pandai berbicara.",
  },
  {
    type: "quran",
    source: "QS. Al-Baqarah: 151",
    arabic: "كَمَا أَرْسَلْنَا فِيكُمْ رَسُولًا مِّنكُمْ يَتْلُو عَلَيْكُمْ آيَاتِنَا وَيُزَكِّيكُمْ وَيُعَلِّمُكُمُ الْكِتَابَ وَالْحِكْمَةَ",
    text: "Sebagaimana Kami telah mengutus seorang Rasul dari kalanganmu yang membacakan ayat-ayat Kami, menyucikan kamu, dan mengajarkan Al-Kitab dan hikmah kepadamu.",
  },
  {
    type: "quran",
    source: "QS. Ali Imran: 79",
    arabic: "وَيُعَلِّمُكُمُ الْكِتَابَ وَالْحِكْمَةَ",
    text: "Dan mengajarkan kepadamu Al-Kitab dan hikmah.",
  },
  {
    type: "quran",
    source: "QS. Al-Baqarah: 121",
    arabic: "الَّذِينَ آتَيْنَاهُمُ الْكِتَابَ يَتْلُونَهُ حَقَّ تِلَاوَتِهِ",
    text: "Orang-orang yang telah Kami berikan Al-Kitab kepadanya, mereka membacanya dengan sebenarnya.",
  },
  {
    type: "quran",
    source: "QS. Al-A'raf: 204",
    arabic: "وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ",
    text: "Dan apabila dibacakan Al-Quran, maka dengarkanlah dan diamlah, agar kamu mendapat rahmat.",
  },
  {
    type: "quran",
    source: "QS. Fushshilat: 41-42",
    arabic: "إِنَّ الَّذِينَ كَفَرُوا بِالذِّكْرِ لَمَّا جَاءَهُمْ ۖ وَإِنَّهُ لَكِتَابٌ عَزِيزٌ ۝ لَا يَأْتِيهِ الْبَاطِلُ مِن بَيْنِ يَدَيْهِ وَلَا مِنْ خَلْفِهِ تَنزِيلٌ مِّنْ حَكِيمٍ حَمِيدٍ",
    text: "Sesungguhnya Al-Quran itu adalah Kitab yang mulia. Yang tidak datang kepadanya kebatilan dari depan maupun dari belakangnya, yang diturunkan dari Tuhan Yang Maha Bijaksana lagi Maha Terpuji.",
  },
  {
    type: "quran",
    source: "QS. Yunus: 37",
    arabic: "وَمَا كَانَ هَٰذَا الْقُرْآنُ أَن يُفْتَرَىٰ مِن دُونِ اللَّهِ",
    text: "Dan tidak mungkin Al-Quran ini dibuat-buat selain dari Allah.",
  },
  {
    type: "quran",
    source: "QS. Al-Waqi'ah: 77-80",
    arabic: "إِنَّهُ لَقُرْآنٌ كَرِيمٌ ۝ فِي كِتَابٍ مَّكْنُونٍ ۝ لَّا يَمَسُّهُ إِلَّا الْمُطَهَّرُونَ",
    text: "Sesungguhnya Al-Quran ini adalah bacaan yang sangat mulia, dalam kitab yang terpelihara, yang tidak disentuh kecuali oleh orang-orang yang disucikan.",
  },
  {
    type: "quran",
    source: "QS. Al-Kahf: 1-2",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا ۝ قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِن لَّدُنْهُ",
    text: "Segala puji bagi Allah yang telah menurunkan kepada hamba-Nya Al-Kitab dan tidak mengadakan kebengkokan di dalamnya. Sebagai bacaan yang lurus, untuk memperingatkan akan siksa yang sangat pedas dari sisi-Nya.",
  },
  {
    type: "quran",
    source: "QS. Ibrahim: 1",
    arabic: "الر ۚ كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ لِتُخْرِجَ النَّاسَ مِنَ الظُّلُمَاتِ إِلَى النُّورِ",
    text: "Alif Lam Ra. Ini adalah Kitab yang Kami turunkan kepadamu supaya kamu mengeluarkan manusia dari gelap gulita kepada cahaya terang.",
  },
  {
    type: "quran",
    source: "QS. An-Nisa: 82",
    arabic: "أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ ۚ وَلَوْ كَانَ مِنْ عِندِ غَيْرِ اللَّهِ لَوَجَدُوا فِيهِ اخْتِلَافًا كَثِيرًا",
    text: "Maka apakah mereka tidak memperhatikan Al-Quran? Kalau kiranya Al-Quran itu bukan dari Allah, pasti mereka menemukan banyak pertentangan di dalamnya.",
  },
  {
    type: "quran",
    source: "QS. Az-Zumar: 23",
    arabic: "اللَّهُ نَزَّلَ أَحْسَنَ الْحَدِيثِ كِتَابًا مُّتَشَابِهًا مَّثَانِيَ",
    text: "Allah telah menurunkan sebaik-baik perkataan yaitu Al-Quran yang serupa lagi berulang-ulang.",
  },
  {
    type: "quran",
    source: "QS. Al-Isra: 9",
    arabic: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    text: "Sesungguhnya Al-Quran ini memberi petunjuk kepada jalan yang paling lurus.",
  },
  {
    type: "quran",
    source: "QS. Ar-Ra'd: 28",
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    text: "Ingatlah, hanya dengan mengingat Allah-lah hati menjadi tenteram.",
  },
  {
    type: "quran",
    source: "QS. Al-Inshiqaq: 21",
    arabic: "وَإِذَا قُرِئَ عَلَيْهِمُ الْقُرْآنُ لَا يَسْجُدُونَ",
    text: "Dan apabila dibacakan kepada mereka Al-Quran, mereka tidak mau bersujud.",
  },
  {
    type: "quran",
    source: "QS. Al-Baqarah: 152",
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    text: "Karena itu, ingatlah kamu kepada-Ku niscaya Aku ingat pula kepadamu. Bersyukurlah kepada-Ku dan janganlah kamu mengingkari-Ku.",
  },
  {
    type: "quran",
    source: "QS. At-Talaq: 2-3",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    text: "Dan barangsiapa yang bertawakal kepada Allah, niscaya Allah akan mencukupkan keperluannya.",
  },
  {
    type: "quran",
    source: "QS. Al-Baqarah: 45",
    arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    text: "Jadikanlah sabar dan shalat sebagai penolongmu.",
  },
  {
    type: "quran",
    source: "QS. Ali Imran: 139",
    arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
    text: "Janganlah kamu bersikap lemah, dan janganlah pula kamu bersedih hati, padahal kamulah orang-orang yang paling tinggi derajatnya, jika kamu orang-orang yang beriman.",
  },
  {
    type: "quran",
    source: "QS. Al-Inshirah: 5-6",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    text: "Maka sesungguhnya bersama kesulitan ada kemudahan. Sesungguhnya bersama kesulitan ada kemudahan.",
  },
  {
    type: "quran",
    source: "QS. Al-Anfal: 2",
    arabic: "إِنَّمَا الْمُؤْمِنُونَ الَّذِينَ إِذَا ذُكِرَ اللَّهُ وَجِلَتْ قُلُوبُهُمْ وَإِذَا تُلِيَتْ عَلَيْهِمْ آيَاتُهُ زَادَتْهُمْ إِيمَانًا",
    text: "Sesungguhnya orang-orang yang beriman ialah mereka yang apabila disebut nama Allah, gemetarlah hati mereka, dan apabila dibacakan ayat-ayat-Nya, bertambahlah iman mereka.",
  },

  // ── HADITS ────────────────────────────────────────────────
  {
    type: "hadith",
    source: "HR. Bukhari & Muslim",
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    text: "Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya.",
  },
  {
    type: "hadith",
    source: "HR. Bukhari & Muslim",
    arabic: "مَثَلُ الْمُؤْمِنِ الَّذِي يَقْرَأُ الْقُرْآنَ كَالْأُتْرُجَّةِ رِيحُهَا طَيِّبٌ وَطَعْمُهَا طَيِّبٌ",
    text: "Perumpamaan orang mukmin yang membaca Al-Quran seperti buah utrujjah, aromanya harum dan rasanya enak.",
  },
  {
    type: "hadith",
    source: "HR. Muslim",
    arabic: "اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ",
    text: "Bacalah Al-Quran, karena sesungguhnya ia akan datang pada hari kiamat sebagai pemberi syafaat bagi para pembacanya.",
  },
  {
    type: "hadith",
    source: "HR. Bukhari & Muslim",
    arabic: "لَا حَسَدَ إِلَّا فِي اثْنَتَيْنِ رَجُلٌ آتَاهُ اللَّهُ الْقُرْآنَ فَهُوَ يَقُومُ بِهِ آنَاءَ اللَّيْلِ وَآنَاءَ النَّهَارِ",
    text: "Tidak ada hasad (dengki) kecuali dalam dua hal: seseorang yang diberi Al-Quran oleh Allah lalu ia membacanya sepanjang malam dan siang.",
  },
  {
    type: "hadith",
    source: "HR. At-Tirmidzi",
    arabic: "مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا",
    text: "Siapa membaca satu huruf dari Kitab Allah, maka baginya satu kebaikan, dan satu kebaikan dilipatgandakan menjadi sepuluh kali.",
  },
  {
    type: "hadith",
    source: "HR. Bukhari",
    arabic: "يُقَالُ لِصَاحِبِ الْقُرْآنِ اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا",
    text: "Dikatakan kepada ahli Al-Quran: Bacalah dan naiklah, dan bacalah dengan perlahan sebagaimana kamu membacanya di dunia.",
  },
  {
    type: "hadith",
    source: "HR. Abu Dawud & At-Tirmidzi",
    arabic: "يُؤْتَى صَاحِبُ الْقُرْآنِ يَوْمَ الْقِيَامَةِ فَيُقَالُ لَهُ اقْرَأْ وَارْقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا فَإِنَّ مَنْزِلَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَأُ بِهَا",
    text: "Pemilik Al-Quran didatangkan pada hari kiamat, lalu dikatakan: Bacalah dan naiklah. Maka kedudukannya ada pada ayat terakhir yang ia baca.",
  },
  {
    type: "hadith",
    source: "HR. Bukhari & Muslim",
    arabic: "إِنَّ هَذَا الْقُرْآنَ مَأْدُبَةُ اللَّهِ فَتَعَلَّمُوا مِنْ مَأْدُبَتِهِ مَا اسْتَطَعْتُمْ",
    text: "Sesungguhnya Al-Quran ini adalah jamuan Allah, maka pelajarilah dari jamuan-Nya semampu kalian.",
  },
  {
    type: "hadith",
    source: "HR. Ahmad",
    arabic: "إِنَّ اللَّهَ يَرْفَعُ بِهَذَا الْكِتَابِ أَقْوَامًا وَيَضَعُ بِهِ آخَرِينَ",
    text: "Sesungguhnya Allah mengangkat derajat suatu kaum dengan Al-Quran ini dan merendahkan kaum yang lain.",
  },
  {
    type: "hadith",
    source: "HR. Muslim",
    arabic: "أَنَا أَوْلَى النَّاسِ بِاللَّهِ وَأَبْرَارُ هَذِهِ الْأُمَّةِ بِاللَّهِ يَوْمَ الْقِيَامَةِ أَصْحَابُ الْقُرْآنِ",
    text: "Aku adalah orang yang paling berhak terhadap Allah. Dan orang-orang yang paling baik di umat ini pada hari kiamat adalah ahli Al-Quran.",
  },
  {
    type: "hadith",
    source: "HR. At-Tirmidzi",
    arabic: "الَّذِي يَقْرَأُ الْقُرْآنَ وَهُوَ حَافِظٌ لَهُ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ",
    text: "Orang yang membaca Al-Quran dan hafalnya, ia bersama para utusan yang mulia lagi baik.",
  },
  {
    type: "hadith",
    source: "HR. Al-Baihaqi",
    arabic: "تَعَاهَدُوا هَذَا الْقُرْآنَ فَوَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَهُوَ أَشَدُّ تَفَلُّتًا مِنَ الْإِبِلِ فِي عُقُلِهَا",
    text: "Peliharalah (jagalah) Al-Quran ini. Demi Allah yang jiwaku di tangan-Nya, sesungguhnya ia lebih cepat lolos dari ingatan daripada unta dari ikatannya.",
  },
  {
    type: "hadith",
    source: "HR. Bukhari & Muslim",
    arabic: "لَيْسَ مِنَّا مَنْ لَمْ يَتَغَنَّ بِالْقُرْآنِ",
    text: "Bukan termasuk golongan kami orang yang tidak membaca Al-Quran dengan suara yang bagus.",
  },
  {
    type: "hadith",
    source: "HR. Ibnu Majah",
    arabic: "مَنْ أَعْطَى وَقَتَ وَشَكَرَ وَصَبَرَ وَاسْتَغْفَرَ اللَّهَ كَانَ مِنَ الْفَائِزِينَ",
    text: "Barangsiapa yang memperbanyak istighfar, Allah akan menjadikan untuk setiap kesedihannya jalan keluar, dan untuk setiap kesulitannya kelapangan.",
  },
  {
    type: "hadith",
    source: "HR. Muslim",
    arabic: "مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ",
    text: "Barangsiapa yang meringankan beban seorang mukmin dari bebannya di dunia, Allah akan meringankan bebannya pada hari kiamat.",
  },

  // ── QUOTES ULAMA & MOTIVASI HAFIDZ ──────────────────────
  {
    type: "quote",
    source: "Imam Syafi'i",
    text: "Barangsiapa menghafal Al-Quran, maka nilainya akan tinggi. Orang yang menghafal Al-Quran adalah orang yang paling mulia di sisi Allah.",
  },
  {
    type: "quote",
    source: "Imam Syafi'i",
    text: "Ilmu itu adalah apa yang bermanfaat, bukan apa yang hanya dihafal. Dan ilmu yang paling bermanfaat adalah Al-Quran.",
  },
  {
    type: "quote",
    source: "Umar bin Khattab",
    text: "Pelajarilah Al-Quran, karena ia adalah musim semi hati. Dan ambillah keterangannya, karena ia adalah cahaya di malam yang gelap.",
  },
  {
    type: "quote",
    source: "Ali bin Abi Thalib",
    text: "Tidak ada kesedihan yang lebih besar dari kesedihan panjang, dan tidak ada kebahagiaan yang lebih besar dari kebahagiaan dekat dengan Al-Quran.",
  },
  {
    type: "quote",
    source: "Abdullah bin Mas'ud",
    text: "Jadikanlah Al-Quran sebagai pemimpin kalian, karena sesungguhnya ia adalah petunjuk dan cahaya.",
  },
  {
    type: "quote",
    source: "Ibnu Taimiyyah",
    text: "Jika hatimu merasa gelisah, maka tidak ada obatnya selain Al-Quran.",
  },
  {
    type: "quote",
    source: "Imam Al-Ghazali",
    text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya. Dan tidak ada manfaat yang lebih besar daripada mengajarkan Al-Quran.",
  },
  {
    type: "quote",
    source: "Hasan Al-Bashri",
    text: "Orang-orang sebelum kalian memandang Al-Quran sebagai surat dari Allah, maka mereka memikirkannya pada malam hari dan mengamalkannya pada siang hari.",
  },
  {
    type: "quote",
    source: "Ibnu Katsir",
    text: "Al-Quran adalah obat bagi segala penyakit hati. Ia membersihkan hati dari kotoran dan menyinari dengan cahaya keimanan.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Setiap huruf Al-Quran yang kamu hafal adalah investasi abadi yang tidak akan pernah hilang. Teruslah berjalan, meski pelan.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Jangan pernah merasa bahwa hafalanmu sedikit. Sesungguhnya setiap ayat yang tertanam di dadamu adalah permata yang tak ternilai di sisi Allah.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Surga itu mahal, dan Al-Quran adalah tiketnya. Setiap kali kamu mengulang hafalan, kamu semakin dekat ke gerbangnya.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Muroja'ah bukan sekadar mengulang. Ia adalah proses menjaga amanah yang Allah titipkan di dalam dadamu.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Ketika kamu merasa capek menghafal, ingatlah bahwa para malaikat mendoakanmu, dan Allah bangga dengan usahamu.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Hafalan yang kuat lahir dari muroja'ah yang konsisten. Sedikit tapi rutin, lebih baik daripada banyak tapi berhenti.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Al-Quran yang kamu hafal akan menjadi teman setiamu di kubur, dan pemberi syafaat di hari kiamat. Jangan pernah tinggalkan dia.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Perjalanan menghafal Al-Quran bukan sprint, tapi maraton. Yang penting bukan cepat atau lambat, tapi terus berjalan.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Setiap kali kamu lupa dan mengulangi hafalan, itu bukan kegagalan. Itu adalah pengingat bahwa kamu sedang berjuang untuk Allah.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Bayangkan hari kiamat nanti, Al-Quran datang dan berkata: 'Dia pernah menjagaku di dunia.' Itulah akhir dari semua lelahmu.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Jangan bandingkan progres hafalanmu dengan orang lain. Allah tidak melihat seberapa cepat, tapi seberapa ikhlas.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Ustadz/Ustadzah yang mendampingi hafalan santri, sesungguhnya pahala kalian tidak pernah putus. Setiap ayat yang dibaca santri, kalian mendapat bagiannya.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Menghafal Al-Quran bukan soal kecerdasan. Ini soal konsistensi, kesabaran, dan keyakinan bahwa Allah akan memudahkan.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Jangan menunggu sempurna untuk mulai menghafal. Mulailah sekarang, kesempurnaan datang dalam proses.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Bumi ini menyimpan jejak para hafidz. Setiap tempat di mana Al-Quran dihafal, malaikat turun mendoakannya.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Jika kamu tidak sanggup membaca Al-Quran di malam hari karena kantuk, maka tidurlah. Namun bangunlah sebelum fajar untuk mengejar-Nya.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Anak yang menghafal Al-Quran adalah mahkota bagi kedua orang tuanya di hari kiamat. Cahaya itu memancar dari hafalan yang dijaga.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Al-Quran bukan hanya untuk dihafal, tapi untuk dihidupi. Hafalan tanpa amalan bagaikan pohon tanpa buah.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Ketika dunia terasa berat, bukalah Al-Quran. Sesungguhnya setiap hurufnya membawa ketenangan yang tidak bisa diberikan oleh apapun.",
  },
  {
    type: "quote",
    source: "Motivasi Tahfidz",
    text: "Santri yang sedang menghafal Al-Quran sedang membangun istana di surga. Setiap ayat adalah satu bata.",
  },
];

export function getAllMotivations(): Motivation[] {
  return motivations;
}

export function getDailyMotivation(): Motivation {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const index = dayOfYear % motivations.length;
  return motivations[index];
}

export type { Motivation };
