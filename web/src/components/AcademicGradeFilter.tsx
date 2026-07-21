"use client";

import WorkflowContextLink from "@/components/WorkflowContextLink";
import { useEffect, useState } from "react";

type Grade = 7 | 8 | 9;

type AcademicGradeFilterProps = {
  counts: Record<Grade, number>;
  href: string;
  selectedGrade?: Grade;
  totalCount: number;
};

const grades: Grade[] = [7, 8, 9];

function chipClassName(isSelected: boolean) {
  return `inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
    isSelected
      ? "bg-emerald-900 text-white"
      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;
}

export default function AcademicGradeFilter({
  counts,
  href,
  selectedGrade,
  totalCount,
}: AcademicGradeFilterProps) {
  const [displayedGrade, setDisplayedGrade] = useState(selectedGrade);

  useEffect(() => {
    setDisplayedGrade(selectedGrade);
  }, [selectedGrade]);

  function buildHref(grade?: Grade) {
    const url = new URL(href, "http://localhost");
    url.searchParams.delete("page");
    if (grade) {
      url.searchParams.set("grade", String(grade));
    } else {
      url.searchParams.delete("grade");
    }
    const search = url.searchParams.toString();
    return search ? `${url.pathname}?${search}` : url.pathname;
  }

  return (
    <section
      aria-label="Filter kelas"
      className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
    >
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
        Filter Kelas
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Pilih kelas yang ingin ditampilkan.
      </p>
      <div className="mt-4 inline-flex flex-wrap rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <WorkflowContextLink
          className={chipClassName(displayedGrade === undefined)}
          contextParams={{ grade: null, page: null }}
          href={buildHref()}
          onNavigate={() => setDisplayedGrade(undefined)}
          preserveCurrentScrollContext
          scroll={false}
        >
          Semua ({totalCount})
        </WorkflowContextLink>
        {grades.map((grade) => (
          <WorkflowContextLink
            className={chipClassName(displayedGrade === grade)}
            contextParams={{ grade: String(grade), page: null }}
            href={buildHref(grade)}
            key={grade}
            onNavigate={() => setDisplayedGrade(grade)}
            preserveCurrentScrollContext
            scroll={false}
          >
            {grade} ({counts[grade]})
          </WorkflowContextLink>
        ))}
      </div>
    </section>
  );
}
