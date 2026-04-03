import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getAuthUrl } from "@/lib/google-calendar";
import { randomBytes, createHmac } from "crypto";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  // Build a signed state: base64url(userId:nonce).hmac
  const nonce = randomBytes(16).toString("hex");
  const payload = `${userId}:${nonce}`;
  const sig = createHmac("sha256", process.env.AUTH_SECRET!).update(payload).digest("hex");
  const state = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  const url = getAuthUrl(state);

  const response = NextResponse.redirect(url);
  // Store nonce in a short-lived cookie to verify on callback
  response.cookies.set("g_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
    sameSite: "lax",
  });

  return response;
}
