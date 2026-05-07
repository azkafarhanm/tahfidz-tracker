"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionScope } from "@/lib/session";

const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 72;

export async function changePassword(formData: FormData) {
  const { session } = await requireSessionScope();

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    redirect("/profile/change-password?error=Semua field wajib diisi.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    redirect("/profile/change-password?error=Akun tidak ditemukan.");
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    redirect("/profile/change-password?error=Password saat ini salah.");
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    redirect(`/profile/change-password?error=Password baru harus ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} karakter.`);
  }

  if (newPassword !== confirmPassword) {
    redirect("/profile/change-password?error=Konfirmasi password tidak cocok.");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashed },
  });

  revalidatePath("/profile");
  redirect("/profile?success=Password berhasil diubah.");
}
