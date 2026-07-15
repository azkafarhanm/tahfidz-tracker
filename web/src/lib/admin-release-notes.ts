import { prisma, withRetry } from "@/lib/prisma";

export async function getAdminReleaseNotes() {
  const [drafts, published] = await withRetry(() => Promise.all([
    prisma.releaseNote.findMany({
      where: { isPublished: false },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        applicationVersion: true,
        title: true,
        summary: true,
        updatedAt: true,
      },
    }),
    prisma.releaseNote.findMany({
      where: { isPublished: true },
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        applicationVersion: true,
        title: true,
        summary: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
  ]));

  return { drafts, published };
}
