import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil - TahfidzFlow",
};

type ProfilePageProps = {
  searchParams?: Promise<{
    success?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { session, isAdmin } = await requireSessionScope();
  const query = await searchParams;
  const roleDescription = isAdmin
    ? "Memiliki akses untuk melihat ringkasan sistem dan melanjutkan fondasi Phase 4."
    : "Memiliki akses untuk mencatat hafalan, murojaah, dan memantau santri sendiri.";
  const actionsDescription = isAdmin
    ? "Gunakan halaman ini untuk berpindah ke area penting sesuai role Anda."
    : "Gunakan halaman ini untuk membuka area utama guru dan keluar dari akun.";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
              Dashboard
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Profil
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan akun dan akses Anda saat ini.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
            <UserCircle aria-hidden="true" size={22} strokeWidth={2.2} />
          </div>
        </header>

        {query?.success ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {query.success}
          </div>
        ) : null}

        <section className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
          <p className="text-sm text-emerald-100">Akun aktif</p>
          <h2 className="mt-3 text-3xl font-semibold">{session.user.name}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-slate-100">
              <Mail aria-hidden="true" size={15} strokeWidth={2.2} />
              {session.user.email}
            </span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 font-medium text-emerald-100">
              {isAdmin ? "ADMIN" : "TEACHER"}
            </span>
          </div>
        </section>

        <section
          className={`mt-5 grid gap-3 ${isAdmin ? "sm:grid-cols-2" : ""}`}
        >
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Peran akun</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {isAdmin ? "Administrator" : "Guru"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{roleDescription}</p>
          </article>

          {isAdmin ? (
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Akses admin</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                Tersedia
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Buka panel admin untuk melihat ringkasan data sistem.
              </p>
            </article>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Aksi akun</h2>
              <p className="mt-1 text-sm text-slate-600">{actionsDescription}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950"
                href="/admin"
              >
                Buka Panel Admin
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/students"
            >
              Lihat Santri
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900"
              href="/profile/change-password"
            >
              <KeyRound aria-hidden="true" size={15} strokeWidth={2.2} />
              Ubah Password
            </Link>
            <LogoutButton />
          </div>
        </section>

        <BottomNav currentPath="/profile" />
      </section>
    </main>
  );
}
