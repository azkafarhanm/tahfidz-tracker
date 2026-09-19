import Link from "next/link";
import type { ClassLevelMatch } from "@/lib/student-search";

type GradingSearchEmptyStateProps = {
  description: string;
  heading: string;
  /** Labelled link per class level that still has matches, e.g. "2 santri di Kelas 7". */
  otherClassLinks: Array<{
    href: string;
    label: string;
    match: ClassLevelMatch;
  }>;
};

/**
 * Empty state for the formative and summative lists.
 *
 * Search stays inside the selected class tab, so a teacher looking for a santri
 * from the wrong tab would otherwise just see "no results" with no way of
 * knowing the santri exists one tab over. The links point at the class that
 * does hold a match, carrying the query along.
 */
export default function GradingSearchEmptyState({
  description,
  heading,
  otherClassLinks,
}: GradingSearchEmptyStateProps) {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
      <p className="font-medium">{heading}</p>
      <p className="mt-1">{description}</p>
      {otherClassLinks.length > 0 ? (
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {otherClassLinks.map((link) => (
            <li key={link.match.classLevel}>
              <Link
                className="inline-flex min-h-10 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:border-emerald-700"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
