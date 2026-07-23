"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SegmentedLinkOption = {
  value: string;
  label: string;
  href: string;
};

type SegmentedLinkTabsProps = {
  ariaLabel: string;
  currentValue: string;
  options: SegmentedLinkOption[];
};

export default function SegmentedLinkTabs({
  ariaLabel,
  currentValue,
  options,
}: SegmentedLinkTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useState(currentValue);

  useEffect(() => {
    setOptimisticValue(currentValue);
  }, [currentValue]);

  const activeValue = useMemo(
    () => (isPending ? optimisticValue : currentValue),
    [currentValue, isPending, optimisticValue],
  );

  function prefetchOption(option: SegmentedLinkOption) {
    if (option.value !== currentValue) {
      router.prefetch(option.href);
    }
  }

  return (
    <div
      aria-busy={isPending}
      aria-label={ariaLabel}
      className="grid w-full min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <button
            key={option.value}
            className={`min-w-0 px-2 py-2 text-sm font-medium [overflow-wrap:anywhere] transition first:rounded-s-2xl last:rounded-e-2xl sm:px-4 ${
              isActive
                ? "bg-emerald-900 text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            } ${isPending && optimisticValue === option.value ? "opacity-90" : ""}`}
            disabled={isPending && optimisticValue === option.value}
            onClick={() => {
              if (option.value === currentValue) {
                return;
              }

              setOptimisticValue(option.value);
              startTransition(() => {
                router.replace(option.href, { scroll: false });
              });
            }}
            onMouseEnter={() => prefetchOption(option)}
            onFocus={() => prefetchOption(option)}
            role="tab"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
