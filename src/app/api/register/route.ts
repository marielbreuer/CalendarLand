import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  // Rate limit: 5 registrations per IP per hour
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { token, name, email, password } = body;

  if (!token || !name || !email || !password) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  const pwError = validatePassword(password);
  if (pwError) {
    return NextResponse.json({ message: pwError }, { status: 400 });
  }

  // Validate invite
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ message: "Invalid invite link" }, { status: 400 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ message: "This invite has already been used" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ message: "This invite has expired" }, { status: 400 });
  }

  // If invite has a pre-set email, enforce it
  if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { message: "This invite is for a different email address" },
      { status: 400 }
    );
  }

  // Check if email already taken
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user + default calendars in transaction, mark invite used
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        name: name.trim(),
        passwordHash,
        role: "user",
      },
    });

    await tx.calendar.createMany({
      data: [
        { name: "Personal", color: "#3b82f6", isDefault: true, sortOrder: 0, userId: newUser.id },
        { name: "Work", color: "#059669", isDefault: false, sortOrder: 1, userId: newUser.id },
      ],
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedBy: newUser.id },
    });

    return newUser;
  });

  await auditLog("register", { userId: user.id, ipAddress: ip });
  await auditLog("invite_used", {
    userId: user.id,
    details: { inviteId: invite.id, inviteCreatedBy: invite.createdBy },
    ipAddress: ip,
  });

  return NextResponse.json(
    { message: "Account created successfully", userId: user.id },
    { status: 201 }
  );
}
