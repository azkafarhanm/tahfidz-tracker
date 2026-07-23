/**
 * Centralized semantic color system for badges, chips, stat cards, and status indicators.
 *
 * Semantic categories:
 *   SUCCESS  — active, completed, positive
 *   PROGRESS — in-progress, current
 *   WARNING  — needs attention, review needed
 *   ERROR    — overdue, failed, rejected
 *   NEUTRAL  — inactive, disabled, cancelled
 *   SUMMARY  — totals, aggregates
 *   INFO     — reports, information
 */

export const badge = {
  success:
    "max-w-full [overflow-wrap:anywhere] bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  progress:
    "max-w-full [overflow-wrap:anywhere] bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  warning:
    "max-w-full [overflow-wrap:anywhere] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  error:
    "max-w-full [overflow-wrap:anywhere] bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100",
  neutral:
    "max-w-full [overflow-wrap:anywhere] bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100",
  summary:
    "max-w-full [overflow-wrap:anywhere] bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  info:
    "max-w-full [overflow-wrap:anywhere] bg-cyan-50 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
} as const;

export const badgeSm = {
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  progress:
    "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  error:
    "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100",
  neutral:
    "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-100",
  summary:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100",
  info:
    "bg-cyan-50 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
} as const;

export const chip = {
  success:
    "max-w-full rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-emerald-800 [overflow-wrap:anywhere] dark:bg-emerald-900 dark:text-emerald-100",
  progress:
    "max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-blue-800 [overflow-wrap:anywhere] dark:bg-blue-900 dark:text-blue-100",
  warning:
    "max-w-full rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-amber-800 [overflow-wrap:anywhere] dark:bg-amber-900 dark:text-amber-100",
  error:
    "max-w-full rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-red-700 [overflow-wrap:anywhere] dark:bg-red-900 dark:text-red-100",
  neutral:
    "max-w-full rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-slate-500 [overflow-wrap:anywhere] dark:bg-slate-700 dark:text-slate-100",
  summary:
    "max-w-full rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-slate-600 [overflow-wrap:anywhere] dark:bg-slate-700 dark:text-slate-100",
  info:
    "max-w-full rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold leading-tight text-cyan-800 [overflow-wrap:anywhere] dark:bg-cyan-900 dark:text-cyan-100",
} as const;

export const statusDot = {
  success: "bg-emerald-500",
  progress: "bg-blue-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  neutral: "bg-slate-400",
  info: "bg-cyan-500",
} as const;

export const text = {
  success:
    "text-emerald-800 dark:text-emerald-100",
  progress:
    "text-blue-800 dark:text-blue-100",
  warning:
    "text-amber-800 dark:text-amber-100",
  error:
    "text-red-700 dark:text-red-100",
  neutral:
    "text-slate-600 dark:text-slate-100",
  summary:
    "text-slate-700 dark:text-slate-100",
  info:
    "text-cyan-800 dark:text-cyan-100",
} as const;

export const alert = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
} as const;

export const iconBg = {
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  progress:
    "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-100",
  error:
    "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100",
  neutral:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100",
  info:
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100",
} as const;

export const progressBg = {
  success: "bg-emerald-400",
  progress: "bg-blue-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  neutral: "bg-slate-300",
  info: "bg-cyan-400",
} as const;

/**
 * Stat cards — solid semantic backgrounds for management pages
 * Light mode: colored background with white text
 * Dark mode: darker semantic background with light text
 */
export const statCard = {
  success:
    "min-w-0 overflow-hidden border-emerald-600 bg-emerald-600 dark:border-emerald-700 dark:bg-emerald-900",
  progress:
    "min-w-0 overflow-hidden border-blue-600 bg-blue-600 dark:border-blue-700 dark:bg-blue-900",
  warning:
    "min-w-0 overflow-hidden border-amber-500 bg-amber-500 dark:border-amber-700 dark:bg-amber-900",
  error:
    "min-w-0 overflow-hidden border-red-600 bg-red-600 dark:border-red-700 dark:bg-red-900",
  neutral:
    "min-w-0 overflow-hidden border-slate-500 bg-slate-500 dark:border-slate-600 dark:bg-slate-800",
  summary:
    "min-w-0 overflow-hidden border-slate-700 bg-slate-700 dark:border-slate-600 dark:bg-slate-800",
  info:
    "min-w-0 overflow-hidden border-cyan-600 bg-cyan-600 dark:border-cyan-700 dark:bg-cyan-900",
} as const;

/**
 * Stat card value text — white on colored backgrounds
 */
export const statValue = {
  success:
    "text-white dark:text-emerald-100",
  progress:
    "text-white dark:text-blue-100",
  warning:
    "text-white dark:text-amber-100",
  error:
    "text-white dark:text-red-100",
  neutral:
    "text-white dark:text-slate-100",
  summary:
    "text-white dark:text-slate-100",
  info:
    "text-white dark:text-cyan-100",
} as const;

/**
 * Stat card label text — slightly transparent white
 */
export const statLabel = {
  success:
    "text-emerald-100 dark:text-emerald-300",
  progress:
    "text-blue-100 dark:text-blue-300",
  warning:
    "text-amber-100 dark:text-amber-300",
  error:
    "text-red-100 dark:text-red-300",
  neutral:
    "text-slate-200 dark:text-slate-300",
  summary:
    "text-slate-200 dark:text-slate-300",
  info:
    "text-cyan-100 dark:text-cyan-300",
} as const;

/**
 * Widget elevation — subtle visual separation for small widgets inside larger cards
 * Light mode: slate-50 background with slate-100 border
 * Dark mode: slate-800 background with slate-700 border + subtle shadow
 */
export const widget = {
  elevated:
    "min-w-0 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:shadow-lg dark:shadow-black/20",
  flat:
    "min-w-0 bg-slate-50 dark:bg-slate-800",
  info:
    "min-w-0 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:shadow-lg dark:shadow-black/20",
} as const;

/**
 * Hero cards — main summary/stat cards at the top of pages
 * Light mode: white background with slate-200 border
 * Dark mode: slate-900 background with subtle emerald accent border
 */
export const heroCard =
  "min-w-0 overflow-hidden bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-emerald-500/20 dark:shadow-lg dark:shadow-black/20 transition-colors";

/**
 * Hero summary — dark summary cards (used for main dashboard stats)
 * Both modes: dark background with white text
 * Dark mode: subtle emerald accent border for separation
 */
export const heroSummary =
  "min-w-0 overflow-hidden bg-slate-950 text-white border border-transparent dark:border-emerald-500/20 shadow-2xl shadow-slate-950/20 transition-colors";

/**
 * Back link — navigation link with subtle hover state
 * Light mode: emerald text, emerald-50 bg on hover, rounded, subtle shadow
 * Dark mode: emerald-400 text, emerald-950 bg on hover
 */
export const backLink =
  "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-emerald-800 transition-all duration-150 hover:bg-emerald-50 hover:text-emerald-950 hover:shadow-sm dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300";
