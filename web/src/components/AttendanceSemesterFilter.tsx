"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type AttendanceSemesterFilterProps = {
  currentValue: string;
  label: string;
  options: { label: string; value: string }[];
};

export default function AttendanceSemesterFilter({
  currentValue,
  label,
  options,
}: AttendanceSemesterFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    if (value === currentValue) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("attendancePeriod", value);
    startTransition(() => {
      router.push(`/reports?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
      <span className="shrink-0">{label}</span>
      <select
        aria-busy={isPending}
        className={`min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${
          isPending ? "cursor-wait opacity-70" : ""
        }`}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        value={currentValue}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
