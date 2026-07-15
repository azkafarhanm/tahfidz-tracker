"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createFailFn, readString } from "@/lib/form-helpers";
import { prisma } from "@/lib/prisma";
import { requireAdminScope } from "@/lib/session";

type ReleaseNoteDraftInput = {
  applicationVersion: string;
  title: string;
  summary: string;
  content: string;
};

function readReleaseNoteDraftInput(formData: FormData): ReleaseNoteDraftInput {
  return {
    applicationVersion: readString(formData, "applicationVersion"),
    title: readString(formData, "title"),
    summary: readString(formData, "summary"),
    content: readString(formData, "content"),
  };
}

async function validateReleaseNoteDraft(
  input: ReleaseNoteDraftInput,
  fail: (message: string, extra?: Record<string, string>) => never,
) {
  const t = await getTranslations("Validation");

  if (!input.applicationVersion) fail(t("releaseNoteVersionRequired"), input);
  if (!input.title) fail(t("releaseNoteTitleRequired"), input);
  if (!input.summary) fail(t("releaseNoteSummaryRequired"), input);
  if (!input.content) fail(t("releaseNoteContentRequired"), input);
}

function revalidateReleaseNotePaths() {
  revalidatePath("/admin/release-notes");
}

export async function createReleaseNoteDraft(formData: FormData) {
  await requireAdminScope();

  const input = readReleaseNoteDraftInput(formData);
  const fail = createFailFn("/admin/release-notes/new");
  await validateReleaseNoteDraft(input, fail);

  await prisma.releaseNote.create({ data: input });

  revalidateReleaseNotePaths();
  redirect("/admin/release-notes");
}

export async function updateReleaseNoteDraft(releaseNoteId: string, formData: FormData) {
  await requireAdminScope();

  const input = readReleaseNoteDraftInput(formData);
  const fail = createFailFn(`/admin/release-notes/${releaseNoteId}/edit`);
  await validateReleaseNoteDraft(input, fail);

  const result = await prisma.releaseNote.updateMany({
    where: { id: releaseNoteId, isPublished: false },
    data: input,
  });

  if (result.count === 0) redirect("/admin/release-notes");

  revalidateReleaseNotePaths();
  redirect("/admin/release-notes");
}
