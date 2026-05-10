export const exportLabels = {
  appName: "TahfidzFlow",
  reportAdmin: "Laporan Admin",
  reportTeacher: "Laporan Guru",
  reportStudent: "Laporan Santri",
  date: "Tanggal",
  type: "Tipe",
  hafalan: "Hafalan",
  murojaah: "Murojaah",
  surah: "Surah",
  fromAyah: "Dari Ayat",
  toAyah: "Sampai Ayat",
  score: "Nilai",
  status: "Status",
  notes: "Catatan",
  lancar: "Lancar",
  cukup: "Cukup",
  perluMurojaah: "Perlu Murojaah",
  name: "Nama",
  teacher: "Guru",
  class: "Kelas",
  halaqah: "Halaqah",
  averageScore: "Rata-rata Skor",
  totalRecords: "Total Catatan",
  activeStudents: "Santri Aktif",
  target: "Target",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  missed: "Terlewat",
  startDate: "Tanggal Mulai",
  endDate: "Deadline",
  progress: "Progres",
  sheetHafalan: "Hafalan",
  sheetMurojaah: "Murojaah",
  sheetTargets: "Target Aktif",
  sheetSummary: "Ringkasan",
  sheetStudentProgress: "Progres Santri",
  generatedAt: "Digenerate pada",
  recordCount: "catatan",
  overdueBadge: "Lewat",
  activeBadge: "Aktif",
  level: "Level",
  low: "Low",
  medium: "Medium",
  high: "High",
  academicClass: "Kelas Akademik",
  academicYear: "Tahun Ajaran",
  noRecords: "Belum ada catatan",
  fromCount: (count: number) => `dari ${count} catatan`,
  recordFor: (name: string) => `Catatan untuk ${name}`,
  teacherPrefix: "Ust.",
} as const;

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    LANCAR: exportLabels.lancar,
    CUKUP: exportLabels.cukup,
    PERLU_MUROJAAH: exportLabels.perluMurojaah,
  };
  return map[status] ?? status;
}

export function targetTypeLabel(type: string): string {
  return type === "HAFALAN" ? exportLabels.hafalan : exportLabels.murojaah;
}

export function targetStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: exportLabels.active,
    COMPLETED: exportLabels.completed,
    CANCELLED: exportLabels.cancelled,
    MISSED: exportLabels.missed,
  };
  return map[status] ?? status;
}
