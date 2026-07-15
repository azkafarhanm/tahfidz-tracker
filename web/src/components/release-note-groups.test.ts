import { describe, expect, it } from "vitest";
import { groupReleaseNotes } from "./release-note-groups";

const note = (id: string, applicationVersion: string, publishedAt: string, createdAt = publishedAt) => ({
  id,
  applicationVersion,
  title: id,
  summary: id,
  content: id,
  publishedAt: new Date(publishedAt),
  createdAt: new Date(createdAt),
});

describe("groupReleaseNotes", () => {
  it("groups notes by application version and orders notes chronologically", () => {
    const result = groupReleaseNotes([
      note("note-c", "1.1.2", "2026-07-15T10:00:00.000Z"),
      note("note-b", "1.1.2", "2026-07-15T09:00:00.000Z", "2026-07-15T08:30:00.000Z"),
      note("note-a", "1.1.2", "2026-07-15T09:00:00.000Z", "2026-07-15T08:00:00.000Z"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].notes.map(({ id }) => id)).toEqual(["note-a", "note-b", "note-c"]);
  });

  it("uses ID as a deterministic tie-breaker and keeps version groups distinct", () => {
    const result = groupReleaseNotes([
      note("note-b", "1.1.1", "2026-07-14T09:00:00.000Z"),
      note("note-a", "1.1.1", "2026-07-14T09:00:00.000Z"),
      note("note-c", "1.1.2", "2026-07-15T09:00:00.000Z"),
    ]);

    expect(result.map(({ applicationVersion }) => applicationVersion)).toEqual(["1.1.2", "1.1.1"]);
    expect(result[1].notes.map(({ id }) => id)).toEqual(["note-a", "note-b"]);
  });
});
