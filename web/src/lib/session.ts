import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionScope = {
  session: Session;
  isAdmin: boolean;
  teacherId: string | null;
};

function toSessionScope(session: Session | null): SessionScope | null {
  if (!session?.user) {
    return null;
  }

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin && !session.user.teacherId) {
    return null;
  }

  return {
    session,
    isAdmin,
    teacherId: isAdmin ? null : session.user.teacherId!,
  };
}

export async function getSessionScope() {
  return toSessionScope(await auth());
}

export async function requireSessionScope() {
  const scope = toSessionScope(await auth());

  if (!scope) {
    redirect("/login");
  }

  return scope;
}
