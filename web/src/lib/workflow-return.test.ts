import { describe, expect, it } from "vitest";
import {
  applyContextParams,
  normalizeQuery,
  resolveScrollContext,
  samePageReturnQuery,
} from "./workflow-return";

describe("applyContextParams", () => {
  it("keeps the current grade context separate from destination overrides", () => {
    const currentContext = "programType=ACADEMIC&grade=8&page=2";

    expect(
      applyContextParams(currentContext, { grade: "7", page: null }),
    ).toBe("programType=ACADEMIC&grade=7");
    expect(currentContext).toBe("programType=ACADEMIC&grade=8&page=2");
  });

  it("represents the All filter by removing only grade and page", () => {
    expect(
      applyContextParams("programType=ACADEMIC&grade=9&page=3", {
        grade: null,
        page: null,
      }),
    ).toBe("programType=ACADEMIC");
  });

  it("uses the source grade only when independent scroll context is requested", () => {
    const current = "programType=ACADEMIC&grade=8";
    const destination = "programType=ACADEMIC&grade=7";

    expect(resolveScrollContext(current, destination, true)).toBe(current);
    expect(resolveScrollContext(current, destination, false)).toBe(destination);
  });
});

describe("samePageReturnQuery", () => {
  it("extracts a same-page canonical return query from workflow edit links", () => {
    expect(
      samePageReturnQuery(
        "/students/student-1/records/hafalan/record-1/edit?returnTo=%2Fformative%2Fstudent-1%3Fsemester%3DGANJIL%26programType%3DACADEMIC",
        "http://localhost:3000/formative/student-1",
        "http://localhost:3000",
        "/formative/student-1",
      ),
    ).toBe("?semester=GANJIL&programType=ACADEMIC");
  });

  it("preserves boarding return queries for the same detail route", () => {
    expect(
      samePageReturnQuery(
        "/summative/student-1/assessment-1/edit?returnTo=%2Fsummative%2Fstudent-1%3Fsemester%3DGENAP%26programType%3DBOARDING",
        "http://localhost:3000/summative/student-1",
        "http://localhost:3000",
        "/summative/student-1",
      ),
    ).toBe("?semester=GENAP&programType=BOARDING");
  });

  it("ignores returnTo values for a different route", () => {
    expect(
      samePageReturnQuery(
        "/students/student-1?returnTo=%2Fquick-log%3FprogramType%3DBOARDING",
        "http://localhost:3000/students/student-1",
        "http://localhost:3000",
        "/students/student-1",
      ),
    ).toBeNull();
  });
});

describe("normalizeQuery", () => {
  it("compares query strings with or without a leading question mark", () => {
    expect(normalizeQuery("?semester=GANJIL")).toBe("semester=GANJIL");
    expect(normalizeQuery("semester=GANJIL")).toBe("semester=GANJIL");
  });
});
