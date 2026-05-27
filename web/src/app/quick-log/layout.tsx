import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function QuickLogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider namespaces={["QuickLog", "SurahInput"]}>
      {children}
    </ScopedIntlProvider>
  );
}
