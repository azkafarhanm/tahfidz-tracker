import {
  BarChart3,
  BookOpen,
  BookText,
  ClipboardList,
  GraduationCap,
  Home,
  PlusCircle,
  ShieldCheck,
  UserCircle,
  UserRound,
  Users,
} from "lucide-react";

export const teacherNavigationItems = [
  { key: "navDashboard", href: "/", icon: Home },
  { key: "navSantri", href: "/students", icon: Users },
  { key: "navCatatCepat", href: "/quick-log", icon: PlusCircle },
  { key: "navFormatif", href: "/formative", icon: BookText },
  { key: "navSumatif", href: "/summative", icon: ClipboardList },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;

export const adminNavigationItems = [
  { key: "navDashboard", href: "/", icon: Home },
  { key: "roleAdmin", href: "/admin", icon: ShieldCheck },
  { key: "navGuru", href: "/admin/teachers", icon: Users },
  { key: "navKelas", href: "/admin/classes", icon: GraduationCap },
  { key: "navHalaqah", href: "/admin/halaqah", icon: BookOpen },
  { key: "navSantri", href: "/admin/students", icon: UserRound },
  { key: "navFormatif", href: "/formative", icon: BookText },
  { key: "navSumatif", href: "/summative", icon: ClipboardList },
  { key: "navLaporan", href: "/admin/reports", icon: BarChart3 },
  { key: "navProfil", href: "/profile", icon: UserCircle },
] as const;
