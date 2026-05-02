import { Clock } from "lucide-react";

function nowTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

interface TimeInputFieldProps {
  label: string;
  name: string;
  required?: boolean;
}

export function TimeInputField({
  label,
  name,
  required = true,
}: TimeInputFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
        <Clock
          aria-hidden="true"
          className="shrink-0 text-slate-400"
          size={17}
          strokeWidth={2.2}
        />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
          defaultValue={nowTimeValue()}
          name={name}
          required={required}
          type="time"
        />
      </div>
    </label>
  );
}
