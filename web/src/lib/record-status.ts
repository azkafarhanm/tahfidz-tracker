import { RecordStatus } from "@/generated/prisma-next/enums";
import { statusLabels } from "@/lib/format";

export function deriveRecordStatusFromScore(score: number | null): RecordStatus | "" {
  if (score === null) return "";
  if (score >= 88 && score <= 95) return RecordStatus.LANCAR;
  if (score >= 81 && score <= 87) return RecordStatus.CUKUP;
  if (score >= 75 && score <= 80) return RecordStatus.PERLU_MUROJAAH;
  return "";
}

export function recordStatusDisplay(status: RecordStatus | "") {
  if (status) return statusLabels[status];
  return "";
}
