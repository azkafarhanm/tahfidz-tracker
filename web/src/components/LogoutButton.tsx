"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";

type LogoutButtonProps = {
  className?: string;
  icon?: ReactNode;
  label: string;
};

export default function LogoutButton({
  className,
  icon,
  label,
}: LogoutButtonProps) {
  const t = useTranslations("LogoutButton");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={
          className ??
          "flex items-center gap-2 rounded-2xl px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        {icon ?? <LogOut className="h-5 w-5" />}
        <span>{label}</span>
      </button>

      <ConfirmActionDialog
        cancelLabel={t("cancelLabel")}
        confirmLabel={t("confirmLabel")}
        description={t("confirmMessage")}
        icon={<LogOut aria-hidden="true" size={16} strokeWidth={2.2} />}
        onConfirm={async () => {
          await signOut({ redirect: false });
          router.push("/login");
        }}
        onOpenChange={setOpen}
        open={open}
        pendingLabel={t("pendingLabel")}
        showSuccessToast={false}
        title={label}
        tone="danger"
      />
    </>
  );
}
