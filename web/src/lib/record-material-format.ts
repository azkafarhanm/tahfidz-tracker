export type RecordMaterial = {
  surah: string;
  fromAyah: number;
  toAyah: number;
};

export function formatRecordMaterial({
  surah,
  fromAyah,
  toAyah,
}: RecordMaterial): string {
  return `${surah} ${fromAyah}\u2013${toAyah}`;
}
