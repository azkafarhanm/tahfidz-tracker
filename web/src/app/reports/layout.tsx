import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

/**
 * Sends the "Reports" messages to client components on this page — the
 * foundation report panel formats its labels and dates in the browser. A
 * nested provider replaces the root one's messages, so the namespaces the root
 * layout supplies are listed again.
 */
export default function ReportsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider namespaces={["Error", "Export", "LogoutButton", "Reports"]}>
      {children}
    </ScopedIntlProvider>
  );
}
