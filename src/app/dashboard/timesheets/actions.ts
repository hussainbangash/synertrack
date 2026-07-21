"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/permissions/roles";
import type { ActionState } from "@/lib/forms";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function fail(message: string): ActionState {
  return { status: "error", message };
}
function ok(message: string): ActionState {
  return { status: "success", message };
}

function logSeconds(log: { durationSeconds: number | null; startTime: Date; endTime: Date | null }) {
  return log.durationSeconds ?? Math.max(0, Math.round(((log.endTime?.getTime() ?? 0) - log.startTime.getTime()) / 1000));
}

const submitSchema = z.object({ periodStart: z.string().min(1) });

export async function submitTimesheet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = submitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid week.");

  const periodStart = new Date(parsed.data.periodStart);
  if (Number.isNaN(periodStart.getTime())) return fail("Invalid week.");
  const periodEnd = new Date(periodStart.getTime() + WEEK_MS);

  const logs = await prisma.timeLog.findMany({
    where: {
      userId: user.id,
      endTime: { not: null },
      startTime: { gte: periodStart, lt: periodEnd },
    },
    select: { id: true, durationSeconds: true, startTime: true, endTime: true },
  });
  if (logs.length === 0) return fail("No time logged for that week.");

  const totalSeconds = logs.reduce((sum, l) => sum + logSeconds(l), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

  const timesheet = await prisma.timesheet.upsert({
    where: { userId_periodStart_periodEnd: { userId: user.id, periodStart, periodEnd } },
    update: {
      status: "SUBMITTED",
      totalHours,
      submittedAt: new Date(),
      rejectionReason: null,
      approvedById: null,
      approvedAt: null,
    },
    create: { userId: user.id, periodStart, periodEnd, status: "SUBMITTED", totalHours, submittedAt: new Date() },
  });

  // Lock the entries onto this timesheet.
  await prisma.timeLog.updateMany({
    where: { id: { in: logs.map((l) => l.id) } },
    data: { timesheetId: timesheet.id },
  });

  revalidatePath("/dashboard/timesheets");
  return ok("Timesheet submitted for approval.");
}

const approveSchema = z.object({ timesheetId: z.string().min(1) });

export async function approveTimesheet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const manager = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = approveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");

  const ts = await prisma.timesheet.findUnique({
    where: { id: parsed.data.timesheetId },
    select: { userId: true, status: true },
  });
  if (!ts) return fail("That timesheet no longer exists.");
  if (ts.userId === manager.id) return fail("You can't approve your own timesheet.");
  if (ts.status !== "SUBMITTED") return fail("Only submitted timesheets can be approved.");

  await prisma.timesheet.update({
    where: { id: parsed.data.timesheetId },
    data: { status: "APPROVED", approvedById: manager.id, approvedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: {
      action: "Timesheet Approved",
      description: `${manager.email} approved a timesheet.`,
      userId: manager.id,
    },
  });

  revalidatePath("/dashboard/timesheets");
  return ok("Timesheet approved.");
}

const rejectSchema = z.object({
  timesheetId: z.string().min(1),
  reason: z.string().trim().min(1, "Give a reason for rejecting.").max(500),
});

export async function rejectTimesheet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const manager = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = rejectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request.");

  const ts = await prisma.timesheet.findUnique({
    where: { id: parsed.data.timesheetId },
    select: { userId: true, status: true },
  });
  if (!ts) return fail("That timesheet no longer exists.");
  if (ts.userId === manager.id) return fail("You can't reject your own timesheet.");
  if (ts.status !== "SUBMITTED") return fail("Only submitted timesheets can be rejected.");

  // Unlock the entries so the member can fix them and resubmit.
  await prisma.timeLog.updateMany({
    where: { timesheetId: parsed.data.timesheetId },
    data: { timesheetId: null },
  });
  await prisma.timesheet.update({
    where: { id: parsed.data.timesheetId },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason },
  });

  revalidatePath("/dashboard/timesheets");
  return ok("Timesheet rejected.");
}
