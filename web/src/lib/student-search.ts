import type { ProgramType } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { buildStudentSearchWhere } from "@/lib/search";

export type ClassLevelMatch = {
  classLevel: number;
  count: number;
};

/**
 * Counts search matches in the *other* class levels of the active program.
 *
 * Search stays scoped to the active class tab, which means looking for a
 * santri while the wrong tab is selected yields an empty list. This powers the
 * "also found in Kelas 7" hint shown in that case. Program type is kept fixed:
 * switching program is a much larger context change than switching tabs.
 */
export async function countStudentMatchesByClassLevel({
  academicYear,
  excludeClassLevel,
  programType,
  query,
  teacherId,
}: {
  academicYear: string;
  excludeClassLevel?: number;
  programType?: ProgramType;
  query: string;
  teacherId: string | null;
}): Promise<ClassLevelMatch[]> {
  const searchWhere = buildStudentSearchWhere(query);
  if (!("OR" in searchWhere)) {
    return [];
  }

  const grouped = await prisma.student.groupBy({
    by: ["classGroupId"],
    where: {
      ...(teacherId ? { teacherId } : {}),
      isActive: true,
      classGroup: {
        academicYear,
        ...(programType ? { programType } : {}),
        ...(excludeClassLevel ? { grade: { not: excludeClassLevel } } : {}),
      },
      ...searchWhere,
    },
    _count: { _all: true },
  });

  if (grouped.length === 0) {
    return [];
  }

  const classGroups = await prisma.classGroup.findMany({
    where: { id: { in: grouped.map((row) => row.classGroupId) } },
    select: { id: true, grade: true },
  });
  const gradeById = new Map(classGroups.map((group) => [group.id, group.grade]));

  const countByLevel = new Map<number, number>();
  for (const row of grouped) {
    const grade = gradeById.get(row.classGroupId);
    if (grade === undefined) {
      continue;
    }
    countByLevel.set(grade, (countByLevel.get(grade) ?? 0) + row._count._all);
  }

  return [...countByLevel.entries()]
    .map(([classLevel, count]) => ({ classLevel, count }))
    .sort((left, right) => left.classLevel - right.classLevel);
}
