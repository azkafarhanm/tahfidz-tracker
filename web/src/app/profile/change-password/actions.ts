"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  hasLetterAndNumber,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";
import { requireSessionScope } from "@/lib/session";

export async function changePassword(formData: FormData) {
  const { session } = await requireSessionScope();
  const t = await getTranslations("Validation");

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("allFieldsRequired"))}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("accountNotFound"))}`);
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("currentPasswordWrong"))}`);
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("passwordLength", { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH }))}`);
  }

  if (!hasLetterAndNumber(newPassword)) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("passwordLetterNumber"))}`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/profile/change-password?error=${encodeURIComponent(t("passwordMismatch"))}`);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashed },
  });

  revalidatePath("/profile");
  redirect("/profile");
}
