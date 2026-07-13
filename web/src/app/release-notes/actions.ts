"use server";

import { requireSessionScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function markReleaseNoteSeen(releaseNoteId: string) {
  const { session } = await requireSessionScope();

  const releaseNote = await prisma.releaseNote.findFirst({
    where: { id: releaseNoteId, isPublished: true },
    select: { id: true },
  });

  if (!releaseNote) return { ok: false as const };

  await prisma.userReleaseView.upsert({
    where: {
      userId_releaseNoteId: {
        userId: session.user.id,
        releaseNoteId,
      },
    },
    create: { userId: session.user.id, releaseNoteId },
    update: { seenAt: new Date() },
  });

  return { ok: true as const };
}
