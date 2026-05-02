interface RecordFormShellProps {
  header: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  action: (formData: FormData) => Promise<void>;
}

export function RecordFormShell({
  header,
  error,
  children,
  action,
}: RecordFormShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-8">
        {header}

        {error ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {error}
          </div>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          {children}
        </form>
      </section>
    </main>
  );
}
