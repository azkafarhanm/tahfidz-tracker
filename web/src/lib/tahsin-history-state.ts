const COLLAPSED_HISTORY_LIMIT = 5;

export function getVisibleTahsinHistory<T>(records: readonly T[], expanded: boolean): T[] {
  return expanded ? [...records] : records.slice(0, COLLAPSED_HISTORY_LIMIT);
}

export function toggleTahsinHistoryExpanded(expanded: boolean) {
  return !expanded;
}
