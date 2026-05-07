export default function StudentDetailLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-5xl sm:px-8">
        <div className="animate-pulse space-y-5">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-7 w-48 rounded bg-slate-200" />
          </div>
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl bg-slate-200" />
            <div className="h-16 rounded-2xl bg-slate-200" />
          </div>
          <div className="h-14 rounded-2xl bg-slate-200" />
          <div className="h-14 rounded-2xl bg-slate-200" />
          <div className="space-y-3">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="h-20 rounded-2xl bg-slate-200" />
            <div className="h-20 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </section>
    </main>
  );
}
