import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./prisma";
import { getReleaseNotesForUser } from "./release-notes";

vi.mock("./prisma", () => ({
  prisma: {
    releaseNote: {
      findMany: vi.fn(),
    },
  },
}));

const notes = [
  {
    id: "note-c",
    applicationVersion: "1.1.1",
    title: "Quick Log",
    summary: "Quick Log lebih nyaman.",
    content: "Isi Quick Log.",
    publishedAt: new Date("2026-07-16T08:00:00.000Z"),
    createdAt: new Date("2026-07-16T07:00:00.000Z"),
  },
  {
    id: "note-b",
    applicationVersion: "1.1.1",
    title: "Flexible Student Search",
    summary: "Pencarian lebih fleksibel.",
    content: "Isi pencarian.",
    publishedAt: new Date("2026-07-15T08:00:00.000Z"),
    createdAt: new Date("2026-07-15T07:00:00.000Z"),
  },
  {
    id: "note-a",
    applicationVersion: "1.1.0",
    title: "Juz Filter",
    summary: "Filter Juz tersedia.",
    content: "Isi filter Juz.",
    publishedAt: new Date("2026-07-14T08:00:00.000Z"),
    createdAt: new Date("2026-07-14T07:00:00.000Z"),
  },
];

describe("getReleaseNotesForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns multiple notes under one application version", async () => {
    vi.mocked(prisma.releaseNote.findMany)
      .mockResolvedValueOnce(notes as never)
      .mockResolvedValueOnce(notes.slice(0, 2) as never);

    const result = await getReleaseNotesForUser("teacher-1");

    expect(result.publishedHistory.map((note) => note.applicationVersion)).toEqual([
      "1.1.1",
      "1.1.1",
      "1.1.0",
    ]);
    expect(result.unreadPublished).toHaveLength(2);
  });

  it("uses stable ordering with an id tie-breaker", async () => {
    vi.mocked(prisma.releaseNote.findMany)
      .mockResolvedValueOnce(notes as never)
      .mockResolvedValueOnce(notes as never);

    await getReleaseNotesForUser("teacher-1");

    expect(prisma.releaseNote.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    }));
  });

  it("excludes drafts from both collections", async () => {
    vi.mocked(prisma.releaseNote.findMany)
      .mockResolvedValueOnce(notes as never)
      .mockResolvedValueOnce(notes as never);

    await getReleaseNotesForUser("teacher-1");

    expect(prisma.releaseNote.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { isPublished: true } }),
    );
    expect(prisma.releaseNote.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ isPublished: true }) }),
    );
  });

  it("filters unread notes by the current user", async () => {
    vi.mocked(prisma.releaseNote.findMany)
      .mockResolvedValueOnce(notes as never)
      .mockResolvedValueOnce(notes.slice(1) as never);

    const result = await getReleaseNotesForUser("teacher-1");

    expect(prisma.releaseNote.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          isPublished: true,
          views: { none: { userId: "teacher-1" } },
        },
      }),
    );
    expect(result.unreadPublished.map((note) => note.id)).toEqual(["note-b", "note-a"]);
  });

  it("preserves the legacy latest-note contract", async () => {
    vi.mocked(prisma.releaseNote.findMany)
      .mockResolvedValueOnce(notes as never)
      .mockResolvedValueOnce(notes.slice(1) as never);

    const result = await getReleaseNotesForUser("teacher-1");

    expect(result.latestPublished).toEqual({
      id: "note-c",
      version: "1.1.1",
      title: "Quick Log",
      summary: "Quick Log lebih nyaman.",
      content: "Isi Quick Log.",
    });
    expect(result.latestUnseen).toEqual({
      id: "note-b",
      version: "1.1.1",
      title: "Flexible Student Search",
      summary: "Pencarian lebih fleksibel.",
      content: "Isi pencarian.",
    });
  });
});
