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
        "AdminClassForm",
        "AdminHalaqahForm",
        "AdminStudentForm",
        "AdminTeacherForm",
        "DeleteTeacher",
        "Error",
      ]}
    >
      <AdminShell userName={userName}>{children}</AdminShell>
    </ScopedIntlProvider>
  );
}
