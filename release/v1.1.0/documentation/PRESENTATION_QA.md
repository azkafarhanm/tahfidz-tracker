# TahfidzFlow — Presentation Q&A

Versi 1.1.0 · Dokumen pendamping untuk presentasi, demonstrasi, wawancara, dan review teknis.

Dokumen ini berisi kumpulan pertanyaan yang sering muncul saat demonstrasi TahfidzFlow, beserta jawaban singkat dan penjelasan tambahan. Jawaban ditujukan untuk dua audiens: guru (non-teknis) pada bagian awal, dan reviewer teknis/dosen pada bagian akhir.

---

## Daftar Isi

1. [Pertanyaan Umum (Guru)](#1-pertanyaan-umum-guru)
2. [Administrasi Sekolah](#2-administrasi-sekolah)
3. [Pertanyaan Teknis](#3-pertanyaan-teknis)
4. [Arsitektur](#4-arsitektur)
5. [Infrastruktur](#5-infrastruktur)
6. [Keamanan](#6-keamanan)
7. [Bisnis & Pengembangan Masa Depan](#7-bisnis--pengembangan-masa-depan)
8. [Pengembangan Berbantuan AI](#8-pengembangan-berbantuan-ai)
9. [Pertanyaan Sulit](#9-pertanyaan-sulit)
10. [Pertanyaan Demo](#10-pertanyaan-demo)

---

## 1. Pertanyaan Umum (Guru)

### Q1.1 — Apa itu TahfidzFlow dan untuk siapa aplikasi ini?

**Jawaban:** TahfidzFlow adalah aplikasi pencatat hafalan Al-Qur'an untuk sekolah/madrasah. Aplikasi ini membantu guru mencatat hafalan (setoran baru), murojaah (pengulangan), dan Tasmi' (pemeriksaan per juz), serta melihat rekap perkembangan setiap santri secara otomatis.

**Penjelasan:** Aplikasi ditujukan untuk tingkat SMP (kelas 7–9) dan digunakan oleh dua peran: guru (mencatat harian) dan admin (mengelola data sekolah).

---

### Q1.2 — Apakah saya perlu internet untuk menggunakan TahfidzFlow?

**Jawaban:** Ya. Saat ini TahfidzFlow adalah aplikasi online-first. Semua pencatatan dan perubahan data membutuhkan koneksi internet.

**Penjelasan:** Aplikasi bisa dipasang di layar utama HP seperti aplikasi biasa (PWA), tetapi memerlukan internet untuk menyimpan data. Fitur penuh offline (mengisi data tanpa internet lalu sinkron otomatis) belum tersedia di versi 1.0.0.

---

### Q1.3 — Apakah data santri saya aman di aplikasi ini?

**Jawaban:** Ya. Setiap guru hanya bisa melihat dan mengelola santri di bawah bimbingannya. Tidak ada guru lain yang dapat mengakses data santri Anda.

**Penjelasan:** Akses dibatasi secara otomatis berdasarkan akun. Admin dapat melihat seluruh data sekolah untuk keperluan koordinasi.

---

### Q1.4 — Apakah saya bisa mengakses TahfidzFlow dari HP dan komputer?

**Jawaban:** Bisa. TahfidzFlow dapat dibuka di HP, tablet, dan komputer melalui peramban (browser) modern. Aplikasi juga dapat dipasang langsung di layar utama HP untuk akses lebih cepat.

---

### Q1.5 — Apakah ada batasan jumlah santri yang bisa saya kelola?

**Jawaban:** Tidak ada batasan buatan. Kapasitas bergantung pada paket basis data sekolah, bukan pada aplikasi.

---

### Q1.6 — Apa perbedaan antara Hafalan, Murojaah, dan Tasmi'?

**Jawaban:**
- **Hafalan** = menambah hafalan baru (surah/ayat baru).
- **Murojaah** = mengulang hafalan lama agar tetap kuat.
- **Tasmi'** = pemeriksaan/setoran per juz, biasanya dihadiri penguji.

---

### Q1.7 — Apa itu "Rekap Formatif" dan apakah saya perlu mengisinya manual?

**Jawaban:** Rekap Formatif adalah ringkasan nilai harian yang **terbentuk otomatis** dari catatan hafalan dan murojaah Anda. Anda **tidak perlu** mengisinya secara manual.

**Penjelasan:** Selama Anda mencatat setiap setoran dengan benar, rekap akan terisi sendiri.

---

### Q1.8 — Apakah saya bisa mengunduh laporan untuk diserahkan ke wali santri atau koordinator?

**Jawaban:** Bisa. Anda dapat mengunduh laporan dalam format Excel dan PDF, baik untuk seluruh santri maupun per santri.

---

## 2. Administrasi Sekolah

### Q2.1 — Siapa yang bertugas mengelola guru, kelas, dan tahun ajaran?

**Jawaban:** Admin. Admin dapat menambah/mengubah guru, kelas akademik, halaqah, santri, dan tahun ajaran, termasuk proses pengarsipan (archive) tahun ajaran yang berakhir.

---

### Q2.2 — Apa itu program "Akademik" dan "Boarding"?

**Jawaban:**
- **Akademik** = program tahfidz reguler dengan kelas akademik (mis. Kelas 7A, 8B).
- **Boarding** = program tahfidz intensif untuk santri pondok.

**Penjelasan:** Satu sekolah bisa menjalankan kedua program sekaligus. Guru yang mengajar di kedua program dapat berpindah konteks melalui pemilih program (ProgramSelector) tanpa kehilangan data.

---

### Q2.3 — Apakah tahun ajaran bisa diarsipkan tanpa menghapus datanya?

**Jawaban:** Bisa. TahfidzFlow memiliki sistem arsip per tahun ajaran. Data arsip tetap tersimpan dan dapat ditelusuri kembali. Penghapusan arsip dilakukan dengan hati-hati dan **tercatat dalam jejak audit** (AuditLog).

---

### Q2.4 — Apa yang terjadi jika seorang santri pindah atau tidak lagi aktif?

**Jawaban:** Santri dapat dinonaktifkan (bukan dihapus). Santri nonaktif tetap tersimpan dengan riwayatnya, dan dapat diaktifkan kembali bila diperlukan.

---

### Q2.5 — Bagaimana TahfidzFlow menangani pergantian semester?

**Jawaban:** Catatan dan penilaian dicakup per semester (Ganjil/Genap). Guru memilih semester yang relevan sebelum mencatat atau melihat rekap, sehingga data antar-semester tidak tercampur.

---

## 3. Pertanyaan Teknis

### Q3.1 — Teknologi apa yang digunakan TahfidzFlow?

**Jawaban:**
- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.
- **Basis Data:** PostgreSQL (Neon), Prisma 7.8.
- **Autentikasi:** NextAuth 5 (Auth.js).
- **PWA & i18n:** service worker kustom, next-intl (Indonesia, Inggris, Arab + RTL).

**Penjelasan:** Pilihan stack modern berfokus pada keamanan tipe (type-safety) end-to-end dan pengalaman mobile-first.

---

### Q3.2 — Apakah ada automated test?

**Jawaban:** Ya, sebagian. Terdapat unit test (Vitest) untuk modul inti seperti cache, tahun ajaran, helper form, dan rate limit. Cakupan penuh (e2e/browser) belum tersedia di versi 1.0.0.

**Penjelasan:** CI GitHub Actions menjalankan validasi skema, lint, typecheck, unit test, dan production build pada setiap push/PR.

---

### Q3.3 — Bagaimana TahfidzFlow menangani kesalahan koneksi basis data sementara?

**Jawaban:** Terdapat pembungkus `withRetry` yang otomatis mengulang operasi saat terjadi error koneksi sementara dari Neon, dengan backoff eksponensial (200ms → 400ms).

---

### Q3.4 — Mengapa aplikasi terasa cepat meskipun banyak data?

**Jawaban:** Karena adanya cache in-memory berbasis TTL dengan invalidasi berbasis prefix (awalan kunci). Data yang sering dibaca (dashboard, rekap) di-cache, dan otomatis dihapus saat data berubah.

**Penjelasan:** Cache bersifat per-instance (bukan terdistribusi), cocok untuk skala saat ini.

---

### Q3.5 — Apakah kode aplikasi type-safe?

**Jawaban:** Ya. Seluruh kode menggunakan TypeScript, dan Prisma menghasilkan client yang type-safe. `next build` bersifat ketat dan akan gagal jika ada error tipe.

---

## 4. Arsitektur

### Q4.1 — Bagaimana arsitektur "dual-program" (Akademik/Boarding) bekerja?

**Jawaban:** `ProgramType` (enum `ACADEMIC`/`BOARDING`) disimpan pada `AcademicClass` dan `ClassGroup` saja — tidak pada tabel catatan. Semua query menerima parameter `programType` opsional dan memfilter berdasarkan `student.classGroup.programType`.

**Penjelasan:** Konteks program guru dideteksi otomatis dari ClassGroup mereka; guru dual-program mendapat pemilih program. Aturan UI Boarding menyembunyikan field yang tidak relevan (level, section, kartu nilai) sambil menjaga model data tetap terpadu.

---

### Q4.2 — Mengapa Rekap Formatif terpisah dari penilaian Sumatif?

**Jawaban:** Karena keduanya melayani tujuan berbeda:
- **Formatif** = nilai harian otomatis (dari hafalan/murojaah) — *tidak perlu input ganda*.
- **Sumatif** = penilaian per surah yang fleksibel, diisi guru secara manual.

Pemisahan ini mengikuti praktik penilaian pendidikan (penilaian formatif vs sumatif).

---

### Q4.3 — Bagaimana jejak audit (AuditLog) bekerja?

**Jawaban:** Model `AuditLog` mencatat operasi destruktif: penghapusan santri, penghapusan arsip, penghapusan tahun ajaran, serta CRUD Tasmi'. `userId` nullable dengan `onDelete: SetNull` sehingga jejak tetap utuh walau user dihapus.

---

### Q4.4 — Bagaimana isolasi data antar guru (mencegah akses silang)?

**Jawaban:** Semua query data pengguna menyertakan filter `teacherId`. Sesi di-resolve via `requireSessionScope()`, dan ada proteksi IDOR pada flow record dan santri. Guru hanya pernah mengakses datanya sendiri.

---

### Q4.5 — Mengapa timezone di-hardcode ke Asia/Jakarta?

**Jawaban:** Untuk konsistensi. Semua formatter tanggal/waktu dan rute ekspor menggunakan `timeZone: "Asia/Jakarta"`. Tidak ada cookie timezone per-user, sehingga seluruh pengguna melihat WIB. Ini menyederhanakan logika lintas zona waktu untuk konteks penggunaan saat ini (sekolah di Indonesia).

---

## 5. Infrastruktur

### Q5.1 — Di mana TahfidzFlow di-deploy?

**Jawaban:** Vercel (serverless Node.js). Basis data: Neon PostgreSQL (serverless). Rate limiting: Upstash Redis (serverless), dengan fallback in-memory jika tidak dikonfigurasi.

---

### Q5.2 — Apa yang terjadi jika layanan Neon sedang down?

**Jawaban:** Permintaan yang terkena error transien akan diulang otomatis (`withRetry`). Jika Neon benar-benar tidak tersedia, aplikasi akan menampilkan error — data tidak rusak karena tidak ada operasi parsial yang ditulis.

---

### Q5.3 — Bagaimana cara melakukan rollback deployment?

**Jawaban:** Vercel menyimpan riwayat deployment; rollback dapat dilakukan satu klik ke versi sebelumnya. Untuk migrasi basis data, tersedia panduan prosedur rollback pada `docs/ROLLBACK.md`.

---

### Q5.4 — Apakah TahfidzFlow bisa di-host sendiri (self-hosted)?

**Jawaban:** Secara teknis bisa karena ini aplikasi Next.js standar, namun belum ada panduan self-hosting resmi. v1.1.0 dirancang untuk Vercel + Neon + Upstash.

---

## 6. Keamanan

### Q6.1 — Bagaimana autentikasi bekerja?

**Jawaban:** NextAuth 5 dengan sesi berbasis JWT (stateless), peran `ADMIN`/`TEACHER`, dan provider Credentials (username/email + password di-hash dengan bcrypt).

---

### Q6.2 — Bagaimana pencegahan brute-force login?

**Jawaban:** Rate limiting: 5 percobaan gagal per 10 menit → akun diblokir 15 menit. Upstash Redis sebagai penyimpanan utama (production-safe); fallback in-memory jika Redis tidak ada.

---

### Q6.3 — Header keamanan apa yang dipasang?

**Jawaban:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (kamera/mikrofon/lokasi dinonaktifkan), dan `Cross-Origin-Opener-Policy: same-origin`.

---

### Q6.4 — Bagaimana proteksi terhadap Insecure Direct Object Reference (IDOR)?

**Jawaban:** Setiap akses ke record/santri diverifikasi kepemilikan via `teacherId`. `returnTo` (redirect setelah edit) juga dijaga agar tidak terjadi open-redirect. Cookie locale divalidasi untuk mencegah injeksi.

---

### Q6.5 — Apakah password disimpan dalam bentuk teks biasa?

**Jawaban:** Tidak. Password di-hash menggunakan bcrypt sebelum disimpan. Tidak ada satu pun titik dalam kode yang membandingkan teks biasa.

---

## 7. Bisnis & Pengembangan Masa Depan

### Q7.1 — Apa roadmap pasca v1.1.0?

**Jawaban:** v1.1.0 adalah rilis production-ready yang menyempurnakan alur guru, timeline Formatif Academic, penilaian Sumatif, ekspor, dan informasi pembaruan di dalam aplikasi. Tidak ada fitur spesifik yang dijanjikan untuk versi berikutnya.

**Penjelasan:** Pengembangan selanjutnya akan diprioritaskan berdasarkan umpan balik pengguna nyata di lapangan.

---

### Q7.2 — Apakah akan ada aplikasi mobile native (iOS/Android)?

**Jawaban:** Belum ada rencana untuk aplikasi native. Saat ini TahfidzFlow adalah PWA yang dapat dipasang di layar utama dan berperilaku seperti aplikasi native di kedua platform.

---

### Q7.3 — Apakah akan ada fitur orang tua/wali santri?

**Jawaban:** Belum tersedia di v1.1.0. Ini adalah ide yang masuk akal untuk masa depan, namun belum ada komitmen atau garis waktu.

---

### Q7.4 — Berapa biaya operasional (basis data, hosting)?

**Jawaban:** Bergantung pada tier Vercel/Neon/Upstash yang dipilih sekolah. Untuk skala satu sekolah, tier gratis/pemula umumnya memadai. Angka pasti bergantung pada volume penggunaan nyata.

---

## 8. Pengembangan Berbantuan AI

> Bagian ini menjelaskan peran AI secara jujur dan transparan.

### Q8.1 — Apakah TahfidzFlow dibuat dengan bantuan AI?

**Jawaban:** Ya. AI digunakan sebagai **asisten pengembangan** (development assistant) untuk mempercepat penulisan kode, menjelaskan konsep, dan menyarankan pendekatan teknis.

---

### Q8.2 — Jadi, apakah AI yang membuat aplikasi ini secara otomatis?

**Jawaban:** Tidak. AI adalah alat bantu, bukan pembuat keputusan. Seluruh **keputusan desain, arsitektur, persyaratan bisnis, debugging, pengujian, dan verifikasi** dilakukan oleh pengembang.

**Penjelasan:** Pengembang yang menentukan model data, alur bisnis, aturan dual-program, strategi keamanan, dan menerima tanggung jawab penuh atas kebenaran akhir. Kode yang dihasilkan AI tetap ditinjau, diuji, dan diverifikasi sebelum dipakai.

---

### Q8.3 — Bagaimana Anda memastikan kode dari AI itu benar dan aman?

**Jawaban:** Melalui beberapa lapisan:
- **TypeScript ketat** + Prisma type-safe → error tipe tertangkap saat build.
- **Unit test** untuk modul kritis (cache, rate limit, helper).
- **CI otomatis** (lint, typecheck, test, build) pada setiap perubahan.
- **Tinjauan manual** untuk logika bisnis, keamanan, dan IDOR.

---

### Q8.4 — Bagian mana yang murni buatan pengembang, dan mana yang dibantu AI?

**Jawaban:** Sulit memisahkan secara mutlak karena prosesnya iteratif. Namun keputusan strategis berikut sepenuhnya pengembang:
- Arsitektur dual-program dan model data.
- Strategi cache & retry.
- Aturan keamanan (rate limit, IDOR, header, scope sesi).
- Verifikasi label UI dari kode sumber untuk dokumentasi.

AI membantu menulis/draf kode, tetapi pengembang yang menetapkan **apa** yang harus dibangun dan **apakah** hasilnya benar.

---

### Q8.5 — Apakah AI menulis persyaratan bisnisnya?

**Jawaban:** Tidak. Persyaratan bisnis berasal dari kebutuhan nyata sekolah tahfidz. AI membantu memformulasikan/menerjemahkan kebutuhan tersebut ke dalam implementasi, tetapi tidak menentukan kebutuhan fungsional.

---

## 9. Pertanyaan Sulit

### Q9.1 — Mengapa tidak ada fitur offline penuh? Bukankah PWA seharusnya bisa?

**Jawaban:** PWA memang *bisa* offline, namun **mutation** (menulis data) offline membutuhkan arsitektur berbeda (background sync, antrian IndexedDB, resolusi konflik). v1.1.0 tetap memilih **online-first** agar data selalu konsisten dan tidak ada catatan hilang/konflik.

**Penjelasan:** Keputusan ini dituangkan secara eksplisit dalam `RELEASE_CHECKLIST.md` sebagai pilihan mode rilis, bukan kelalaian.

---

### Q9.2 — Bukankah cache in-memory tidak aman untuk multi-instance serverless?

**Jawaban:** Benar, cache in-memory bersifat per-instance dan tidak terdistribusi. Pada Vercel serverless, setiap instance memiliki cache sendiri, sehingga ada jendela invalidasi singkat. Untuk skala satu sekolah saat ini, ini dapat diterima. Jika skala bertambah, cache perlu dipindahkan ke lapisan terdistribusi (mis. Redis).

---

### Q9.3 — Cakupan test otomatis masih terbatas. Apakah aman untuk production?

**Jawaban:** Cakupan unit test memang terbatas (~modul inti). Amanan production dijaga oleh: type-safety ketat end-to-end, CI wajib lulus, UAT manual (192 item), dan tinjauan logika bisnis manual. Kombinasi ini menurunkan risiko, namun cakupan test penuh tetap menjadi pekerjaan masa depan.

---

### Q9.4 — Bagaimana jika ada bug yang baru ditemukan setelah rilis?

**Jawaban:** Vercel mendukung rollback cepat ke deployment sebelumnya. Bug dicatat di `KNOWN_ISSUES.md`, dan perbaikan dikirim melalui `main` yang auto-deploy. Tidak ada blocking issue terbuka pada saat packaging v1.1.0.

---

### Q9.5 — Apakah data bisa hilang?

**Jawaban:** Data tersimpan di Neon PostgreSQL dengan persistensi serverless. Penghapusan oleh pengguna tercatat di AuditLog. Tidak ada operasi "hard delete" tanpa jejak. Namun, cadangan berkala (backup) tetap tanggung jawab operasional sekolah/infrastruktur.

---

## 10. Pertanyaan Demo

### Q10.1 — Alur demo yang disarankan?

**Jawaban:**
1. **Login** sebagai guru demo (`teacher.demo@tahfidzflow.local` / `2026`).
2. **Dashboard** — tunjukkan statistik harian, target mingguan, aktivitas terbaru.
3. **Santri** — buka daftar, cari santri, buka detail.
4. **Catat Cepat** — input 1 hafalan untuk demonstrasi kecepatan.
5. **Rekap Formatif** — tunjukkan rekap otomatis.
6. **Laporan** — unduh Excel/PDF.
7. (Opsional, sebagai admin) Kelola guru/kelas/tahun ajaran.

---

### Q10.2 — Akun demo apa yang tersedia?

**Jawaban:**
| Peran | Login | Kata Sandi |
|---|---|---|
| Admin | `admin` | `2026` |
| Guru 1 | `teacher.demo@tahfidzflow.local` | `2026` |
| Guru 2 | `teacher.salwa@tahfidzflow.local` | `2026` |

**Catatan:** Data demo di-seed via `npm run db:seed` dan dapat bervariasi antar lingkungan.

---

### Q10.3 — Apa yang harus ditunjukkan untuk menonjolkan dual-program?

**Jawaban:** Login sebagai guru yang mengajar di dua program (Akademik & Boarding). Tunjukkan **ProgramSelector** untuk berganti konteks, dan bandingkan tampilan formulir santri (field yang berbeda di Boarding).

---

### Q10.4 — Apa yang harus dilakukan jika demo error/lag?

**Jawaban:**
- Tetap tenang; jelaskan bahwa ini aplikasi online-first dan bergantung koneksi.
- Tunjukkan halaman `/offline` yang cached sebagai contoh penanganan offline.
- Sediakan rekaman/screenshot cadangan jika koneksi benar-benar gagal.

---

### Q10.5 — Fitur apa yang paling "menjual" ke guru?

**Jawaban:**
- **Catat Cepat** — input banyak santri sekaligus.
- **Rekap Formatif otomatis** — tidak perlu hitung manual.
- **Ekspor Excel/PDF** — laporan siap serah.
- **PWA installable** — terasa seperti aplikasi native di HP.

---

*Akhir dokumen. Gunakan dokumen ini sebagai persiapan presentasi, referensi FAQ, panduan demo, dan dukungan portofolio.*
