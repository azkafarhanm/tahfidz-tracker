export type ActionButtonTone = "neutral" | "danger" | "warning" | "success";

const actionButtonBase =
  "inline-flex min-h-10 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:focus-visible:ring-offset-slate-900";

const actionButtonToneClasses = {
  neutral:
    "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300",
  danger:
    "border-rose-200/80 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50/70 dark:border-rose-900/50 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40",
  warning:
    "border-amber-200/80 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50/70 dark:border-amber-900/50 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-950/40",
  success:
    "border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
} as const;

const compactActionButtonBase =
  "inline-flex min-h-9 min-w-[4.75rem] items-center justify-center rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 dark:focus-visible:ring-offset-slate-900";

const compactActionButtonToneClasses = {
  neutral:
    "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
  danger:
    "border border-rose-700 bg-rose-700 text-white hover:bg-rose-800 dark:border-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600",
  warning:
    "border border-amber-600 bg-amber-600 text-white hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
  success:
    "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 dark:border-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
} as const;

export function actionButtonClass(
  tone: ActionButtonTone = "neutral",
  className = "",
) {
  return `${actionButtonBase} ${actionButtonToneClasses[tone]} ${className}`.trim();
}

export function compactActionButtonClass(
  tone: ActionButtonTone = "neutral",
  className = "",
) {
  return `${compactActionButtonBase} ${compactActionButtonToneClasses[tone]} ${className}`.trim();
}
