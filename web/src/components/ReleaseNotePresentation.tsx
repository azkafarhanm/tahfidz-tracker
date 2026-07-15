type ReleaseNotePresentationProps = {
  applicationVersion: string;
  title: string;
  summary: string;
  content: string;
};

export default function ReleaseNotePresentation({
  applicationVersion,
  title,
  summary,
  content,
}: ReleaseNotePresentationProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">What&apos;s New</p>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">TahfidzFlow v{applicationVersion}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4 text-slate-700 dark:text-slate-300">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <p className="font-medium">{summary}</p>
        <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
      </div>
    </article>
  );
}
