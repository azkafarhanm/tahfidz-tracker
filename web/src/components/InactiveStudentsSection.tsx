"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import InactiveStudentRow from "@/components/InactiveStudentRow";
import { dispatchStudentChange } from "@/lib/optimistic-events";

type InactiveStudent = {
  activeTargetCount: number;
  classSummary: string;
  fullName: string;
  id: string;
};

type InactiveStudentsSectionProps = {
  emptyMessage?: string;
  showHeading?: boolean;
  students: InactiveStudent[];
};

export default function InactiveStudentsSection({
  emptyMessage,
  showHeading = true,
  students,
}: InactiveStudentsSectionProps) {
  const t = useTranslations("Students");
  const router = useRouter();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const refreshInactiveStudents = () => router.refresh();

    refreshInactiveStudents();
    window.addEventListener("focus", refreshInactiveStudents);
    window.addEventListener("pageshow", refreshInactiveStudents);

    return () => {
      window.removeEventListener("focus", refreshInactiveStudents);
      window.removeEventListener("pageshow", refreshInactiveStudents);
    };
  }, [router]);

  const visibleStudents = useMemo(
    () => students.filter((student) => !hiddenIds.has(student.id)),
    [hiddenIds, students],
  );

  if (visibleStudents.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <section className={showHeading ? "mt-6" : "mt-3"}>
      {showHeading ? (
        <>
          <h2 className="text-lg font-semibold">{t("inactiveHeading")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("inactiveDescription")}
          </p>
        </>
      ) : null}
      <div className={showHeading ? "mt-3 space-y-3" : "space-y-3"}>
        {visibleStudents.map((student) => (
          <InactiveStudentRow
            activeTargetCount={student.activeTargetCount}
            classSummary={student.classSummary}
            error={errors[student.id] ?? null}
            fullName={student.fullName}
            id={student.id}
            key={student.id}
            onDeleteError={(message) => {
              setHiddenIds((current) => {
                const next = new Set(current);
                next.delete(student.id);
                return next;
              });
              setErrors((current) => ({ ...current, [student.id]: message }));
            }}
            onDeleteRollback={() => {
              setHiddenIds((current) => {
                const next = new Set(current);
                next.delete(student.id);
                return next;
              });
              dispatchStudentChange(0, 1);
            }}
            onDeleteStart={() => {
              setErrors((current) => {
                const next = { ...current };
                delete next[student.id];
                return next;
              });
              setHiddenIds((current) => new Set(current).add(student.id));
              dispatchStudentChange(0, -1);
            }}
            onReactivateSuccess={() => {
              setHiddenIds((current) => new Set(current).add(student.id));
            }}
            onReactivateRollback={() => {
              setHiddenIds((current) => {
                const next = new Set(current);
                next.delete(student.id);
                return next;
              });
            }}
          />
        ))}
        {visibleStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
