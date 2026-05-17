import assert from "node:assert/strict";
import { test } from "vitest";
import { Semester } from "@/generated/prisma-next/enums";
import {
  getAcademicYearForDate,
  getSemesterDateRange,
  getSemesterForDate,
} from "./academic-year";

test("getAcademicYearForDate starts the academic year in July", () => {
  assert.equal(getAcademicYearForDate(new Date(2026, 5, 30)), "2025/2026");
  assert.equal(getAcademicYearForDate(new Date(2026, 6, 1)), "2026/2027");
});

test("getSemesterForDate maps July-December to ganjil", () => {
  assert.equal(getSemesterForDate(new Date(2026, 6, 1)), Semester.GANJIL);
  assert.equal(getSemesterForDate(new Date(2027, 0, 1)), Semester.GENAP);
});

test("getSemesterDateRange returns inclusive semester boundaries", () => {
  const ganjil = getSemesterDateRange("2026/2027", Semester.GANJIL);
  const genap = getSemesterDateRange("2026/2027", Semester.GENAP);

  assert.deepEqual(ganjil.start, new Date(2026, 6, 1, 0, 0, 0, 0));
  assert.deepEqual(ganjil.end, new Date(2026, 11, 31, 23, 59, 59, 999));
  assert.deepEqual(genap.start, new Date(2027, 0, 1, 0, 0, 0, 0));
  assert.deepEqual(genap.end, new Date(2027, 5, 30, 23, 59, 59, 999));
});
