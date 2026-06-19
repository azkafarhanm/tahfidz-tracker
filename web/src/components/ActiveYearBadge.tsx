import { getActiveAcademicYear } from "@/lib/academic-year";
import { Calendar } from "lucide-react";

export default async function ActiveYearBadge() {
  const academicYear = await getActiveAcademicYear();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      <Calendar aria-hidden="true" size={12} strokeWidth={2.2} />
      {academicYear}
    </span>
  );
}
