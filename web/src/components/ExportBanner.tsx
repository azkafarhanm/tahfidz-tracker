"use client";

import { FileSpreadsheet, FileText, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

type ExportBannerProps = {
  type: "excel" | "pdf";
  status: "loading" | "error";
  errorMessage?: string;
  onDismiss?: () => void;
};

export default function ExportBanner({
  type,
  status,
  errorMessage,
  onDismiss,
}: ExportBannerProps) {
  const t = useTranslations("Export");
  const Icon = type === "excel" ? FileSpreadsheet : FileText;

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <Loader2 className="shrink-0 animate-spin" size={18} strokeWidth={2.2} />
        <span className="flex items-center gap-2">
          <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
          {type === "excel" ? t("excelLoading") : t("pdfLoading")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <XCircle className="shrink-0" size={18} strokeWidth={2.2} />
      <span className="flex-1">
        {errorMessage ?? t("defaultError")}
      </span>
      {onDismiss ? (
        <button
          className="shrink-0 text-red-600 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          onClick={onDismiss}
          type="button"
        >
          {t("dismiss")}
        </button>
      ) : null}
    </div>
  );
}
