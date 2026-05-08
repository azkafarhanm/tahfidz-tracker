import { requireAdminScope } from "@/lib/session";
import AdminShell from "@/components/AdminShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdminScope();
  const userName = session.user.name?.split(" ")[0] ?? "Admin";

  return <AdminShell userName={userName}>{children}</AdminShell>;
}
