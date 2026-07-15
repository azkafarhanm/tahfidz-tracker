"use server";

import { requireSessionScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function markReleaseNotesSeen(releaseNoteIds: string[]) {
  const { session } = await requireSessionScope();
  const requestedIds = [...new Set(releaseNoteIds.filter((id) => id.trim()))];

  if (requestedIds.length === 0) {
    return { ok: true as const, acknowledgedIds: [] as string[] };
  }

  const acknowledgedIds = await prisma.$transaction(async (tx) => {
    const publishedNotes = await tx.releaseNote.findMany({
      where: {
        id: { in: requestedIds },
        isPublished: true,
      },
      select: { id: true },
    });
    const requestedIdSet = new Set(requestedIds);
    const publishedIds = publishedNotes
      .map((releaseNote) => releaseNote.id)
      .filter((releaseNoteId) => requestedIdSet.has(releaseNoteId));

    if (publishedIds.length === 0) return [];

    await tx.userReleaseView.createMany({
      data: publishedIds.map((releaseNoteId) => ({
        userId: session.user.id,
        releaseNoteId,
      })),
      skipDuplicates: true,
    });

    return publishedIds;
  });

  return { ok: true as const, acknowledgedIds };
}

export async function markReleaseNoteSeen(releaseNoteId: string) {
  const result = await markReleaseNotesSeen([releaseNoteId]);

  return { ok: result.acknowledgedIds.includes(releaseNoteId) };
}
