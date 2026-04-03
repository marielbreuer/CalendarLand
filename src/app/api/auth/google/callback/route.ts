import { NextRequest, NextResponse } from "next/server";
import { buildOAuthClient } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const settingsUrl = `${base}/calendar/settings`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}?sync_error=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?sync_error=invalid`);
  }

  // Verify signed state
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) return NextResponse.redirect(`${settingsUrl}?sync_error=invalid`);
  const payloadB64 = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString();
  } catch {
    return NextResponse.redirect(`${settingsUrl}?sync_error=invalid`);
  }

  const expectedSig = createHmac("sha256", process.env.AUTH_SECRET!).update(payload).digest("hex");
  if (sig !== expectedSig) {
    return NextResponse.redirect(`${settingsUrl}?sync_error=invalid`);
  }

  const [userId, nonce] = payload.split(":");
  const cookieNonce = request.cookies.get("g_oauth_nonce")?.value;
  if (!nonce || !cookieNonce || nonce !== cookieNonce) {
    return NextResponse.redirect(`${settingsUrl}?sync_error=invalid`);
  }

  // Exchange code for tokens
  let tokens;
  try {
    const client = buildOAuthClient();
    const result = await client.getToken(code);
    tokens = result.tokens;
  } catch {
    return NextResponse.redirect(`${settingsUrl}?sync_error=token`);
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${settingsUrl}?sync_error=no_refresh_token`);
  }

  // Fetch Google profile email
  const oauthClient = buildOAuthClient();
  oauthClient.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
  const { data: profile } = await oauth2.userinfo.get();

  await prisma.googleCalendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      googleEmail: profile.email ?? "",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
      googleCalendarId: "primary",
    },
    update: {
      googleEmail: profile.email ?? "",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
      // Reset sync token on reconnect so we do a fresh full sync
      syncToken: null,
    },
  });

  const response = NextResponse.redirect(`${settingsUrl}?sync_connected=1`);
  response.cookies.delete("g_oauth_nonce");
  return response;
}
