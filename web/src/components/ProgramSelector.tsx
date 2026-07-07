"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useTransition } from "react";
import {
  markScopedNavigationContext,
  mergeVisibleSearchFormContext,
  readScopedNavigationContext,
} from "@/hooks/useNavigationContext";

type ProgramSelectorProps = {
  programs: string[];
  programTypeLabels: Record<string, string>;
  currentProgramType: string;
  isolateParamsByProgram?: string[];
  isolateScopeKey?: string;
  isolateScopeSuffix?: string;
};

export default function ProgramSelector({
  programs,
  programTypeLabels,
  currentProgramType,
  isolateParamsByProgram = [],
  isolateScopeKey = "programType",
  isolateScopeSuffix,
}: ProgramSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchParamString = searchParams.toString();
  const shouldIsolateParams = isolateParamsByProgram.length > 0;
  const scopedValue = useCallback((value: string) => (
    isolateScopeSuffix ? `${value}:${isolateScopeSuffix}` : value
  ), [isolateScopeSuffix]);

  const buildHref = useCallback((value: string) => {
    const params = new URLSearchParams(searchParamString);
    if (value) {
      params.set("programType", value);
    } else {
      params.delete("programType");
    }
    if (shouldIsolateParams) {
      const storedContext = readScopedNavigationContext(
        pathname,
        isolateScopeKey,
        scopedValue(value),
      );
      const storedParams = storedContext
        ? new URLSearchParams(storedContext)
        : null;

      for (const key of isolateParamsByProgram) {
        const storedValue = storedParams?.get(key);
        if (storedValue) {
          params.set(key, storedValue);
        } else {
          params.delete(key);
        }
      }
    }
    const nextSearch = params.toString();
    return nextSearch ? `${pathname}?${nextSearch}` : pathname;
  }, [isolateParamsByProgram, isolateScopeKey, pathname, scopedValue, searchParamString, shouldIsolateParams]);

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

    if (shouldIsolateParams) {
      const outgoingParams = new URLSearchParams(
        mergeVisibleSearchFormContext(searchParamString),
      );
      const scopedParams = new URLSearchParams();
      for (const key of isolateParamsByProgram) {
        const scopedValue = outgoingParams.get(key);
        if (scopedValue) scopedParams.set(key, scopedValue);
      }
      markScopedNavigationContext(
        pathname,
        isolateScopeKey,
        scopedValue(currentProgramType),
        scopedParams.toString(),
      );
    }

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
