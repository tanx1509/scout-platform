import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { providers } from "./providers";
import { logAudit } from "./audit";
import { sendAdminApprovalEmail } from "../email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // We re-enable the PrismaAdapter. Note: users created by CredentialsProvider
  // (demo users) will not be saved to the database unless explicit custom logic exists.
  // The PrismaAdapter handles Google OAuth users correctly.
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt", // Use JWT for performance (less DB lookups)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/", // We redirect unauthorized to the landing page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user is passed on initial sign-in
        token.id = user.id as string;
        token.role = user.role as string; // Default is PENDING from Prisma, unless changed in DB
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.id !== "demo-user-001") {
        try {
          await logAudit(user.id, "ACCESS_REQUEST_CREATED");
          await sendAdminApprovalEmail({
            id: user.id,
            name: user.name ?? null,
            email: user.email ?? null,
          });
        } catch (e) {
          console.warn("[auth] createUser event failed (non-fatal):", e);
        }
      }
    },
    async signIn({ user }) {
      if (user.id && user.id !== "demo-user-001") {
        try { await logAudit(user.id, "LOGIN_SUCCESS"); } catch {}
      }
    },
    async signOut(message) {
      try {
        if ('token' in message && message.token?.id && message.token.id !== "demo-user-001") {
          await logAudit(message.token.id as string, "LOGOUT");
        } else if ('session' in message && message.session?.userId) {
          await logAudit(message.session.userId, "LOGOUT");
        }
      } catch {}
    }
  }
});
