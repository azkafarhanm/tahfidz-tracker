"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import InactiveStudentRow from "@/components/InactiveStudentRow";

type InactiveStudent = {
  activeTargetCount: number;
  classSummary: string;
  fullName: string;
  id: string;
  summativeScoreCount: number;
  totalRecordCount: number;
};

type InactiveStudentsSectionProps = {
  students: InactiveStudent[];
};

export default function InactiveStudentsSection({
  students,
}: InactiveStudentsSectionProps) {
  const t = useTranslations("Students");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleStudents = useMemo(
    () => students.filter((student) => !hiddenIds.has(student.id)),
    [hiddenIds, students],
  );

  if (visibleStudents.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t("inactiveHeading")}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t("inactiveDescription")}
      </p>
      <div className="mt-3 space-y-3">
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
            onDeleteStart={() => {
              setErrors((current) => {
                const next = { ...current };
                delete next[student.id];
                return next;
              });
              setHiddenIds((current) => new Set(current).add(student.id));
            }}
            summativeScoreCount={student.summativeScoreCount}
            totalRecordCount={student.totalRecordCount}
          />
        ))}
      </div>
    </section>
  );
}
