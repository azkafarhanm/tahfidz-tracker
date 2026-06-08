"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { getDeferredPrompt, triggerInstall } from "@/lib/pwa-install";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialogButton";

function getManualInstructions(t: ReturnType<typeof useTranslations<"InstallApp">>): string {
  if (typeof navigator === "undefined") return t("manualDesktop");
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return t("manualIos");
  if (/Android/.test(ua)) return t("manualAndroid");
  return t("manualDesktop");
}

export default function InstallAppButton() {
  const t = useTranslations("InstallApp");
  const [standalone, setStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (standalone) return null;

  const handleClick = async () => {
    const prompt = getDeferredPrompt();
    if (prompt) {
      setInstalling(true);
      await triggerInstall();
      setInstalling(false);
    } else {
      setShowManualDialog(true);
    }
  };

  return (
    <>
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
        disabled={installing}
        onClick={handleClick}
        type="button"
      >
        <Download aria-hidden="true" size={15} strokeWidth={2.2} />
        {installing ? t("installing") : t("buttonLabel")}
      </button>

      <ConfirmActionDialog
        cancelLabel={t("dialogClose")}
        confirmLabel={t("dialogGotIt")}
        description={getManualInstructions(t)}
        icon={<Download aria-hidden="true" size={16} strokeWidth={2.2} />}
        onConfirm={async () => ({ ok: true })}
        onOpenChange={setShowManualDialog}
        open={showManualDialog}
        pendingLabel={t("dialogGotIt")}
        title={t("dialogTitle")}
        tone="success"
      />
    </>
  );
}
