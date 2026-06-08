"use client";

import { toast } from "sonner";
import type { ReactNode } from "react";

type PdfExportLinkProps = {
  children: ReactNode;
  className: string;
  href: string;
  toastMessage: string;
};

export default function PdfExportLink({
  children,
  className,
  href,
  toastMessage,
}: PdfExportLinkProps) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => {
        toast(toastMessage, { duration: 2000 });
      }}
    >
      {children}
    </a>
  );
}
