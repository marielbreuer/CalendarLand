import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@app.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";

  const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });

  await prisma.calendar.createMany({
    data: [
      {
        name: "Personal",
        color: "#3b82f6",
        isDefault: true,
        sortOrder: 0,
        userId: admin.id,
      },
      {
        name: "Work",
        color: "#059669",
        isDefault: false,
        sortOrder: 1,
        userId: admin.id,
      },
    ],
  });

  console.log(`Seeded admin user (${adminEmail}) with Personal + Work calendars.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
