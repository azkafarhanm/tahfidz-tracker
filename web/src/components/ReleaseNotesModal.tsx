"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Megaphone, X } from "lucide-react";
import { markReleaseNotesSeen } from "@/app/release-notes/actions";
import ReleaseNotePresentation from "@/components/ReleaseNotePresentation";
import WorkflowContextLink from "@/components/WorkflowContextLink";
import { groupReleaseNotes } from "@/components/release-note-groups";
import type { ReleaseNote } from "@/lib/release-notes";

type Props = {
  isAdmin: boolean;
  unreadPublished: ReleaseNote[];
  locale: string;
};

export default function ReleaseNotesModal({ isAdmin, unreadPublished, locale }: Props) {
  const [mounted, setMounted] = useState(false);
  const [displayedNotes] = useState<ReleaseNote[]>(unreadPublished);
  const [open, setOpen] = useState(unreadPublished.length > 0);
  const [, startTransition] = useTransition();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const groupedNotes = useMemo(() => groupReleaseNotes(displayedNotes), [displayedNotes]);
  const publicationDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }),
    [locale],
  );
  const historyHref = isAdmin ? "/admin/release-notes" : "/release-notes";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Every way out of this dialog counts as having read it. Closing used to
  // record the notes as seen only when "Mengerti" was pressed, so anyone who
  // reached for the X or Escape — the obvious way to dismiss a dialog — met the
  // same announcement again at every login. The dialog now closes straight away
  // and sends the acknowledgement behind it; if that request fails the note
  // reappears next time, which is the safe direction to fail in.
  const dismiss = useCallback(() => {
    const releaseNoteIds = displayedNotes.map(({ id }) => id);
    setOpen(false);
    if (releaseNoteIds.length === 0) return;

    startTransition(async () => {
      await markReleaseNotesSeen(releaseNoteIds);
    });
  }, [displayedNotes]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, open]);

  return (
    <>
      <WorkflowContextLink
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-emerald-400 dark:hover:text-emerald-300"
        href={historyHref}
      >
        <Megaphone className="h-4 w-4" /> What&apos;s New
      </WorkflowContextLink>

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
                  <button aria-label="Tutup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={dismiss} ref={closeRef} type="button"><X className="h-5 w-5" /></button>
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
                  <WorkflowContextLink className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800" href={historyHref}>Lihat Riwayat Pembaruan</WorkflowContextLink>
                  <button className="min-h-11 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800" onClick={dismiss} type="button">Mengerti</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
