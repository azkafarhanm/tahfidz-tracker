"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type SemesterPeriodOption = {
  label: string;
  value: string;
};

type AttendanceSemesterFilterProps = {
  availablePeriods: SemesterPeriodOption[];
  defaultActiveSemester: SemesterPeriodOption;
  label: string;
  selectedPeriod: SemesterPeriodOption;
  selectedPeriodLabel: string;
};

export default function AttendanceSemesterFilter({
  availablePeriods,
  defaultActiveSemester,
  label,
  selectedPeriod,
  selectedPeriodLabel,
}: AttendanceSemesterFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentValue = selectedPeriod.value;

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
        aria-label={`${label}: ${selectedPeriodLabel}`}
        className={`min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${
          isPending ? "cursor-wait opacity-70" : ""
        }`}
        disabled={isPending}
        data-default-period={defaultActiveSemester.value}
        onChange={(event) => handleChange(event.target.value)}
        value={currentValue}
      >
        {availablePeriods.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
