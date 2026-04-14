import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";
import { securityAudit } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email ?? "");
          const password = String(credentials?.password ?? "");
          if (!email || !password) return null;

          // Rate limit: 5 login attempts per email per 15 minutes
          const { allowed } = checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
          if (!allowed) {
            await securityAudit({ event: "RATE_LIMITED", email, details: "Login rate limited" });
            throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) {
            await securityAudit({ event: "LOGIN_FAILED", email, details: "Unknown email" });
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            await securityAudit({ event: "LOGIN_FAILED", userId: user.id, email, details: "Invalid password" });
            return null;
          }

          await securityAudit({ event: "LOGIN_SUCCESS", userId: user.id, email });
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (e) {
          console.error("authorize error:", e);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "magic",
      name: "Magic Link",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        try {
          const token = String(credentials?.token ?? "");
          if (!token) return null;

          const record = await prisma.verificationToken.findUnique({ where: { token } });
          if (!record || !record.identifier.startsWith("magic:")) return null;
          if (record.expires < new Date()) {
            await prisma.verificationToken.delete({ where: { token } });
            return null;
          }

          await prisma.verificationToken.delete({ where: { token } });

          const email = record.identifier.replace("magic:", "");
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (e) {
          console.error("magic authorize error:", e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        // Domain not set = cookie valid for exact domain only (best for PWA)
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/connexion",
    error: "/auth/connexion",
  },
});
