import { getQuickLogStudents } from "@/lib/quick-log";
import { createGuidedRecord } from "./actions";
import GuidedQuickLog from "./GuidedQuickLog";
import AppShell from "@/components/AppShell";
import { requireSessionScope } from "@/lib/session";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuickLogPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("QuickLog");
  return { title: `${t("heading")} - TahfidzFlow` };
}

export default async function QuickLogPage({ searchParams }: QuickLogPageProps) {
  const t = await getTranslations("QuickLog");
  const params = await searchParams;
  const { session, teacherId, isAdmin } = await requireSessionScope();
  const students = await getQuickLogStudents(teacherId);
  const userName = session?.user?.name ?? t("defaultUserName");

  return (
    <AppShell currentPath="/quick-log" userName={userName} isAdmin={isAdmin}>
      <GuidedQuickLog
        action={createGuidedRecord}
        students={students}
        error={params?.error}
        success={params?.success}
      />
    </AppShell>
  );
}
