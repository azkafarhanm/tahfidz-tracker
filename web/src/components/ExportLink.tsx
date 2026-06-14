"use client";

import { useState, type ReactNode } from "react";
import ExportBanner from "./ExportBanner";

type ExportLinkProps = {
  children: ReactNode;
  className: string;
  href: string;
  type: "excel" | "pdf";
  bannerId: string;
  onBannerChange?: (id: string, banner: ReactNode | null) => void;
};

export default function ExportLink({
  children,
  className,
  href,
  type,
  bannerId,
  onBannerChange,
}: ExportLinkProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isExporting) return;

    setIsExporting(true);
    onBannerChange?.(bannerId, <ExportBanner type={type} status="loading" />);

    try {
      const response = await fetch(href);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Export failed");
        onBannerChange?.(
          bannerId,
          <ExportBanner
            type={type}
            status="error"
            errorMessage={errorText}
            onDismiss={() => onBannerChange?.(bannerId, null)}
          />,
        );
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] ?? `export.${type === "excel" ? "xlsx" : "pdf"}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onBannerChange?.(bannerId, null);
    } catch {
      onBannerChange?.(
        bannerId,
        <ExportBanner
          type={type}
          status="error"
          onDismiss={() => onBannerChange?.(bannerId, null)}
        />,
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <a
      className={`${className} ${isExporting ? "pointer-events-none opacity-60" : ""}`}
      href={href}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
