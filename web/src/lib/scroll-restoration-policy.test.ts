import { describe, expect, it } from "vitest";
import {
  isSupportedDetailPanel,
  scrollRouteIdentity,
  shouldConsumeScrollRestoreFlag,
} from "@/lib/scroll-restoration-policy";

describe("isSupportedDetailPanel", () => {
  it.each([
    "/students/student-1",
    "/formative/student-1",
    "/summative/student-1",
    "/admin/students/student-1",
  ])("accepts the detail panel %s", (pathname) => {
    expect(isSupportedDetailPanel(pathname)).toBe(true);
  });

  it.each([
    "/students/student-1/hafalan/new",
    "/students/student-1/murojaah/new",
    "/students/student-1/tasmi/new",
    "/students/student-1/records/hafalan/record-1/edit",
    "/students/student-1/targets/new",
  ])("rejects the workflow leaf %s", (pathname) => {
    expect(isSupportedDetailPanel(pathname)).toBe(false);
  });
});

describe("scrollRouteIdentity", () => {
  it("uses one stable identity for a Student Detail panel across list and workflow queries", () => {
    const pathname = "/students/student-1";

    expect(
      scrollRouteIdentity(
        pathname,
        "programType=ACADEMIC&dashboardShortcut=murojaah&grade=8",
      ),
    ).toBe(pathname);
    expect(scrollRouteIdentity(pathname, "programType=ACADEMIC")).toBe(pathname);
    expect(
      scrollRouteIdentity(
        pathname,
        "programType=ACADEMIC&returnTo=%2Fquick-log&highlight=record-1",
      ),
    ).toBe(pathname);
  });

  it("keeps list filters distinct for the Students panel", () => {
    expect(
      scrollRouteIdentity(
        "/students",
        "programType=ACADEMIC&grade=8&dashboardShortcut=murojaah",
      ),
    ).toBe("/students?grade=8&programType=ACADEMIC");
  });

  it("does not collapse nested Student workflow routes into the detail identity", () => {
    expect(
      scrollRouteIdentity(
        "/students/student-1/murojaah/new",
        "programType=ACADEMIC",
      ),
    ).toBe(
      "/students/student-1/murojaah/new?programType=ACADEMIC",
    );
  });
});

describe("shouldConsumeScrollRestoreFlag", () => {
  it("keeps the pending return intent while a workflow leaf is mounted", () => {
    expect(shouldConsumeScrollRestoreFlag(true, false)).toBe(false);
  });

  it("consumes the intent when the restorable detail panel returns", () => {
    expect(shouldConsumeScrollRestoreFlag(true, true)).toBe(true);
  });
});
