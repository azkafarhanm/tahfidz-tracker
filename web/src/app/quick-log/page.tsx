import { getQuickLogStudents } from "@/lib/quick-log";
import { todayInputValue, nowTimeValue } from "@/lib/format";
import { createGuidedRecord } from "./actions";
import GuidedQuickLog from "./GuidedQuickLog";
import AppShell from "@/components/AppShell";
import { requireSessionScope } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuickLogPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export const metadata = {
  title: "Catat Cepat - TahfidzFlow",
};

export default async function QuickLogPage({ searchParams }: QuickLogPageProps) {
  const params = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const students = await getQuickLogStudents(teacherId);
  const userName = session?.user?.name ?? "Ustadz";

  return (
    <AppShell currentPath="/quick-log" userName={userName} isAdmin={isAdmin}>
      <GuidedQuickLog
        action={createGuidedRecord}
        students={students}
        todayDate={todayInputValue()}
        nowTime={nowTimeValue()}
        error={params?.error}
        success={params?.success}
      />
    </AppShell>
  );
}
