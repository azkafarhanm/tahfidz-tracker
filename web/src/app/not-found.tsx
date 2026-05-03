import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <p className="text-6xl font-bold text-emerald-900">404</p>
          <h1 className="mt-4 text-2xl font-semibold">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-slate-600">
            Halaman yang Anda cari tidak tersedia.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
            href="/"
          >
            Kembali ke Home
          </Link>
        </div>
      </section>
    </main>
  );
}
