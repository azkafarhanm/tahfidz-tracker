import { describe, expect, it } from "vitest";
import { getVisibleTahsinHistory, toggleTahsinHistoryExpanded } from "./tahsin-history-state";

describe("Tahsin history expand/collapse state", () => {
  const records = Array.from({ length: 11 }, (_, index) => ({ id: `record-${index + 1}` }));

  it("shows five records when collapsed, all eleven when expanded, then five after toggling back", () => {
    let expanded = false;
    expect(getVisibleTahsinHistory(records, expanded)).toHaveLength(5);

    expanded = toggleTahsinHistoryExpanded(expanded);
    expect(expanded).toBe(true);
    expect(getVisibleTahsinHistory(records, expanded)).toHaveLength(11);

    expanded = toggleTahsinHistoryExpanded(expanded);
    expect(expanded).toBe(false);
    expect(getVisibleTahsinHistory(records, expanded)).toHaveLength(5);
  });
});
