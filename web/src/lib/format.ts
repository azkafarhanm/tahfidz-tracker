import {
  HalaqahLevel,
  ProgramType,
  RecordStatus,
} from "@/generated/prisma-next/enums";
import { getJuzLabel } from "@/lib/juz";

const localeMap: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
  ar: "ar-SA",
};

export function getLocaleTag(locale?: string) {
  return localeMap[locale ?? "id"] ?? "id-ID";
}

export function getDateFormatter(locale?: string) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function getTimeFormatter(locale?: string) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export const statusLabels: Record<RecordStatus, string> = {
  [RecordStatus.LANCAR]: "LANCAR",
  [RecordStatus.CUKUP]: "CUKUP",
  [RecordStatus.PERLU_MUROJAAH]: "PERLU MURAJA'AH",
};

export const recordStatusOptions = [
  { value: RecordStatus.LANCAR, label: statusLabels[RecordStatus.LANCAR] },
  { value: RecordStatus.CUKUP, label: statusLabels[RecordStatus.CUKUP] },
  {
    value: RecordStatus.PERLU_MUROJAAH,
    label: statusLabels[RecordStatus.PERLU_MUROJAAH],
  },
] as const;

export const halaqahLevelLabels: Record<HalaqahLevel, string> = {
  [HalaqahLevel.LOW]: "Low",
  [HalaqahLevel.MEDIUM]: "Medium",
  [HalaqahLevel.HIGH]: "High",
};

export const programTypeLabels: Record<ProgramType, string> = {
  [ProgramType.ACADEMIC]: "Akademik",
  [ProgramType.BOARDING]: "Boarding",
};

export const programTypeOptions = [
  { value: ProgramType.ACADEMIC, label: programTypeLabels[ProgramType.ACADEMIC] },
  { value: ProgramType.BOARDING, label: programTypeLabels[ProgramType.BOARDING] },
] as const;

export function formatRange(surah: string, fromAyah: number, toAyah: number) {
  const juz = getJuzLabel(surah, fromAyah, toAyah);
  return `${surah} ${fromAyah}-${toAyah}${juz ? ` - ${juz}` : ""}`;
}

export function formatClassSummary(student: {
  academicClass: { name: string } | null;
  classGroup: { name: string; level: HalaqahLevel; programType: ProgramType; grade: number };
}) {
  const academicClassName = student.academicClass?.name ?? null;
  const isBoarding = student.classGroup.programType === ProgramType.BOARDING;
  const halaqahLabel = isBoarding
    ? `${student.classGroup.grade} - ${student.classGroup.name}`
    : `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`;

  // Boarding: never show academic class in summary
  const classSummary = !isBoarding && academicClassName
    ? `${academicClassName} - ${halaqahLabel}`
    : halaqahLabel;

  return {
    academicClassName: isBoarding ? "" : (academicClassName ?? "Kelas belum diisi"),
    halaqahName: student.classGroup.name,
    halaqahLevel: isBoarding ? "" : halaqahLevelLabels[student.classGroup.level],
    classSummary,
    programType: student.classGroup.programType,
    isBoarding,
  };
}

export function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
