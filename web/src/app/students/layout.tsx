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
        "DeactivateStudent",
        "DeleteRecord",
        "DeleteStudent",
        "Error",
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
