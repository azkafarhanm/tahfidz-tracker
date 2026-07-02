"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

type DeviceDateTimeFieldsProps = {
  dateLabel: string;
  timeLabel: string;
  initialDateTimeIso?: string;
};

type DeviceDateTime = {
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

function withSelectedTimezoneOffset(value: DeviceDateTime) {
  if (!value.date || !value.time) return value;

  const selectedDate = new Date(`${value.date}T${value.time}:00`);
  if (Number.isNaN(selectedDate.getTime())) return value;

  return {
    ...value,
    timezoneOffset: String(selectedDate.getTimezoneOffset()),
  };
}

function resolveInitialValue(initialDateTimeIso?: string): DeviceDateTime {
  const date = initialDateTimeIso ? new Date(initialDateTimeIso) : new Date();
  return toInputDateTime(Number.isNaN(date.getTime()) ? new Date() : date);
}

function useDeviceDateTime(initialDateTimeIso?: string) {
  // Initialize the date, time, and timezone atomically on the very first
  // render (via a lazy initializer) so both fields are populated before the
  // browser paints — this keeps date and time in sync across every form
  // (create and edit) and removes the empty-state window that previously
  // caused the two fields to appear inconsistently initialized.
  const [value, setValue] = useState<DeviceDateTime>(() =>
    resolveInitialValue(initialDateTimeIso),
  );

  // Keep the fields in sync if the source value changes after mount (e.g. a
  // client-side navigation to a different record).
  useEffect(() => {
    setValue(resolveInitialValue(initialDateTimeIso));
  }, [initialDateTimeIso]);

  return [value, setValue] as const;
}

export function DeviceDateTimeHiddenFields() {
  const [value] = useDeviceDateTime();

  return (
    <>
      <input name="date" type="hidden" value={value.date} />
      <input name="time" type="hidden" value={value.time} />
      <input name="timezoneOffset" type="hidden" value={value.timezoneOffset} />
    </>
  );
}

export default function DeviceDateTimeFields({
  dateLabel,
  timeLabel,
  initialDateTimeIso,
}: DeviceDateTimeFieldsProps) {
  const [value, setValue] = useDeviceDateTime(initialDateTimeIso);

  return (
    <>
      <input name="timezoneOffset" type="hidden" value={value.timezoneOffset} />

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {dateLabel}
        </span>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900/30">
          <CalendarDays
            aria-hidden="true"
            className="shrink-0 text-slate-400 dark:text-slate-500"
            size={17}
            strokeWidth={2.2}
          />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
            name="date"
            onChange={(event) =>
              setValue((current) =>
                withSelectedTimezoneOffset({
                  ...current,
                  date: event.target.value,
                }),
              )
            }
            required
            type="date"
            value={value.date}
          />
        </div>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {timeLabel}
        </span>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:ring-emerald-900/30">
          <Clock
            aria-hidden="true"
            className="shrink-0 text-slate-400 dark:text-slate-500"
            size={17}
            strokeWidth={2.2}
          />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none dark:text-white"
            name="time"
            onChange={(event) =>
              setValue((current) =>
                withSelectedTimezoneOffset({
                  ...current,
                  time: event.target.value,
                }),
              )
            }
            required
            type="time"
            value={value.time}
          />
        </div>
      </label>
    </>
  );
}
