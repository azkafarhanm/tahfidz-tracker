import { CalendarDays } from "lucide-react";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

interface DateInputFieldProps {
  label: string;
  name: string;
  required?: boolean;
}

export function DateInputField({
  label,
  name,
  required = true,
}: DateInputFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
        <CalendarDays
          aria-hidden="true"
          className="shrink-0 text-slate-400"
          size={17}
          strokeWidth={2.2}
        />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
          defaultValue={todayInputValue()}
          name={name}
          required={required}
          type="date"
        />
      </div>
    </label>
  );
}
