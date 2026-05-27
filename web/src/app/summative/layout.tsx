import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function SummativeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider namespaces={["DeleteRecord", "Summative", "SurahInput"]}>
      {children}
    </ScopedIntlProvider>
  );
}
