import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Safety guard: this seed wipes every table and creates accounts with a known
  // password. Refuse to run it against a production database unless explicitly
  // overridden with ALLOW_PROD_SEED=1.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "1") {
    throw new Error(
      "Refusing to seed in production (NODE_ENV=production). " +
        "This deletes all data and creates demo accounts. " +
        "Set ALLOW_PROD_SEED=1 to override intentionally."
    );
  }

  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.activityLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.dashboardMetric.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin Demo",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Manager Demo",
      email: "manager@demo.com",
      passwordHash,
      role: "MANAGER",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "User Demo",
      email: "user@demo.com",
      passwordHash,
      role: "USER",
    },
  });

  await prisma.dashboardMetric.createMany({
    data: [
      {
        label: "Total Revenue",
        value: 128500,
        change: 12.5,
        category: "finance",
        month: "Jan",
      },
      {
        label: "Active Users",
        value: 2840,
        change: 8.2,
        category: "users",
        month: "Feb",
      },
      {
        label: "Conversion Rate",
        value: 6.8,
        change: 1.4,
        category: "sales",
        month: "Mar",
      },
      {
        label: "Open Reports",
        value: 24,
        change: -2.1,
        category: "reports",
        month: "Apr",
      },
      {
        label: "Total Revenue",
        value: 142300,
        change: 10.7,
        category: "finance",
        month: "May",
      },
      {
        label: "Active Users",
        value: 3150,
        change: 9.8,
        category: "users",
        month: "Jun",
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        action: "User Created",
        description: "Admin created a new manager account.",
        userId: admin.id,
      },
      {
        action: "Report Published",
        description: "Manager published the monthly growth report.",
        userId: manager.id,
      },
      {
        action: "Profile Updated",
        description: "User updated their profile information.",
        userId: user.id,
      },
      {
        action: "Dashboard Viewed",
        description: "Admin reviewed system-wide analytics.",
        userId: admin.id,
      },
    ],
  });

  await prisma.report.createMany({
    data: [
      {
        title: "Monthly Revenue Report",
        description: "Overview of monthly revenue, growth, and conversion performance.",
        status: "PUBLISHED",
        createdById: admin.id,
      },
      {
        title: "User Growth Analysis",
        description: "Breakdown of active users, signups, and retention trends.",
        status: "PUBLISHED",
        createdById: manager.id,
      },
      {
        title: "Q2 Operational Review",
        description: "Internal review of platform activity and report performance.",
        status: "DRAFT",
        createdById: manager.id,
      },
    ],
  });

  console.log("Database seeded successfully.");
  console.log("Demo accounts:");
  console.log("Admin: admin@demo.com / password123");
  console.log("Manager: manager@demo.com / password123");
  console.log("User: user@demo.com / password123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });