import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/generated/prisma-next/enums";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      teacherId?: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    teacherId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    teacherId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawIdentifier =
          typeof credentials?.identifier === "string"
            ? credentials.identifier
            : null;

        if (!rawIdentifier || !credentials?.password) {
          return null;
        }

        const identifier = rawIdentifier.trim().toLowerCase();
        const email =
          identifier === "admin"
            ? "admin@tahfidzflow.local"
            : identifier;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { teacher: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teacherId: user.teacher?.id,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherId = user.teacherId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.teacherId = token.teacherId as string | undefined;
      }
      return session;
    },
  },
});
