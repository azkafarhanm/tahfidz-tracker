export const metadata = { title: "Panduan Guru - TahfidzFlow" };

export default function TeacherGuidePage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-10 text-slate-800 sm:px-10 dark:bg-slate-950 dark:text-slate-200">
      <article className="space-y-6">
        <header><p className="font-semibold text-emerald-700 dark:text-emerald-400">TahfidzFlow</p><h1 className="mt-2 text-3xl font-bold">User Guide Guru</h1><p className="mt-3 text-slate-600 dark:text-slate-400">Panduan ringkas penggunaan aplikasi untuk guru.</p></header>
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="text-xl font-bold">📢 Mengikuti Pembaruan TahfidzFlow</h2>
          <div className="mt-3 space-y-3 leading-7">
            <p>Setiap ada pembaruan aplikasi, popup <strong>What&apos;s New</strong> akan muncul setelah login. Popup hanya muncul satu kali untuk setiap release.</p>
            <p>Tombol <strong>Mengerti</strong> menandai release sudah dibaca. Gunakan tombol <strong>Lihat Panduan Guru</strong> untuk mempelajari perubahan dengan lebih lengkap.</p>
            <p>Riwayat release terbaru dapat dibuka kembali melalui menu <strong>📢 What&apos;s New</strong> di Dashboard.</p>
            <p className="rounded-xl bg-white/80 p-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-300"><strong>Catatan:</strong> Tidak semua pembaruan mengubah cara penggunaan aplikasi. Sebagian pembaruan hanya berupa perbaikan bug, peningkatan performa, atau penyempurnaan tampilan.</p>
          </div>
        </section>
        <section><h2 className="text-xl font-bold">Alur kerja utama</h2><ol className="mt-3 list-decimal space-y-2 pl-6"><li>Pilih program Academic atau Boarding yang sesuai.</li><li>Buka Quick Log untuk mencatat setoran harian.</li><li>Gunakan menu Siswa untuk melihat riwayat dan target.</li><li>Buka Laporan untuk meninjau perkembangan siswa.</li></ol></section>
        <section><h2 className="text-xl font-bold">Catatan penting</h2><p className="mt-3 leading-7">Pastikan siswa, tahun ajaran, semester, dan program sudah benar sebelum menyimpan pencatatan. Hubungi administrator bila data dasar belum tersedia.</p></section>
      </article>
    </main>
  );
}
