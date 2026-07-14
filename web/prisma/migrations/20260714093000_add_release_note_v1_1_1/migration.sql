-- Publish the TahfidzFlow v1.1.1 teacher-facing release note.
-- Existing ReleaseNote and UserReleaseView rows remain unchanged.
INSERT INTO "ReleaseNote" (
    "id", "version", "title", "summary", "content", "isPublished", "publishedAt", "createdAt", "updatedAt"
) VALUES (
    'release-note-v1-1-1',
    '1.1.1',
    'Input Hafalan kini lebih mudah',
    'Pemilihan Juz, pencarian Surah, pengisian Target, dan input Ayat kini lebih praktis dan nyaman digunakan.',
    E'✨ Input Hafalan Lebih Praktis\n\nSekarang Ustadz/Ustadzah dapat memilih Juz terlebih dahulu agar daftar Surah lebih singkat dan mudah dipilih.\n\n🔍 Pencarian Surah Lebih Mudah\n\nNama Surah dapat dicari dengan lebih fleksibel. Pencarian tetap dapat menemukan Surah meskipun ditulis tanpa spasi atau tanda hubung.\n\n🎯 Pengisian Target Lebih Nyaman\n\nFilter Juz dan pencarian Surah yang baru juga tersedia saat menambah atau mengubah Target.\n\n🔢 Input Ayat Lebih Stabil\n\nKolom Ayat Awal dan Ayat Akhir kini lebih nyaman digunakan dan membantu mencegah perubahan angka yang tidak disengaja.\n\nPenyempurnaan ini tersedia pada Catat Cepat, Hafalan, Murojaah, edit catatan, dan Target.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
