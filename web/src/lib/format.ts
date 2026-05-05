import {
  Home as HomeIcon,
  PlusCircle,
  UserCircle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  HalaqahLevel,
  RecordStatus,
} from "@/generated/prisma-next/enums";

export const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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
  return `${surah} ${fromAyah}-${toAyah}`;
}

export function formatClassSummary(student: {
  academicClass: { name: string } | null;
  classGroup: { name: string; level: HalaqahLevel };
}) {
  const academicClassName = student.academicClass?.name ?? null;
  const halaqahLabel = `${student.classGroup.name} (${halaqahLevelLabels[student.classGroup.level]})`;

  const classSummary = academicClassName
    ? `${academicClassName} · ${halaqahLabel}`
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

export function nowTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

const navItems: Omit<NavItem, "active">[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Santri", href: "/students", icon: Users },
  { label: "Catat", href: "/quick-log", icon: PlusCircle },
  { label: "Profil", href: "/profile", icon: UserCircle },
];

export function getNavigation(currentPath: string): NavItem[] {
  return navItems.map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));
}
