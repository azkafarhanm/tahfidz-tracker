export default function FormativeLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="space-y-6 motion-safe:animate-pulse">
          <header>
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-7 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-4 w-64 rounded bg-slate-200 dark:bg-slate-700" />
          </header>
          <section className="flex gap-3">
            <div className="h-10 w-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-36 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          </section>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="h-64 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </section>
    </main>
  );
}
