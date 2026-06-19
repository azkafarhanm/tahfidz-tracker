"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { HalaqahLevel } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { invalidateStudentRelatedCaches } from "@/lib/cache";
import { getActiveAcademicYear } from "@/lib/academic-year";
import { halaqahLevelLabels } from "@/lib/format";

const validLevels = new Set<string>(Object.values(HalaqahLevel));

export async function updateHalaqahLevel(classGroupId: string, newLevel: string) {
  const { teacherId } = await requireSessionScope();
  const t = await getTranslations("Validation");

  if (!teacherId) {
    return { ok: false as const, error: t("teacherOnly") };
  }

  if (!validLevels.has(newLevel)) {
    return { ok: false as const, error: t("halaqahLevelInvalid") };
  }

  // Verify ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: {
      id: classGroupId,
      teacherId,
      isActive: true,
    },
    select: { id: true, grade: true, level: true, programType: true },
  });

  if (!classGroup) {
    return { ok: false as const, error: t("halaqahNotFound") };
  }

  // No change needed
  if (classGroup.level === newLevel) {
    return {
      ok: true as const,
      message: t("halaqahLevelUnchanged"),
      level: classGroup.level,
      levelLabel: halaqahLevelLabels[classGroup.level],
    };
  }

  // Check uniqueness: another active halaqah with same teacher+grade+level+programType
  const academicYear = await getActiveAcademicYear();
  const conflicting = await prisma.classGroup.findFirst({
    where: {
      teacherId,
      academicYear,
      grade: classGroup.grade,
      level: newLevel as HalaqahLevel,
      programType: classGroup.programType,
      isActive: true,
      id: { not: classGroupId },
    },
    select: { id: true },
  });

  if (conflicting) {
    return {
      ok: false as const,
      error: t("halaqahLevelConflict", {
        grade: classGroup.grade,
        level: halaqahLevelLabels[newLevel as HalaqahLevel],
      }),
    };
  }

  // Update level
  const updatedClassGroup = await prisma.classGroup.update({
    where: { id: classGroupId },
    data: { level: newLevel as HalaqahLevel },
    select: { id: true, grade: true, level: true, programType: true },
  });

  revalidatePath("/");
  revalidatePath("/students");
  invalidateStudentRelatedCaches();

  return {
    ok: true as const,
    message: t("halaqahLevelUpdated", {
      level: halaqahLevelLabels[updatedClassGroup.level],
    }),
    level: updatedClassGroup.level,
    levelLabel: halaqahLevelLabels[updatedClassGroup.level],
  };
}
