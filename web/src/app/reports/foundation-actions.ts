"use server";

import { revalidatePath } from "next/cache";
import { recordFoundationReportPeriod, undoLatestFoundationReportPeriod } from "@/lib/foundation-report-data";
import { requireSessionScope } from "@/lib/session";

/** Closes a reporting period once the report has been handed to the foundation. */
export async function markFoundationReportedAction(from: string, to: string) {
  const { teacherId } = await requireSessionScope();
  if (!teacherId) return { ok: false, error: "Hanya guru yang dapat menandai laporan." };
  try {
    await recordFoundationReportPeriod(teacherId, from, to);
    revalidatePath("/reports");
    return { ok: true, success: "Laporan ditandai sudah diserahkan." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal menandai laporan." };
  }
}

/** Reopens the most recent period, for when it was marked by mistake. */
export async function undoFoundationReportAction() {
  const { teacherId } = await requireSessionScope();
  if (!teacherId) return { ok: false, error: "Hanya guru yang dapat membatalkan tanda laporan." };
  try {
    await undoLatestFoundationReportPeriod(teacherId);
    revalidatePath("/reports");
    return { ok: true, success: "Tanda laporan terakhir dibatalkan." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal membatalkan tanda laporan." };
  }
}
