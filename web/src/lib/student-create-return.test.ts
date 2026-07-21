import { describe, expect, it } from "vitest";
import {
  applyStudentDirectoryContext,
  normalizeAcademicDirectoryGrade,
} from "./student-create-return";

describe("student create return context", () => {
  it.each(["7", "8", "9"])(
    "preserves Academic grade %s, search, and page",
    (grade) => {
      const params = applyStudentDirectoryContext(
        new URLSearchParams({
          programType: "ACADEMIC",
          highlight: "student-1",
        }),
        {
          grade,
          page: "2",
          programType: "ACADEMIC",
          query: "Ali",
        },
      );

      expect(params.get("grade")).toBe(grade);
      expect(params.get("q")).toBe("Ali");
      expect(params.get("page")).toBe("2");
      expect(params.get("highlight")).toBe("student-1");
    },
  );

  it("keeps Semua unchanged when there is no originating grade", () => {
    expect(normalizeAcademicDirectoryGrade("ACADEMIC", "")).toBe("");
  });

  it("never adds a grade to Boarding return context", () => {
    const params = applyStudentDirectoryContext(
      new URLSearchParams({ programType: "BOARDING" }),
      { grade: "9", page: "", programType: "BOARDING", query: "" },
    );

    expect(params.has("grade")).toBe(false);
  });
});
