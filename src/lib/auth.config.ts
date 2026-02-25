import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js configuration yang EDGE-COMPATIBLE.
 * File ini TIDAK boleh mengimpor modul Node.js (bcryptjs, prisma, dll).
 * Digunakan oleh middleware.ts untuk route protection.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 jam
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role ?? "STAFF";
        token.clinicName = user.clinicName ?? "";
        token.organizationId = user.organizationId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.clinicName = token.clinicName as string;
        session.user.organizationId = (token.organizationId as string) ?? null;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

      if (isAdminRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [], // Providers ditambahkan di auth.ts (full runtime)
};
