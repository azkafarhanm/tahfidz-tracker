"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { BookOpen, Megaphone, X } from "lucide-react";
import { markReleaseNotesSeen } from "@/app/release-notes/actions";
import ReleaseNotePresentation from "@/components/ReleaseNotePresentation";
import { groupReleaseNotes } from "@/components/release-note-groups";
import type { ReleaseNote } from "@/lib/release-notes";

type Props = {
  latestPublished: ReleaseNote | null;
  unreadPublished: ReleaseNote[];
  locale: string;
};

export default function ReleaseNotesModal({ latestPublished, unreadPublished, locale }: Props) {
  const [mounted, setMounted] = useState(false);
  const [displayedNotes, setDisplayedNotes] = useState<ReleaseNote[]>(unreadPublished);
  const [open, setOpen] = useState(unreadPublished.length > 0);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const groupedNotes = useMemo(() => groupReleaseNotes(displayedNotes), [displayedNotes]);
  const publicationDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }),
    [locale],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPending, open]);

  function showLatest() {
    if (!latestPublished) return;
    setDisplayedNotes([latestPublished]);
    setOpen(true);
  }

  function acknowledge() {
    const releaseNoteIds = displayedNotes.map(({ id }) => id);
    if (releaseNoteIds.length === 0) return;

    startTransition(async () => {
      const result = await markReleaseNotesSeen(releaseNoteIds);
      if (result.ok) setOpen(false);
    });
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-emerald-400 dark:hover:text-emerald-300"
        disabled={!latestPublished}
        onClick={showLatest}
        type="button"
      >
        <Megaphone className="h-4 w-4" /> What&apos;s New
      </button>

      {mounted && open && displayedNotes.length > 0
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
              <div aria-labelledby={titleId} aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">What&apos;s New</p>
                      <h2 className="text-xl font-bold text-slate-950 dark:text-white" id={titleId}>Pembaruan TahfidzFlow</h2>
                    </div>
                  </div>
                  <button aria-label="Tutup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" disabled={isPending} onClick={() => setOpen(false)} ref={closeRef} type="button"><X className="h-5 w-5" /></button>
                </div>

                <div className="mt-5 space-y-6">
                  {groupedNotes.map((group) => (
                    <section key={group.applicationVersion}>
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white">TahfidzFlow v{group.applicationVersion}</h3>
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

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800" href="/user-guide-guru" target="_blank" rel="noreferrer"><BookOpen className="h-4 w-4" />Lihat Panduan Guru</a>
                  <button className="min-h-11 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={isPending} onClick={acknowledge} type="button">{isPending ? "Menyimpan..." : "Mengerti"}</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
