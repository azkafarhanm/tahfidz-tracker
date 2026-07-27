import { ProgramType, Semester } from "@/generated/prisma-next/enums";
import { describe, expect, it } from "vitest";

import {
  getAcademicReportViewModel,
  getReportViewModel,
} from "./report-view-model";

describe("getReportViewModel", () => {
  it("keeps semester reporting exclusive to Academic", () => {
    const viewModel = getReportViewModel(ProgramType.ACADEMIC);

    expect(viewModel.kind).toBe("academic");
    expect(viewModel.usesSemester).toBe(true);
    expect(viewModel.showAttendance).toBe(true);
    expect(viewModel.labels.heading).toBe("academicHeading");
  });

  it("keeps Boarding reporting cumulative and free of semester UI", () => {
    const viewModel = getReportViewModel(ProgramType.BOARDING);

    expect(viewModel.kind).toBe("boarding");
    expect(viewModel.usesSemester).toBe(false);
    expect(viewModel.showAttendance).toBe(false);
    expect(viewModel.labels.heading).toBe("boardingHeading");
    expect(viewModel.labels.avgScore).toBe("avgScoreLabel");
  });

  it("keeps Academic semester selector data together in its view model", () => {
    const viewModel = getAcademicReportViewModel({
      activeAcademicYear: "2026/2027",
      activeSemester: Semester.GANJIL,
      availablePeriods: [
        { academicYear: "2026/2027", semester: Semester.GANJIL },
        { academicYear: "2025/2026", semester: Semester.GENAP },
      ],
      formatPeriod: (period) => `Semester ${period.semester} ${period.academicYear}`,
      requestedPeriod: "2025/2026:GENAP",
    });

    expect(viewModel.availablePeriods).toHaveLength(2);
    expect(viewModel.defaultActiveSemester).toMatchObject({
      value: "2026/2027:GANJIL",
    });
    expect(viewModel.selectedPeriod).toMatchObject({
      value: "2025/2026:GENAP",
    });
    expect(viewModel.selectedPeriodLabel).toBe("Semester GENAP 2025/2026");
  });
});
