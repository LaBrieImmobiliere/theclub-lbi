import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

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
