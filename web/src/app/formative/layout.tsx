import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function FormativeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider namespaces={["DeleteRecord", "Export", "Formative", "LogoutButton"]}>
      {children}
    </ScopedIntlProvider>
  );
}
