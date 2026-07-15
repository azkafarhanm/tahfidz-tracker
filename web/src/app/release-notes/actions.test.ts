import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";
import { markReleaseNoteSeen, markReleaseNotesSeen } from "./actions";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/session", () => ({
  requireSessionScope: vi.fn(),
}));

const findMany = vi.fn();
const createMany = vi.fn();

function mockSession(userId = "teacher-1") {
  vi.mocked(requireSessionScope).mockResolvedValue({
    session: { user: { id: userId } },
    isAdmin: false,
    teacherId: userId,
  } as never);
}

describe("markReleaseNotesSeen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback !== "function") throw new Error("Expected transaction callback");
      return callback({
        releaseNote: { findMany },
        userReleaseView: { createMany },
      } as never);
    });
  });

  it("acknowledges one requested published ID", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }]);

    const result = await markReleaseNotesSeen(["note-1"]);

    expect(result).toEqual({ ok: true, acknowledgedIds: ["note-1"] });
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ["note-1"] }, isPublished: true },
      select: { id: true },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [{ userId: "teacher-1", releaseNoteId: "note-1" }],
      skipDuplicates: true,
    });
  });

  it("acknowledges multiple requested published IDs", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }, { id: "note-2" }]);

    const result = await markReleaseNotesSeen(["note-1", "note-2"]);

    expect(result.acknowledgedIds).toEqual(["note-1", "note-2"]);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { userId: "teacher-1", releaseNoteId: "note-1" },
        { userId: "teacher-1", releaseNoteId: "note-2" },
      ],
      skipDuplicates: true,
    });
  });

  it("deduplicates repeated IDs in one request", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }]);

    await markReleaseNotesSeen(["note-1", "note-1"]);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["note-1"] } }),
    }));
    expect(createMany).toHaveBeenCalledOnce();
  });

  it("is idempotent across duplicate submissions", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }]);

    const first = await markReleaseNotesSeen(["note-1"]);
    const second = await markReleaseNotesSeen(["note-1"]);

    expect(first).toEqual(second);
    expect(createMany).toHaveBeenCalledTimes(2);
    expect(createMany).toHaveBeenLastCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });

  it("ignores invalid IDs", async () => {
    findMany.mockResolvedValue([]);

    const result = await markReleaseNotesSeen(["missing-note"]);

    expect(result).toEqual({ ok: true, acknowledgedIds: [] });
    expect(createMany).not.toHaveBeenCalled();
  });

  it("does not acknowledge unpublished IDs", async () => {
    findMany.mockResolvedValue([]);

    const result = await markReleaseNotesSeen(["draft-note"]);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isPublished: true }),
    }));
    expect(result.acknowledgedIds).toEqual([]);
    expect(createMany).not.toHaveBeenCalled();
  });

  it("keeps acknowledgements isolated by user", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }]);

    await markReleaseNotesSeen(["note-1"]);
    mockSession("teacher-2");
    await markReleaseNotesSeen(["note-1"]);

    expect(createMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: [{ userId: "teacher-1", releaseNoteId: "note-1" }],
    }));
    expect(createMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: [{ userId: "teacher-2", releaseNoteId: "note-1" }],
    }));
  });

  it("acknowledges only IDs explicitly requested", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }, { id: "newly-published-note" }]);

    const result = await markReleaseNotesSeen(["note-1"]);

    expect(result.acknowledgedIds).toEqual(["note-1"]);
    expect(createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [{ userId: "teacher-1", releaseNoteId: "note-1" }],
    }));
  });

  it("preserves the single-note acknowledgement wrapper", async () => {
    findMany.mockResolvedValue([{ id: "note-1" }]);

    await expect(markReleaseNoteSeen("note-1")).resolves.toEqual({ ok: true });
  });
});
