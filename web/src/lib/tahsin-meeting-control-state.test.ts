import { describe, expect, it } from "vitest";
import {
  createTahsinMeetingFormData,
  isTahsinMeetingControlDisabled,
} from "@/lib/tahsin-meeting-control-state";
import { adminNavigationItems, isNavigationItemActive, teacherNavigationItems } from "@/lib/navigation";

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

  it("exposes the appropriate Tahsin route for each navigation role", () => {
    expect(adminNavigationItems).toContainEqual(expect.objectContaining({ href: "/admin/tahsin" }));
    expect(teacherNavigationItems).toContainEqual(expect.objectContaining({ href: "/tahsin", key: "navTahsin" }));
    expect(teacherNavigationItems).not.toContainEqual(expect.objectContaining({ href: "/admin/tahsin" }));
    expect(adminNavigationItems).not.toContainEqual(expect.objectContaining({ href: "/tahsin" }));
  });

  it("marks the teacher Tahsin route active only at its own route", () => {
    expect(isNavigationItemActive("/tahsin", "/tahsin")).toBe(true);
    expect(isNavigationItemActive("/tahsin/history", "/tahsin")).toBe(true);
    expect(isNavigationItemActive("/admin/tahsin", "/tahsin")).toBe(false);
  });
});
