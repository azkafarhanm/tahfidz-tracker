import { Semester } from "@/generated/prisma-next/enums";
import { prisma } from "@/lib/prisma";
import { isSemesterValue } from "@/lib/summative";

export const FORMATIVE_VIEW_COOKIE = "tf_formative_view";
export const SUMMATIVE_VIEW_COOKIE = "tf_summative_view";

type GradingViewPreference = {
  semester?: Semester;
  classLevel?: number;
};

export function parseStoredGradingView(
  rawValue?: string | null,
): GradingViewPreference {
  if (!rawValue) {
    return {};
  }

  const decoded = decodeURIComponent(rawValue);
  const params = new URLSearchParams(decoded);
  const semesterValue = params.get("semester");
  const classLevelValue = params.get("classLevel");

  return {
    semester: semesterValue && isSemesterValue(semesterValue) ? semesterValue : undefined,
    classLevel: parseClassLevelValue(classLevelValue),
  };
}

export function parseClassLevelValue(value?: string | null): number | undefined {
  const parsed = Number.parseInt(value ?? "", 10);
  return [7, 8, 9].includes(parsed) ? parsed : undefined;
}

export async function getPreferredTeacherClassLevel(teacherId: string) {
  const students = await prisma.student.findMany({
    where: {
      teacherId,
      isActive: true,
    },
    select: {
      classGroup: {
        select: {
          grade: true,
        },
      },
    },
  });

  const grades = new Set(students.map((student) => student.classGroup.grade));
  return [7, 8, 9].find((grade) => grades.has(grade)) ?? 7;
}
