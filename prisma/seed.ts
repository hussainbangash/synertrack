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

  // Synertrack domain tables first (FK-safe order), then the auth/RBAC tables.
  await prisma.timeLog.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.pomodoroSession.deleteMany();
  await prisma.project.deleteMany();
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

  // ---- Synertrack demo data ----
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const weekStart = (d: Date) => {
    const x = startOfDay(d);
    const day = x.getDay();
    x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day)); // back to Monday
    return x;
  };
  const dayAt = (base: Date, addDays: number, hour: number) => {
    const x = new Date(base);
    x.setDate(x.getDate() + addDays);
    x.setHours(hour, 0, 0, 0);
    return x;
  };

  // Projects
  const acme = await prisma.project.create({
    data: {
      name: "Acme Website Redesign",
      description: "Marketing site rebuild and CMS migration.",
      color: "#2563eb",
      clientName: "Acme Inc.",
      budgetHours: 120,
      status: "ACTIVE",
      createdById: manager.id,
    },
  });
  const mobile = await prisma.project.create({
    data: {
      name: "Mobile App v2",
      description: "React Native rewrite of the customer app.",
      color: "#16a34a",
      clientName: "Northwind",
      budgetHours: 200,
      status: "ACTIVE",
      createdById: admin.id,
    },
  });
  const internal = await prisma.project.create({
    data: {
      name: "Internal Tooling",
      description: "Ops dashboards and automation.",
      color: "#d97706",
      budgetHours: 60,
      status: "ACTIVE",
      createdById: manager.id,
    },
  });

  // Project membership
  await prisma.projectMember.createMany({
    data: [
      { projectId: acme.id, userId: manager.id, role: "lead" },
      { projectId: acme.id, userId: user.id, role: "member" },
      { projectId: mobile.id, userId: manager.id, role: "member" },
      { projectId: mobile.id, userId: user.id, role: "member" },
      { projectId: internal.id, userId: manager.id, role: "lead" },
    ],
  });

  // Tasks (keep two ids for time-log assignment)
  const heroTask = await prisma.task.create({
    data: { projectId: acme.id, title: "Design homepage hero", status: "IN_PROGRESS", estimateHours: 8, assigneeId: user.id },
  });
  const blogTask = await prisma.task.create({
    data: { projectId: acme.id, title: "Migrate blog to MDX", status: "TODO", estimateHours: 12, assigneeId: user.id },
  });
  await prisma.task.createMany({
    data: [
      { projectId: acme.id, title: "Set up analytics", status: "DONE", estimateHours: 3, assigneeId: manager.id },
      { projectId: mobile.id, title: "Auth screens", status: "IN_PROGRESS", estimateHours: 16, assigneeId: user.id },
      { projectId: mobile.id, title: "Push notifications", status: "TODO", estimateHours: 10 },
      { projectId: internal.id, title: "Nightly backup job", status: "DONE", estimateHours: 4, assigneeId: manager.id },
    ],
  });

  // Completed time logs. durationSeconds is set explicitly so totals are stable
  // regardless of the machine clock. Anchored to week starts so the demo lands in
  // the right week no matter which weekday the seed runs on.
  const thisMonday = weekStart(now);
  const prevMonday = new Date(thisMonday.getTime() - 7 * DAY_MS);
  const daysSinceMonday = Math.floor((startOfDay(now).getTime() - thisMonday.getTime()) / DAY_MS);

  type LogSpec = { userId: string; projectId: string; taskId?: string; base: Date; addDays: number; hour: number; hours: number; notes?: string };
  const specs: LogSpec[] = [
    // This week — user
    { userId: user.id, projectId: acme.id, taskId: heroTask.id, base: thisMonday, addDays: 0, hour: 9, hours: 2.5, notes: "Hero layout" },
    { userId: user.id, projectId: acme.id, taskId: blogTask.id, base: thisMonday, addDays: 1, hour: 10, hours: 3, notes: "Blog migration" },
    { userId: user.id, projectId: mobile.id, base: thisMonday, addDays: 2, hour: 13, hours: 4, notes: "Auth screens" },
    { userId: user.id, projectId: acme.id, taskId: heroTask.id, base: thisMonday, addDays: 3, hour: 9, hours: 2 },
    // This week — manager
    { userId: manager.id, projectId: internal.id, base: thisMonday, addDays: 0, hour: 14, hours: 1.5 },
    { userId: manager.id, projectId: acme.id, base: thisMonday, addDays: 1, hour: 11, hours: 2 },
    // Previous week — user (feeds a submitted timesheet)
    { userId: user.id, projectId: acme.id, base: prevMonday, addDays: 1, hour: 9, hours: 6, notes: "Component library" },
    { userId: user.id, projectId: mobile.id, base: prevMonday, addDays: 2, hour: 10, hours: 5, notes: "Onboarding flow" },
  ];
  for (const s of specs) {
    // Skip this-week days that haven't happened yet (when seeding early in the week).
    if (s.base === thisMonday && s.addDays > daysSinceMonday) continue;
    const start = dayAt(s.base, s.addDays, s.hour);
    const durationSeconds = Math.round(s.hours * 3600);
    await prisma.timeLog.create({
      data: {
        userId: s.userId,
        projectId: s.projectId,
        taskId: s.taskId ?? null,
        startTime: start,
        endTime: new Date(start.getTime() + durationSeconds * 1000),
        durationSeconds,
        source: "TIMER",
        notes: s.notes ?? null,
      },
    });
  }

  // A running timer for the user, started ~20 minutes ago.
  await prisma.timeLog.create({
    data: {
      userId: user.id,
      projectId: acme.id,
      taskId: heroTask.id,
      startTime: new Date(now.getTime() - 20 * 60 * 1000),
      endTime: null,
      source: "TIMER",
      notes: "Polishing hero animation",
    },
  });

  // A SUBMITTED timesheet for last week, waiting in the manager's approval queue.
  const prevWeekEnd = new Date(prevMonday.getTime() + 7 * DAY_MS);
  const prevLogs = await prisma.timeLog.findMany({
    where: { userId: user.id, endTime: { not: null }, startTime: { gte: prevMonday, lt: prevWeekEnd } },
    select: { id: true, durationSeconds: true },
  });
  if (prevLogs.length > 0) {
    const totalHours = Math.round((prevLogs.reduce((s, l) => s + (l.durationSeconds ?? 0), 0) / 3600) * 100) / 100;
    const submitted = await prisma.timesheet.create({
      data: { userId: user.id, periodStart: prevMonday, periodEnd: prevWeekEnd, status: "SUBMITTED", totalHours, submittedAt: new Date() },
    });
    await prisma.timeLog.updateMany({ where: { id: { in: prevLogs.map((l) => l.id) } }, data: { timesheetId: submitted.id } });
  }

  // Activity feed (Synertrack-themed; surfaced on the Audit page).
  await prisma.activityLog.createMany({
    data: [
      { action: "Project Created", description: "Manager created the Acme Website Redesign project.", userId: manager.id },
      { action: "Member Added", description: "Manager added User Demo to Mobile App v2.", userId: manager.id },
      { action: "Timesheet Submitted", description: "User submitted last week's timesheet for approval.", userId: user.id },
      { action: "Timer Started", description: "User started a timer on Acme Website Redesign.", userId: user.id },
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