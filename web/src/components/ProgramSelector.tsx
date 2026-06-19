"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  if (programs.length <= 1) {
    return null;
  }

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("programType", value);
    } else {
      params.delete("programType");
    }
    router.push(`${pathname}?${params.toString()}`);
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
        className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
