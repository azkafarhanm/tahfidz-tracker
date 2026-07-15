import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma-next/client";

const releaseNoteSelect = {
  id: true,
  applicationVersion: true,
  title: true,
  summary: true,
  content: true,
  publishedAt: true,
  createdAt: true,
} as const;

const releaseNoteOrderBy: Prisma.ReleaseNoteOrderByWithRelationInput[] = [
  { publishedAt: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
  { id: "desc" },
];

export type ReleaseNote = {
  id: string;
  applicationVersion: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
};

export type ReleaseNoteDisplay = Pick<
  ReleaseNote,
  "id" | "title" | "summary" | "content"
> & {
  version: string;
};

function toReleaseNoteDisplay(releaseNote: ReleaseNote | undefined): ReleaseNoteDisplay | null {
  if (!releaseNote) return null;

  return {
    id: releaseNote.id,
    version: releaseNote.applicationVersion,
    title: releaseNote.title,
    summary: releaseNote.summary,
    content: releaseNote.content,
  };
}

export async function getReleaseNotesForUser(userId: string) {
  const [publishedHistory, unreadPublished] = await Promise.all([
    prisma.releaseNote.findMany({
      where: { isPublished: true },
      orderBy: releaseNoteOrderBy,
      select: releaseNoteSelect,
    }),
    prisma.releaseNote.findMany({
      where: {
        isPublished: true,
        views: { none: { userId } },
      },
      orderBy: releaseNoteOrderBy,
      select: releaseNoteSelect,
    }),
  ]);

  return {
    publishedHistory,
    unreadPublished,
    // Keep the current Dashboard and modal contract until the teacher UI phase.
    latestPublished: toReleaseNoteDisplay(publishedHistory[0]),
    latestUnseen: toReleaseNoteDisplay(unreadPublished[0]),
  };
}
