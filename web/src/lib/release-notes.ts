import { prisma } from "@/lib/prisma";

const releaseNoteSelect = {
  id: true,
  version: true,
  title: true,
  summary: true,
  content: true,
} as const;

export type ReleaseNoteDisplay = {
  id: string;
  version: string;
  title: string;
  summary: string;
  content: string;
};

export async function getReleaseNotesForUser(userId: string) {
  const [latestPublished, latestUnseen] = await Promise.all([
    prisma.releaseNote.findFirst({
      where: { isPublished: true },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      select: releaseNoteSelect,
    }),
    prisma.releaseNote.findFirst({
      where: {
        isPublished: true,
        views: { none: { userId } },
      },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      select: releaseNoteSelect,
    }),
  ]);

  return { latestPublished, latestUnseen };
}
