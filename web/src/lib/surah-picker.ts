import {
  matchesSurahSearch,
  type SurahInfo,
} from "@/lib/surahs";

export function getVisibleSurahOptions(
  options: readonly SurahInfo[],
  searchQuery: string,
  isSearching: boolean,
): readonly SurahInfo[] {
  if (!isSearching || !searchQuery.trim()) return options;
  return options.filter((surah) => matchesSurahSearch(surah, searchQuery));
}

export function getSelectedSurahIndex(
  options: readonly SurahInfo[],
  selectedValue: string,
): number {
  const index = options.findIndex(({ name }) => name === selectedValue);
  return index >= 0 ? index : 0;
}

export function getCenteredSurahScrollTop(
  itemOffsetTop: number,
  itemHeight: number,
  containerHeight: number,
): number {
  return Math.max(
    0,
    itemOffsetTop - (containerHeight - itemHeight) / 2,
  );
}
