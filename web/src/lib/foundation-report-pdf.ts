import { formatIndonesianDay, formatPeriodLabel, type SurahDetail } from "@/lib/foundation-report";
import type { FoundationReportData } from "@/lib/foundation-report-data";
import type { PdfSection } from "@/lib/pdf";

function detailRows(detail: SurahDetail) {
  return [
    ...(detail.penuh.length > 0 ? [{ label: "Penuh", value: detail.penuh.join(", "), indent: true }] : []),
    ...(detail.sebagian.length > 0 ? [{ label: "Sebagian", value: detail.sebagian.join("; "), indent: true }] : []),
  ];
}

/**
 * The PDF reads student by student — how the foundation asks "how is so-and-so
 * doing" — while the Excel file compares students side by side. Both come from
 * the same computed data.
 */
export function buildFoundationReportPdfSections(data: FoundationReportData): PdfSection[] {
  const sections: PdfSection[] = [
    { type: "title", text: "Laporan Perkembangan Tahfidz Santri Boarding" },
    { type: "text", text: `Periode: ${formatPeriodLabel(data.from, data.to)}` },
    { type: "text", text: `Guru Pembimbing: ${data.teacherName}` },
  ];

  if (data.grades.length === 0) {
    sections.push({ type: "text", text: "Belum ada santri Boarding di halaqah Anda." });
    return sections;
  }

  for (const grade of data.grades) {
    sections.push({ type: "subtitle", text: `Kelas ${grade.grade} · Halaqah ${grade.halaqahName}` });
    for (const student of grade.students) {
      const report = student.report;
      sections.push({
        type: "block",
        heading: student.fullName,
        meta: `Kelas ${grade.grade}`,
        rows: [
          { label: "Hafalan baru", value: `${report.hafalanBaru} (${report.hafalanSetoran} setoran)` },
          ...detailRows(report.rincianHafalan),
          { label: "Murojaah", value: `${report.murojaahProgress} (${report.murojaahSetoran} setoran)` },
          ...detailRows(report.rincianMurojaah),
          { label: "Total hafalan", value: `${report.totalHafalan} (sampai ${formatIndonesianDay(data.to)})` },
          ...detailRows(report.rincianTotal),
        ],
      });
    }
  }

  return sections;
}
