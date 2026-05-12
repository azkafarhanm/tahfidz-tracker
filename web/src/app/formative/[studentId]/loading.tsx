import AppShell from "@/components/AppShell";

export default function FormativeDetailLoading() {
  return (
    <AppShell currentPath="/formative" userName="" isAdmin={false}>
      <header>
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-7 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-700" />
        <div className="h-28 animate-pulse rounded-[1.75rem] bg-slate-200 dark:bg-slate-700" />
      </section>

      <div className="mt-6 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="h-72 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </AppShell>
  );
}
