"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Semester } from "@/generated/prisma-next/enums";
import { requireSessionScope } from "@/lib/session";
import {
  batchSaveSummativeScores,
  isSemesterValue,
  parseSemester,
} from "@/lib/summative";
import { getCurrentAcademicYear } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";

export async function saveSummativeScores(formData: FormData) {
  const { teacherId } = await requireSessionScope();
  if (!teacherId) redirect("/login");

  const t = await getTranslations("Validation");

  const semesterStr = formData.get("semester") as string;
  const academicYear = formData.get("academicYear") as string;
  const classLevel = formData.get("classLevel") as string;

  if (!semesterStr || !academicYear || !classLevel) {
    throw new Error(t("allFieldsRequired"));
  }

  if (!isSemesterValue(semesterStr)) {
    redirect("/summative");
  }

  const classLevelNumber = parseInt(classLevel, 10);
  if (![7, 8, 9].includes(classLevelNumber)) {
    redirect("/summative");
  }

  const semester: Semester = parseSemester(semesterStr);
  const year = academicYear || getCurrentAcademicYear();

  const entries: { studentId: string; surahId: string; score: number }[] = [];
  const keys = Array.from(formData.keys()).filter((k) => k.startsWith("score_"));

  const studentIds = new Set<string>();

  for (const key of keys) {
    const value = formData.get(key) as string;
    if (!value || value.trim() === "") continue;

    const score = parseInt(value, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error(t("scoreRange"));
    }

    const parts = key.replace("score_", "").split("__");
    if (parts.length !== 2) continue;

    const [studentId, surahId] = parts;
    entries.push({ studentId, surahId, score });
    studentIds.add(studentId);
  }

  if (entries.length === 0) {
    redirect(`/summative?semester=${semesterStr}&classLevel=${classLevel}`);
  }

  const ownedStudents = await prisma.student.findMany({
    where: {
      id: { in: Array.from(studentIds) },
      teacherId,
    },
    select: {
      id: true,
      classGroup: {
        select: {
          grade: true,
        },
      },
    },
  });

  if (
    ownedStudents.length !== studentIds.size ||
    ownedStudents.some((student) => student.classGroup.grade !== classLevelNumber)
  ) {
    throw new Error(t("unauthorized"));
  }

  const allowedTargetRows = await prisma.targetSurah.findMany({
    where: {
      classLevel: classLevelNumber,
      semester,
      academicYear: year,
    },
    select: {
      surahId: true,
    },
  });
  const allowedSurahIds = new Set(allowedTargetRows.map((target) => target.surahId));

  if (allowedSurahIds.size === 0) {
    redirect(`/summative?semester=${semesterStr}&classLevel=${classLevel}`);
  }

  if (entries.some((entry) => !allowedSurahIds.has(entry.surahId))) {
    throw new Error(t("unauthorized"));
  }

  await batchSaveSummativeScores(entries, semester, year);

  redirect(`/summative?semester=${semesterStr}&classLevel=${classLevel}&saved=1`);
}
