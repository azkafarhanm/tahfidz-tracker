import type { ReactNode } from "react";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export default function StudentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ScopedIntlProvider
      namespaces={[
        "CharacterCounter",
        "DeactivateStudent",
        "DeleteRecord",
        "DeleteStudent",
        "Error",
        "HalaqahLevelDialog",
        "HalaqahLevelEditor",
        "LogoutButton",
        "ReactivateStudent",
        "StudentDetail",
        "StudentForm",
        "Students",
        "SurahInput",
        "TargetActions",
      ]}
    >
      {children}
    </ScopedIntlProvider>
  );
}
