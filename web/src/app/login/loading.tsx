export default function LoginLoading() {
  return (
    <main
      aria-hidden="true"
      className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-slate-950 dark:bg-[#0c0f1a] dark:text-white"
    >
      <section className="route-transition-skeleton mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center motion-safe:animate-pulse">
        <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="mx-auto mt-5 h-7 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mx-auto mt-3 h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-8 space-y-4">
            <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </section>
    </main>
  );
}
