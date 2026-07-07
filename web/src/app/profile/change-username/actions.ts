"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

export async function changeUsername(formData: FormData) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const newUsername = formData.get("newUsername");

  if (typeof newUsername !== "string") {
    redirect(`/profile/change-username?error=${encodeURIComponent(t("allFieldsRequired"))}`);
  }

  const normalized = newUsername.trim().toLowerCase();

  if (!normalized || normalized.length < 4 || normalized.length > 50) {
    redirect(`/profile/change-username?error=${encodeURIComponent(t("teacherUsernameRequired"))}`);
  }

  const existingUser = await prisma.user.findUnique({
    where: { username: normalized },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== session.user.id) {
    redirect(`/profile/change-username?error=${encodeURIComponent(t("teacherUsernameDuplicate"))}`);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username: normalized },
  });

  revalidatePath("/profile");
  redirect("/profile");
}
