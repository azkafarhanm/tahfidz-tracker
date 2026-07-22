import { MeetingAttendanceStatus } from "@/generated/prisma-next/enums";

export function shouldAllowQuickLogRecordEntry(
  meetingStatusEnabled: boolean,
  status: MeetingAttendanceStatus | null,
  createdNow = false,
) {
  return (
    !meetingStatusEnabled ||
    (status !== null && (!createdNow || status === MeetingAttendanceStatus.HADIR))
  );
}
