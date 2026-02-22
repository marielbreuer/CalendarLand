import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { token, name, email, password } = body;

  if (!token || !name || !email || !password) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
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

  return NextResponse.json(
    { message: "Account created successfully", userId: user.id },
    { status: 201 }
  );
}
