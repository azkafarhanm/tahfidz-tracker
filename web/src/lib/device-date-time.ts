export type DeviceDateTime = {
  date: string;
  time: string;
  timezoneOffset: string;
};

function toInputDateTime(value: Date): DeviceDateTime {
  const pad = (part: number) => String(part).padStart(2, "0");

  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
    timezoneOffset: String(value.getTimezoneOffset()),
  };
}

export function withSelectedTimezoneOffset(value: DeviceDateTime) {
  if (!value.date || !value.time) return value;

  const selectedDate = new Date(`${value.date}T${value.time}:00`);
  if (Number.isNaN(selectedDate.getTime())) return value;

  return {
    ...value,
    timezoneOffset: String(selectedDate.getTimezoneOffset()),
  };
}

export function resolveInitialDeviceDateTime(
  initialDateTimeIso?: string,
  preserveInitialTime = false,
): DeviceDateTime {
  const now = new Date();
  const initialDate = initialDateTimeIso ? new Date(initialDateTimeIso) : now;
  const dateValue = Number.isNaN(initialDate.getTime()) ? now : initialDate;
  const date = toInputDateTime(dateValue);
  const time = toInputDateTime(preserveInitialTime ? dateValue : now);

  return withSelectedTimezoneOffset({
    date: date.date,
    time: time.time,
    timezoneOffset: time.timezoneOffset,
  });
}
