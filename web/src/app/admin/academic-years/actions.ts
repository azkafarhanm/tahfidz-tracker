"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AcademicYearStatus, Semester } from "@/generated/prisma-next/enums";
import { getSemesterForDate } from "@/lib/academic-year";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { invalidateCache } from "@/lib/cache";
import { readString } from "@/lib/form-helpers";

function revalidateAcademicYearPaths() {
  revalidatePath("/admin/academic-years");
  invalidateCache("academic-year");
}

function redirectWithMessage(type: "success" | "error", message: string) {
  redirect(`/admin/academic-years?${type}=${encodeURIComponent(message)}`);
}

export async function getAdminAcademicYearsData() {
  const currentSemester = getSemesterForDate(new Date());
  const years = await prisma.academicYear.findMany({
    orderBy: { year: "desc" },
  });

  // Get counts for each year
  const yearsWithCounts = await Promise.all(
    years.map(async (year) => {
      const [studentCount, classGroupCount] = await Promise.all([
        prisma.student.count({
          where: { classGroup: { academicYear: year.year } },
        }),
        prisma.classGroup.count({
          where: { academicYear: year.year },
        }),
      ]);
      return {
        id: year.id,
        year: year.year,
        startDate: year.startDate.toISOString().slice(0, 10),
        endDate: year.endDate.toISOString().slice(0, 10),
        isActive: year.isActive,
        status: year.status,
        currentSemester,
        formativeMeeting:
          currentSemester === Semester.GANJIL
            ? year.formativeMeetingGanjil
            : year.formativeMeetingGenap,
        studentCount,
        classGroupCount,
      };
    }),
  );

  return yearsWithCounts;
}

export async function createAcademicYear(formData: FormData) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = readString(formData, "year");
  const startDateRaw = readString(formData, "startDate");
  const endDateRaw = readString(formData, "endDate");

  if (!year || !/^\d{4}\/\d{4}$/.test(year)) {
    redirectWithMessage("error", t("yearInvalid"));
    return;
  }

  if (!startDateRaw || !endDateRaw) {
    redirectWithMessage("error", t("datesRequired"));
    return;
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    redirectWithMessage("error", t("datesInvalid"));
    return;
  }

  if (startDate >= endDate) {
    redirectWithMessage("error", t("startDateBeforeEnd"));
    return;
  }

  const existing = await prisma.academicYear.findUnique({
    where: { year },
  });

  if (existing) {
    redirectWithMessage("error", t("yearDuplicate"));
    return;
  }

  await prisma.academicYear.create({
    data: {
      year,
      startDate,
      endDate,
      isActive: false,
    },
  });

  revalidateAcademicYearPaths();
  redirectWithMessage("success", t("yearCreated"));
}

export async function setActiveAcademicYear(yearId: string) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");

  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
  });

  if (!year) {
    redirectWithMessage("error", t("yearNotFound"));
    return;
  }

  if (year.isActive) {
    redirectWithMessage("success", t("yearAlreadyActive"));
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    await tx.academicYear.update({
      where: { id: yearId },
      data: { isActive: true },
    });
  });

  revalidateAcademicYearPaths();
  redirectWithMessage("success", t("yearActivated", { year: year.year }));
}

export async function advanceFormativeMeeting(yearId: string) {
  await updateFormativeMeeting(yearId, "advance");
}

export async function resetFormativeMeeting(yearId: string) {
  await updateFormativeMeeting(yearId, "reset");
}

async function updateFormativeMeeting(
  yearId: string,
  operation: "advance" | "reset",
) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");
  const semester = getSemesterForDate(new Date());
  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
    select: { id: true, isActive: true, status: true },
  });

  if (!year) {
    redirectWithMessage("error", t("yearNotFound"));
    return;
  }

  if (!year.isActive || year.status !== AcademicYearStatus.ACTIVE) {
    redirectWithMessage("error", t("formativeMeetingActiveYearRequired"));
    return;
  }

  const value = operation === "advance" ? { increment: 1 } : 1;
  const updated = await prisma.academicYear.update({
    where: { id: year.id },
    data:
      semester === Semester.GANJIL
        ? { formativeMeetingGanjil: value }
        : { formativeMeetingGenap: value },
    select: {
      formativeMeetingGanjil: true,
      formativeMeetingGenap: true,
    },
  });
  const currentMeeting =
    semester === Semester.GANJIL
      ? updated.formativeMeetingGanjil
      : updated.formativeMeetingGenap;

  revalidateAcademicYearPaths();
  redirectWithMessage(
    "success",
    operation === "advance"
      ? t("formativeMeetingAdvanced", { meeting: currentMeeting })
      : t("formativeMeetingResetSuccess"),
  );
}
