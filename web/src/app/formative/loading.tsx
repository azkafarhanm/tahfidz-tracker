import AppShell from "@/components/AppShell";

export default function FormativeLoading() {
  return (
    <AppShell currentPath="/formative" userName="" isAdmin={false}>
      <header>
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </header>

      <section className="mt-6 flex gap-3">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </section>

      <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="h-64 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </AppShell>
  );
}
