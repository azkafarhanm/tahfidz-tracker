"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const t = useTranslations("LogoutButton");
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <button
      className="flex items-center gap-2 rounded-2xl px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="h-5 w-5" />
      <span>{t("label")}</span>
    </button>
  );
}
