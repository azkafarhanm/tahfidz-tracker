"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender, HalaqahLevel } from "@/generated/prisma-next/enums";
import {
  createFailFn,
  readOptionalString,
  readString,
} from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

const validGenders = new Set<string>(Object.values(Gender));
const validLevels = new Set<string>(Object.values(HalaqahLevel));

const levelLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export async function createTeacherStudent(formData: FormData) {
  const { teacherId, session } = await requireSessionScope();

  if (!teacherId) {
    redirect("/students?error=Hanya+guru+yang+dapat+menambah+santri.");
  }

  const fail = createFailFn("/students/new");

  const fullName = readString(formData, "fullName");
  const classGroupId = readString(formData, "classGroupId");
  const halaqahLevel = readString(formData, "halaqahLevel");
  const gradeRaw = readString(formData, "grade");
  const grade = gradeRaw ? parseInt(gradeRaw, 10) : 0;
  const academicClassId = readOptionalString(formData, "academicClassId");
  const gender = readString(formData, "gender");
  const joinDate = readString(formData, "joinDate");
  const notes = readOptionalString(formData, "notes");

  if (!fullName || fullName.length > 120) {
    fail("Nama santri wajib diisi dan maksimal 120 karakter.", {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!halaqahLevel || !validLevels.has(halaqahLevel)) {
    fail("Level halaqah wajib dipilih.", {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (!grade || grade < 7 || grade > 9) {
    fail("Kelas wajib dipilih.", {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  if (gender && !validGenders.has(gender)) {
    fail("Jenis kelamin tidak valid.", {
      fullName,
      gender,
      joinDate,
      notes: notes ?? "",
    });
  }

  let resolvedClassGroupId = classGroupId;

  if (!resolvedClassGroupId) {
    const level = halaqahLevel as HalaqahLevel;

    const existing = await prisma.classGroup.findFirst({
      where: { teacherId, grade, isActive: true },
    });

    if (existing) {
      resolvedClassGroupId = existing.id;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { fullName: true },
      });

      const newClassGroup = await prisma.classGroup.create({
        data: {
          teacherId,
          name: `${teacher?.fullName ?? "Halaqah"} - Kelas ${grade}`,
          level,
          grade,
          academicYear: "2025/2026",
          isActive: true,
        },
      });

      resolvedClassGroupId = newClassGroup.id;
    }
  }

  await prisma.student.create({
    data: {
      teacherId,
      classGroupId: resolvedClassGroupId,
      academicClassId: academicClassId || null,
      fullName,
      gender: (gender as Gender) || null,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      isActive: true,
      notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/students");
  redirect(`/students?success=Santri ${fullName} berhasil ditambahkan.`);
}
