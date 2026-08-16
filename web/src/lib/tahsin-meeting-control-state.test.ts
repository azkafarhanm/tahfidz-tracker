import { describe, expect, it } from "vitest";
import {
  createTahsinMeetingFormData,
  isTahsinMeetingControlDisabled,
} from "@/lib/tahsin-meeting-control-state";
import { adminNavigationItems, teacherNavigationItems } from "@/lib/navigation";

describe("Tahsin admin meeting control UI state", () => {
  it("sends meetingDate only as action metadata", () => {
    const formData = createTahsinMeetingFormData("2026-08-16");
    expect([...formData.entries()]).toEqual([["meetingDate", "2026-08-16"]]);
  });

  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
    [true, true, true],
  ])("disables controls while an action is pending", (isAdvancing, isResetting, expected) => {
    expect(isTahsinMeetingControlDisabled(isAdvancing, isResetting)).toBe(expected);
  });

  it("exposes Tahsin only in the admin navigation", () => {
    expect(adminNavigationItems).toContainEqual(expect.objectContaining({ href: "/admin/tahsin" }));
    expect(teacherNavigationItems).not.toContainEqual(expect.objectContaining({ href: "/admin/tahsin" }));
  });
});
