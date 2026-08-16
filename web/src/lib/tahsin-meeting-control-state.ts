export function createTahsinMeetingFormData(meetingDate: string) {
  const formData = new FormData();
  formData.set("meetingDate", meetingDate);
  return formData;
}

export function isTahsinMeetingControlDisabled(
  isAdvancing: boolean,
  isResetting: boolean,
) {
  return isAdvancing || isResetting;
}
