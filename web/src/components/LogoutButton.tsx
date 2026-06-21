"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  actionButtonClass,
  compactActionButtonClass,
} from "@/components/action-button-styles";

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
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => {
              if (!isLoading) setOpen(false);
            }}
          >
            <div
              aria-describedby={descriptionId}
              aria-labelledby={titleId}
              aria-modal="true"
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut aria-hidden="true" size={16} strokeWidth={2.2} />
                  )}
                </span>
                <div className="min-w-0">
                  <h2
                    className="text-base font-semibold text-slate-950 dark:text-white"
                    id={titleId}
                  >
                    {label}
                  </h2>
                  <p
                    className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                    id={descriptionId}
                  >
                    {isLoading ? t("pendingLabel") : t("confirmMessage")}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className={actionButtonClass("neutral")}
                  disabled={isLoading}
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  {t("cancelLabel")}
                </button>
                <button
                  className={compactActionButtonClass(
                    "danger",
                    "min-h-10 min-w-[5.5rem] gap-2 rounded-xl text-sm",
                  )}
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    await signOut({ callbackUrl: "/login", redirect: true });
                  }}
                  type="button"
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? t("pendingLabel") : t("confirmLabel")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
