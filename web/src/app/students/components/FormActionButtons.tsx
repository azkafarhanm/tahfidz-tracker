import Link from "next/link";
import { Save } from "lucide-react";

interface FormActionButtonsProps {
  cancelHref: string;
  submitLabel?: string;
}

export function FormActionButtons({
  cancelHref,
  submitLabel = "Simpan",
}: FormActionButtonsProps) {
  return (
    <div className="sticky bottom-4 flex gap-3 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-950/10 backdrop-blur">
      <Link
        className="flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        href={cancelHref}
      >
        Batal
      </Link>
      <button
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-950 active:scale-[0.98]"
        type="submit"
      >
        <Save aria-hidden="true" size={17} strokeWidth={2.2} />
        {submitLabel}
      </button>
    </div>
  );
}
