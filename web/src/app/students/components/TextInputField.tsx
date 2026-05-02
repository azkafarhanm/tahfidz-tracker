interface TextInputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}

export function TextInputField({
  label,
  name,
  placeholder,
  required = true,
}: TextInputFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        autoComplete="off"
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
    </label>
  );
}
