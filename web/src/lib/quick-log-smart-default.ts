export type QuickLogMaterial = {
  surah: string;
  fromAyah: number;
};

type QuickLogMaterialStudent = {
  latestHafalanMaterial: QuickLogMaterial | null;
  latestMurojaahMaterial: QuickLogMaterial | null;
};

export type QuickLogSmartDefaultType = "HAFALAN" | "MUROJAAH";

export function getQuickLogSmartDefault(
  student: QuickLogMaterialStudent,
  recordType: QuickLogSmartDefaultType,
): QuickLogMaterial | null {
  return recordType === "HAFALAN"
    ? student.latestHafalanMaterial
    : student.latestMurojaahMaterial;
}

export function getQuickLogSessionPreferenceKey(
  recordType: QuickLogSmartDefaultType,
): "hafalan" | "murojaah" {
  return recordType === "HAFALAN" ? "hafalan" : "murojaah";
}
