import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/generated/prisma-next/enums";
import { authConfig } from "@/auth.config";
import {
  checkRateLimit,
  clearRateLimit,
  getClientAddress,
  registerRateLimitFailure,
} from "@/lib/rate-limit";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

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
      async authorize(credentials, request) {
        const rawIdentifier =
          typeof credentials?.identifier === "string"
            ? credentials.identifier
            : null;

        if (!rawIdentifier || !credentials?.password) {
          return null;
        }

        const identifier = rawIdentifier.trim().toLowerCase();
        const password = credentials.password as string;
        const clientAddress = getClientAddress(request);

        // Determine if identifier is email or username
        const isEmail = identifier.includes("@");
        const rateLimitKey = `login:${identifier}:${clientAddress}`;

        const rateLimit = await checkRateLimit(rateLimitKey, {
          limit: 5,
          windowMs: 10 * 60_000,
          blockMs: 15 * 60_000,
        });

        if (!rateLimit.allowed) {
          throw new RateLimitedSignin();
        }

        // Lookup user by email or username
        const user = isEmail
          ? await prisma.user.findUnique({
              where: { email: identifier },
              include: { teacher: true },
            })
          : await prisma.user.findUnique({
              where: { username: identifier },
              include: { teacher: true },
            });

        if (!user || !user.passwordHash || !user.isActive) {
          await registerRateLimitFailure(rateLimitKey, {
            limit: 5,
            windowMs: 10 * 60_000,
            blockMs: 15 * 60_000,
          });
          return null;
        }

        if (user.role === "TEACHER" && (!user.teacher || !user.teacher.isActive)) {
          await registerRateLimitFailure(rateLimitKey, {
            limit: 5,
            windowMs: 10 * 60_000,
            blockMs: 15 * 60_000,
          });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          await registerRateLimitFailure(rateLimitKey, {
            limit: 5,
            windowMs: 10 * 60_000,
            blockMs: 15 * 60_000,
          });
          return null;
        }

        await clearRateLimit(rateLimitKey);

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
