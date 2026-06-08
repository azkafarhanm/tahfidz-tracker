import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider namespaces={["ChangeEmail", "ChangePassword", "CharacterCounter", "InstallApp", "LogoutButton"]}>
      {children}
    </ScopedIntlProvider>
  );
}
