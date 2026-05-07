export default function StudentsLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <div className="animate-pulse space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-7 w-32 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-200" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
          </div>
          <div className="h-36 rounded-[1.75rem] bg-slate-200" />
          <div className="h-12 rounded-2xl bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-48 rounded-2xl bg-slate-200" />
            <div className="h-48 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </section>
    </main>
  );
}
