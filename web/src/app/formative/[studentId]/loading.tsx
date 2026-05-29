export default function FormativeDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-[#0c0f1a] dark:text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        <div className="space-y-6 motion-safe:animate-pulse">
          <header>
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-7 w-56 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-4 w-72 rounded bg-slate-200 dark:bg-slate-700" />
          </header>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="h-28 rounded-[1.75rem] bg-slate-200 dark:bg-slate-700" />
            <div className="h-28 rounded-[1.75rem] bg-slate-200 dark:bg-slate-700" />
          </section>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="h-72 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </section>
    </main>
  );
}
