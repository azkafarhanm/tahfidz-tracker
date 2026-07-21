type GradeClassGroup = {
  grade: number;
  levelKey: string;
  programType: string;
};

export function findClassGroupForGrade<T extends GradeClassGroup>(
  classGroups: T[],
  grade: string,
  programType: string,
): T | null {
  if (!grade) return null;

  return classGroups.find(
    (group) =>
      group.grade === Number(grade) && group.programType === programType,
  ) ?? null;
}

export function resolveLevelForGrade(
  classGroups: GradeClassGroup[],
  grade: string,
  programType: string,
): string {
  return findClassGroupForGrade(classGroups, grade, programType)?.levelKey ?? "";
}

export function resolveInitialHalaqahLevel(
  classGroups: GradeClassGroup[],
  grade: string,
  providedLevel: string,
  programType: string,
): string {
  if (providedLevel || programType !== "ACADEMIC") return providedLevel;
  return resolveLevelForGrade(classGroups, grade, programType);
}
