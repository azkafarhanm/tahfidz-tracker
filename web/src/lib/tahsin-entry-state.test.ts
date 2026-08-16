import { expect, it } from "vitest";
import { emptyTahsinMaterialDefault, isTahsinSubmitDisabled, resolveTahsinMaterialDefault } from "./tahsin-entry-state";

it("uses the selected student's latest material without leaking another student's values", () => {
  const studentA = resolveTahsinMaterialDefault({ jilid: 1, startPage: 5, endPage: null });
  const studentB = resolveTahsinMaterialDefault({ jilid: 2, startPage: 10, endPage: 12 });
  expect(studentA).toEqual({ jilid: 1, startPage: 5, endPage: null });
  expect(studentB).toEqual({ jilid: 2, startPage: 10, endPage: 12 });
});

it("uses the safe first-time default and normalizes equal pages", () => {
  expect(resolveTahsinMaterialDefault(null)).toEqual(emptyTahsinMaterialDefault);
  expect(resolveTahsinMaterialDefault({ jilid: 1, startPage: 5, endPage: 5 })).toEqual({ jilid: 1, startPage: 5, endPage: null });
});

it("disables submit while a save or student default request is pending", () => {
  expect(isTahsinSubmitDisabled(true, false)).toBe(true);
  expect(isTahsinSubmitDisabled(false, true)).toBe(true);
  expect(isTahsinSubmitDisabled(false, false)).toBe(false);
});
