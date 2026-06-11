import { requireAdminScope } from "@/lib/session";
import AdminShell from "@/components/AdminShell";
import ScopedIntlProvider from "@/components/ScopedIntlProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdminScope();
  const userName = session.user.name?.split(" ")[0] ?? "Admin";

  return (
    <ScopedIntlProvider
      namespaces={[
        "AdminAcademicYear",
        "AdminClassForm",
        "AdminHalaqahForm",
        "AdminStudentForm",
        "AdminTeacherForm",
        "CharacterCounter",
        "DeleteTeacher",
        "Error",
        "LogoutButton",
      ]}
    >
      <AdminShell userName={userName}>{children}</AdminShell>
    </ScopedIntlProvider>
  );
}
