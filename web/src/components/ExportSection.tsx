"use client";

import { useState, type ReactNode } from "react";
import ExportLink from "./ExportLink";

type ExportSectionProps = {
  children?: ReactNode;
  excelHref?: string;
  pdfHref?: string;
  excelClassName?: string;
  pdfClassName?: string;
  excelContent?: ReactNode;
  pdfContent?: ReactNode;
};

export default function ExportSection({
  children,
  excelHref,
  pdfHref,
  excelClassName,
  pdfClassName,
  excelContent,
  pdfContent,
}: ExportSectionProps) {
  const [banners, setBanners] = useState<Record<string, ReactNode>>({});

  function handleBannerChange(id: string, banner: ReactNode | null) {
    setBanners((prev) => {
      if (banner === null) {
        const { [id]: _, ...rest } = prev; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest;
      }
      return { ...prev, [id]: banner };
    });
  }

  const bannerValues = Object.values(banners);

  return (
    <>
      {children}
      {bannerValues.length > 0 ? (
        <div className="mt-4 space-y-2">
          {bannerValues.map((banner, i) => (
            <div key={i}>{banner}</div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {excelHref && excelContent ? (
          <ExportLink
            bannerId="excel"
            className={excelClassName ?? ""}
            href={excelHref}
            onBannerChange={handleBannerChange}
            type="excel"
          >
            {excelContent}
          </ExportLink>
        ) : null}
        {pdfHref && pdfContent ? (
          <ExportLink
            bannerId="pdf"
            className={pdfClassName ?? ""}
            href={pdfHref}
            onBannerChange={handleBannerChange}
            type="pdf"
          >
            {pdfContent}
          </ExportLink>
        ) : null}
      </div>
    </>
  );
}
