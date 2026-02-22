import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no prisma/bcrypt imports).
// Used by middleware for JWT verification only.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // Credentials provider added in auth.ts (Node.js only)
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        // Fall back to token.sub for backward compat with old sessions
        session.user.id = ((token.id ?? token.sub) as string) ?? "";
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
};
