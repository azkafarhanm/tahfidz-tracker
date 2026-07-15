import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale } from "next-intl/server";
import AppShell from "@/components/AppShell";
import ReleaseNotePresentation from "@/components/ReleaseNotePresentation";
import { groupReleaseNotes } from "@/components/release-note-groups";
import { backLink } from "@/lib/colors";
import { getReleaseNotesForUser } from "@/lib/release-notes";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";

export const metadata = { title: "Riwayat Pembaruan - TahfidzFlow" };

export default async function ReleaseNotesHistoryPage() {
  const [locale, { session, isAdmin }] = await Promise.all([
    getLocale(),
    requireSessionScope(),
  ]);

  if (isAdmin) redirect("/");

  const { publishedHistory } = await getReleaseNotesForUser(session.user.id);
  const groupedNotes = groupReleaseNotes(publishedHistory);
  const publicationDateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <AppShell currentPath="/release-notes" isAdmin={false} userName={session.user.name ?? "Guru"}>
      <header>
        <Link className={backLink} href="/">
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={2.3} />
          Kembali ke Dashboard
        </Link>
        <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">TahfidzFlow</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Riwayat Pembaruan</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Semua pembaruan yang telah dipublikasikan untuk guru.</p>
      </header>

      {groupedNotes.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groupedNotes.map((group) => (
            <section key={group.applicationVersion}>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">TahfidzFlow v{group.applicationVersion}</h2>
              <div className="mt-3 space-y-3">
                {group.notes.map((releaseNote) => (
                  <ReleaseNotePresentation
                    applicationVersion={releaseNote.applicationVersion}
                    content={releaseNote.content}
                    key={releaseNote.id}
                    publishedAtLabel={`Dipublikasikan ${publicationDateFormatter.format(releaseNote.publishedAt ?? releaseNote.createdAt)}`}
                    showHeader={false}
                    summary={releaseNote.summary}
                    title={releaseNote.title}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">Belum ada pembaruan yang dipublikasikan.</p>
      )}
    </AppShell>
  );
}
