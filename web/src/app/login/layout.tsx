import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ScopedIntlProvider namespaces={["Login"]}>{children}</ScopedIntlProvider>;
}
