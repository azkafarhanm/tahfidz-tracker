"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AcademicYearStatus, Semester } from "@/generated/prisma-next/enums";
import {
  getAcademicFormativeTimeline,
  getSemesterForDate,
} from "@/lib/academic-year";
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
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true, status: AcademicYearStatus.ACTIVE },
    select: { year: true },
  });
  if (activeYear) {
    await getAcademicFormativeTimeline(activeYear.year, currentSemester);
  }
  const years = await prisma.academicYear.findMany({
    orderBy: { year: "desc" },
    include: {
      formativeMeetings: {
        where: { semester: currentSemester },
        orderBy: { meetingNumber: "asc" },
      },
    },
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
        formativeMeetingTimeline: year.formativeMeetings.map((meeting) => ({
          meetingNumber: meeting.meetingNumber,
          meetingDate: meeting.meetingDate.toISOString().slice(0, 10),
        })),
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
      formativeMeetings: {
        create: [
          {
            semester: Semester.GANJIL,
            meetingNumber: 1,
            meetingDate: startDate,
          },
          {
            semester: Semester.GENAP,
            meetingNumber: 1,
            meetingDate: new Date(
              Date.UTC(Number.parseInt(year.split("/")[1], 10), 0, 1),
            ),
          },
        ],
      },
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

export async function resetFormativeMeeting(yearId: string, formData: FormData) {
  await requireAdminScope();
  const t = await getTranslations("AdminAcademicYear");
  const semester = getSemesterForDate(new Date());
  const year = await prisma.academicYear.findUnique({
    where: { id: yearId },
    select: {
      id: true,
      isActive: true,
      status: true,
    },
  });

  if (!year) {
    redirectWithMessage("error", t("yearNotFound"));
    return;
  }

  if (!year.isActive || year.status !== AcademicYearStatus.ACTIVE) {
    redirectWithMessage("error", t("formativeMeetingActiveYearRequired"));
    return;
  }

  const meetingDateRaw = readString(formData, "meetingDate");
  const meetingDate = parseMeetingDate(meetingDateRaw);
  if (!meetingDate) {
    redirectWithMessage("error", t("formativeMeetingDateInvalid"));
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.formativeMeeting.deleteMany({
      where: { academicYearId: year.id, semester },
    });

    await tx.formativeMeeting.create({
      data: {
        academicYearId: year.id,
        semester,
        meetingNumber: 1,
        meetingDate,
      },
    });
  });

  revalidateAcademicYearPaths();
  redirectWithMessage(
    "success",
    t("formativeMeetingResetSuccess"),
  );
}

function parseMeetingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}
