"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { BookOpen, Megaphone, X } from "lucide-react";
import { markReleaseNoteSeen } from "@/app/release-notes/actions";
import type { ReleaseNoteDisplay } from "@/lib/release-notes";

type Props = {
  latestPublished: ReleaseNoteDisplay | null;
  latestUnseen: ReleaseNoteDisplay | null;
};

export default function ReleaseNotesModal({ latestPublished, latestUnseen }: Props) {
  const [mounted, setMounted] = useState(false);
  const [releaseNote, setReleaseNote] = useState<ReleaseNoteDisplay | null>(latestUnseen);
  const [open, setOpen] = useState(Boolean(latestUnseen));
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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
    setReleaseNote(latestPublished);
    setOpen(true);
  }

  function acknowledge() {
    if (!releaseNote) return;
    startTransition(async () => {
      const result = await markReleaseNoteSeen(releaseNote.id);
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

      {mounted && open && releaseNote
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
              <div aria-labelledby={titleId} aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">What&apos;s New</p>
                      <h2 className="text-xl font-bold text-slate-950 dark:text-white" id={titleId}>TahfidzFlow v{releaseNote.version}</h2>
                    </div>
                  </div>
                  <button aria-label="Tutup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" disabled={isPending} onClick={() => setOpen(false)} ref={closeRef} type="button"><X className="h-5 w-5" /></button>
                </div>

                <div className="mt-5 space-y-4 text-slate-700 dark:text-slate-300">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{releaseNote.title}</h3>
                  <p className="font-medium">{releaseNote.summary}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{releaseNote.content}</p>
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
