import { Hash } from "lucide-react";

interface NumberInputFieldProps {
  label: string;
  name: string;
  min?: number;
  required?: boolean;
}

export function NumberInputField({
  label,
  name,
  min = 1,
  required = true,
}: NumberInputFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
        <Hash
          aria-hidden="true"
          className="shrink-0 text-slate-400"
          size={16}
          strokeWidth={2.2}
        />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
          min={min}
          name={name}
          required={required}
          type="number"
        />
      </div>
    </label>
  );
}
