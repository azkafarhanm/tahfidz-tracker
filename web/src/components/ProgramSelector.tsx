"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useTransition } from "react";

type ProgramSelectorProps = {
  programs: string[];
  programTypeLabels: Record<string, string>;
  currentProgramType: string;
};

export default function ProgramSelector({
  programs,
  programTypeLabels,
  currentProgramType,
}: ProgramSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchParamString = searchParams.toString();

  const buildHref = useCallback((value: string) => {
    const params = new URLSearchParams(searchParamString);
    if (value) {
      params.set("programType", value);
    } else {
      params.delete("programType");
    }
    const nextSearch = params.toString();
    return nextSearch ? `${pathname}?${nextSearch}` : pathname;
  }, [pathname, searchParamString]);

  const prefetchHrefs = useMemo(
    () => programs.map((program) => buildHref(program)),
    [buildHref, programs],
  );

  useEffect(() => {
    for (const href of prefetchHrefs) {
      router.prefetch(href);
    }
  }, [prefetchHrefs, router]);

  function handleChange(value: string) {
    if (value === currentProgramType) return;

    const href = buildHref(value);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  if (programs.length <= 1) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor="program-type-selector"
        className="shrink-0 text-sm font-medium text-slate-600 dark:text-slate-400"
      >
        Program:
      </label>
      <select
        id="program-type-selector"
        value={currentProgramType}
        onChange={(e) => handleChange(e.target.value)}
        aria-busy={isPending}
        disabled={isPending}
        className={`min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${
          isPending ? "cursor-wait opacity-70" : ""
        }`}
      >
        {programs.map((p) => (
          <option key={p} value={p}>
            {programTypeLabels[p] ?? p}
          </option>
        ))}
      </select>
    </div>
  );
}
