import { ProgramType } from "@/generated/prisma-next/enums";
import type { Semester } from "@/generated/prisma-next/enums";

import {
  attendancePeriodValue,
  ensureActiveAttendancePeriods,
  resolveAttendancePeriod,
  type AttendancePeriod,
} from "./report-attendance-period";

export type ReportViewModel = {
  kind: "academic" | "boarding";
  usesSemester: boolean;
  showAttendance: boolean;
  showHalaqahLevel: boolean;
  labels: {
    heading: string;
    description: string;
    avgScore: string;
    fromRecords: string;
    needsReview: string;
    statHafalan: string;
    statMurojaah: string;
    tableHafalan: string;
    tableMurojaah: string;
    tableLast: string;
  };
};

export type SemesterPeriodOption = AttendancePeriod & {
  label: string;
  value: string;
};

export type AcademicReportViewModel = ReportViewModel & {
  kind: "academic";
  usesSemester: true;
  availablePeriods: SemesterPeriodOption[];
  selectedPeriod: SemesterPeriodOption;
  selectedPeriodLabel: string;
  defaultActiveSemester: SemesterPeriodOption;
};

const academicReportViewModel: ReportViewModel = {
  kind: "academic",
  usesSemester: true,
  showAttendance: true,
  showHalaqahLevel: true,
  labels: {
    heading: "academicHeading",
    description: "academicDescription",
    avgScore: "academicAvgScoreLabel",
    fromRecords: "academicFromRecordsCount",
    needsReview: "academicNeedsReviewLabel",
    statHafalan: "academicStatHafalan",
    statMurojaah: "academicStatMurojaah",
    tableHafalan: "academicTableHafalan",
    tableMurojaah: "academicTableMurojaah",
    tableLast: "academicTableLast",
  },
};

const boardingReportViewModel: ReportViewModel = {
  kind: "boarding",
  usesSemester: false,
  showAttendance: false,
  showHalaqahLevel: false,
  labels: {
    heading: "boardingHeading",
    description: "boardingDescription",
    avgScore: "avgScoreLabel",
    fromRecords: "fromRecordsCount",
    needsReview: "needsReviewLabel",
    statHafalan: "statHafalan",
    statMurojaah: "statMurojaah",
    tableHafalan: "tableHafalan",
    tableMurojaah: "tableMurojaah",
    tableLast: "tableLast",
  },
};

export function getReportViewModel(programType: ProgramType): ReportViewModel {
  return programType === ProgramType.ACADEMIC
    ? academicReportViewModel
    : boardingReportViewModel;
}

type AcademicReportViewModelParams = {
  activeAcademicYear: string;
  activeSemester: Semester;
  availablePeriods: AttendancePeriod[];
  formatPeriod: (period: AttendancePeriod) => string;
  requestedPeriod?: string;
};

export function getAcademicReportViewModel({
  activeAcademicYear,
  activeSemester,
  availablePeriods,
  formatPeriod,
  requestedPeriod,
}: AcademicReportViewModelParams): AcademicReportViewModel {
  const defaultPeriod = {
    academicYear: activeAcademicYear,
    semester: activeSemester,
  };
  const periods = ensureActiveAttendancePeriods(
    availablePeriods,
    activeAcademicYear,
  );
  const selectedPeriod = resolveAttendancePeriod(
    periods,
    requestedPeriod,
    defaultPeriod,
  );
  const toOption = (period: AttendancePeriod): SemesterPeriodOption => ({
    academicYear: period.academicYear,
    label: formatPeriod(period),
    semester: period.semester,
    value: attendancePeriodValue(period),
  });

  return {
    ...academicReportViewModel,
    kind: "academic",
    usesSemester: true,
    availablePeriods: periods.map(toOption),
    selectedPeriod: toOption(selectedPeriod),
    selectedPeriodLabel: formatPeriod(selectedPeriod),
    defaultActiveSemester: toOption(defaultPeriod),
  };
}
