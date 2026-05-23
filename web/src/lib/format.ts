import {
  HalaqahLevel,
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
  });
}

export function getTimeFormatter(locale?: string) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const statusLabels: Record<RecordStatus, string> = {
  [RecordStatus.LANCAR]: "Lancar",
  [RecordStatus.CUKUP]: "Cukup",
  [RecordStatus.PERLU_MUROJAAH]: "Perlu murojaah",
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

export function formatRange(surah: string, fromAyah: number, toAyah: number) {
  const juz = getJuzLabel(surah, fromAyah, toAyah);
  return `${surah} ${fromAyah}-${toAyah}${juz ? ` - ${juz}` : ""}`;
}

export function formatClassSummary(student: {
  academicClass: { name: string } | null;
  classGroup: { name: string; level: HalaqahLevel };
}) {
  const academicClassName = student.academicClass?.name ?? null;
  const halaqahLabel = `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`;

  const classSummary = academicClassName
    ? `${academicClassName} - ${halaqahLabel}`
    : halaqahLabel;

  return {
    academicClassName: academicClassName ?? "Kelas belum diisi",
    halaqahName: student.classGroup.name,
    halaqahLevel: halaqahLevelLabels[student.classGroup.level],
    classSummary,
  };
}

export function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
