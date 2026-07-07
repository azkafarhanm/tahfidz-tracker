"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function changeEmail(formData: FormData) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const currentPassword = formData.get("currentPassword");
  const newEmail = formData.get("newEmail");
  const confirmEmail = formData.get("confirmEmail");

  if (
    typeof currentPassword !== "string" ||
    typeof newEmail !== "string" ||
    typeof confirmEmail !== "string"
  ) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("allFieldsRequired"))}`);
  }

  const normalizedEmail = normalizeEmail(newEmail);
  const normalizedConfirm = normalizeEmail(confirmEmail);

  if (!normalizedEmail || !normalizedConfirm || !normalizedEmail.includes("@")) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("emailFormatInvalid"))}`);
  }

  if (normalizedEmail !== normalizedConfirm) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("emailMismatch"))}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("accountNotFound"))}`);
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("currentPasswordWrong"))}`);
  }

  if (normalizeEmail(user.email) === normalizedEmail) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("emailUnchanged"))}`);
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect(`/profile/change-email?error=${encodeURIComponent(t("emailDuplicate"))}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: normalizedEmail },
  });

  revalidatePath("/profile");
  redirect("/profile");
}
