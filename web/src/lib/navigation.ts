import {
  BarChart3,
  BookOpen,
  BookText,
  Calendar,
  ClipboardList,
  GraduationCap,
  Home,
  PlusCircle,
  ShieldCheck,
  UserCircle,
  UserRound,
  Users,
} from "lucide-react";

export const navigationIcons = {
  Home,
  Users,
  PlusCircle,
  BookText,
  ClipboardList,
  UserCircle,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  UserRound,
  BarChart3,
  Calendar,
} as const;

export const teacherNavigationItems = [
  { key: "navDashboard", href: "/", iconKey: "Home" },
  { key: "navSantri", href: "/students", iconKey: "Users" },
  { key: "navCatatCepat", href: "/quick-log", iconKey: "PlusCircle" },
  { key: "navFormatif", href: "/formative", iconKey: "BookText" },
  { key: "navSumatif", href: "/summative", iconKey: "ClipboardList" },
  { key: "navProfil", href: "/profile", iconKey: "UserCircle" },
] as const;

export const adminNavigationItems = [
  { key: "navDashboard", href: "/", iconKey: "Home" },
  { key: "roleAdmin", href: "/admin", iconKey: "ShieldCheck" },
  { key: "navGuru", href: "/admin/teachers", iconKey: "Users" },
  { key: "navKelas", href: "/admin/classes", iconKey: "GraduationCap" },
  { key: "navTahunAjaran", href: "/admin/academic-years", iconKey: "Calendar" },
  { key: "navHalaqah", href: "/admin/halaqah", iconKey: "BookOpen" },
  { key: "navSantri", href: "/admin/students", iconKey: "UserRound" },
  { key: "navFormatif", href: "/formative", iconKey: "BookText" },
  { key: "navSumatif", href: "/summative", iconKey: "ClipboardList" },
  { key: "navLaporan", href: "/admin/reports", iconKey: "BarChart3" },
  { key: "navProfil", href: "/profile", iconKey: "UserCircle" },
] as const;

export type NavigationItem =
  | (typeof teacherNavigationItems)[number]
  | (typeof adminNavigationItems)[number];

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
