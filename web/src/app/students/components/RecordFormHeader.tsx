import Link from "next/link";

interface RecordFormHeaderProps {
  studentId: string;
  studentName: string;
  classSummary: string;
  title: string;
  icon: React.ReactNode;
  backLabel?: string;
}

export function RecordFormHeader({
  studentId,
  studentName,
  classSummary,
  title,
  icon,
  backLabel = "Kembali",
}: RecordFormHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
          href={`/students/${studentId}`}
        >
          <svg
            aria-hidden="true"
            className="size-[17px] stroke-current"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.3"
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-1 truncate text-sm text-slate-600">
          {studentName} - {classSummary}
        </p>
      </div>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
        {icon}
      </div>
    </header>
  );
}
