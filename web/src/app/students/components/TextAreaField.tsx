interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}

export function TextAreaField({
  label,
  name,
  placeholder,
  required = false,
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
