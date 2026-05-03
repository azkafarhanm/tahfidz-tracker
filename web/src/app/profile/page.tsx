import Link from "next/link";
import { ArrowLeft, UserCircle } from "lucide-react";
import { requireSessionScope } from "@/lib/session";

export default async function ProfilePage() {
  await requireSessionScope();

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-purple-100 text-purple-900 shadow-lg">
            <UserCircle size={28} strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Profil</h1>
          <p className="mt-2 text-slate-600">
            Fitur profil dan pengaturan sedang dalam pengembangan
          </p>
        </div>

        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
          href="/"
        >
          <ArrowLeft size={17} strokeWidth={2.3} />
          Kembali ke Home
        </Link>
      </section>
    </main>
  );
}
