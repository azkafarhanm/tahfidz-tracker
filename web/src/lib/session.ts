import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

async function validateSessionScope(session: Session | null) {
  const scope = toSessionScope(session);

  if (!scope) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: scope.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      teacher: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  if (!user?.isActive) {
    return null;
  }

  if (user.role === "ADMIN") {
    scope.session.user.name = user.name;
    scope.session.user.email = user.email;
    scope.session.user.role = user.role;
    scope.session.user.teacherId = undefined;
    return {
      session: scope.session,
      isAdmin: true,
      teacherId: null,
    } satisfies SessionScope;
  }

  if (!user.teacher?.id || !user.teacher.isActive) {
    return null;
  }

  scope.session.user.name = user.name;
  scope.session.user.email = user.email;
  scope.session.user.role = user.role;
  scope.session.user.teacherId = user.teacher.id;

  return {
    session: scope.session,
    isAdmin: false,
    teacherId: user.teacher.id,
  } satisfies SessionScope;
}

export async function getSessionScope() {
  return validateSessionScope(await auth());
}

export async function getRequestSessionScope() {
  return validateSessionScope(await auth());
}

export async function requireSessionScope() {
  const scope = await getRequestSessionScope();

  if (!scope) {
    redirect("/login?reauth=1");
  }

  return scope;
}

export async function requireAdminScope() {
  const scope = await requireSessionScope();

  if (!scope.isAdmin) {
    redirect("/");
  }

  return scope;
}
