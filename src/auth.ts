import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 10 login attempts per IP per 15 minutes
        const ip = getClientIp(request as Request);
        const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
        if (!rl.success) {
          throw new Error("Too many login attempts. Please try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          await auditLog("login_failed", {
            details: { email: credentials.email },
            ipAddress: ip,
          });
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) {
          await auditLog("login_failed", {
            userId: user.id,
            details: { email: credentials.email },
            ipAddress: ip,
          });
          return null;
        }

        await auditLog("login", { userId: user.id, ipAddress: ip });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
