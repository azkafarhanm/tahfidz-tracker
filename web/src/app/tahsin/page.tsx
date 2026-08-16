import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireSessionScope } from "@/lib/session";
import { getTahsinStudents } from "@/lib/tahsin";
import TahsinQuickEntry from "./TahsinQuickEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TahsinPage() {
  const scope = await requireSessionScope();
  if (scope.isAdmin || !scope.teacherId) redirect("/");
  const students = await getTahsinStudents({ isAdmin: false, teacherId: scope.teacherId });
  return <AppShell currentPath="/tahsin" userName={scope.session.user.name} isAdmin={false}><header><p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Academic · Kelas 7</p><h1 className="mt-1 text-2xl font-semibold">Penilaian Tahsin</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Input cepat metode Ilman Wa Ruuhan.</p></header><TahsinQuickEntry students={students} /></AppShell>;
}
