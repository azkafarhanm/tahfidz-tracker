import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";
import { publishReleaseNote } from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    releaseNote: {
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/session", () => ({ requireAdminScope: vi.fn() }));

describe("publishReleaseNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminScope).mockResolvedValue({} as never);
    vi.mocked(getTranslations).mockResolvedValue(((key: string) => key) as never);
  });

  it("publishes only the selected draft and sets its publication timestamp", async () => {
    vi.mocked(prisma.releaseNote.updateMany).mockResolvedValue({ count: 1 } as never);

    await publishReleaseNote("draft-note");

    expect(prisma.releaseNote.updateMany).toHaveBeenCalledWith({
      where: { id: "draft-note", isPublished: false },
      data: {
        isPublished: true,
        publishedAt: expect.any(Date),
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/release-notes");
    expect(redirect).toHaveBeenCalledWith("/admin/release-notes");
  });

  it("does not publish a note twice", async () => {
    vi.mocked(prisma.releaseNote.updateMany).mockResolvedValue({ count: 0 } as never);

    await expect(publishReleaseNote("published-note")).resolves.toEqual({
      ok: false,
      error: "publishUnavailable",
    });

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
