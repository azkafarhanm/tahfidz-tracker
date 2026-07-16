import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveInitialDeviceDateTime } from "@/lib/device-date-time";

function localInputValue(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveInitialValue", () => {
  it("uses the persisted date and time when edit preservation is enabled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T15:45:00.000Z"));
    const persisted = new Date("2026-07-14T08:23:00.000Z");

    const value = resolveInitialDeviceDateTime(persisted.toISOString(), true);

    expect(value).toMatchObject(localInputValue(persisted));
  });

  it("keeps the existing current-time default when preservation is not enabled", () => {
    vi.useFakeTimers();
    const now = new Date("2026-07-16T15:45:00.000Z");
    const persisted = new Date("2026-07-14T08:23:00.000Z");
    vi.setSystemTime(now);

    const value = resolveInitialDeviceDateTime(persisted.toISOString());

    expect(value.date).toBe(localInputValue(persisted).date);
    expect(value.time).toBe(localInputValue(now).time);
  });
});
