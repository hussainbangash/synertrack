"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import type { ActionState } from "@/lib/forms";
import type { AppRole } from "@/lib/permissions/access";

function fail(message: string): ActionState {
  return { status: "error", message };
}
function ok(message: string): ActionState {
  return { status: "success", message };
}

// Members may only log to projects they belong to; managers/admins to any.
async function assertCanLog(userId: string, role: AppRole, projectId: string) {
  if (role !== "USER") return true;
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId },
    select: { id: true },
  });
  return Boolean(membership);
}

function durationBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

// Close any running timer for the user (used before starting a new one / on stop).
async function stopActiveTimer(userId: string) {
  const active = await prisma.timeLog.findFirst({
    where: { userId, endTime: null },
  });
  if (!active) return null;
  const end = new Date();
  return prisma.timeLog.update({
    where: { id: active.id },
    data: { endTime: end, durationSeconds: durationBetween(active.startTime, end) },
  });
}

const startSchema = z.object({
  projectId: z.string().min(1, "Pick a project."),
  taskId: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function startTimer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Pick a project.");
  const { projectId, taskId, notes } = parsed.data;

  if (!(await assertCanLog(user.id, user.role, projectId))) {
    return fail("You're not a member of that project.");
  }

  // Only one running timer at a time — starting a new one switches.
  await stopActiveTimer(user.id);

  await prisma.timeLog.create({
    data: {
      userId: user.id,
      projectId,
      taskId: taskId || null,
      notes: notes || null,
      startTime: new Date(),
      source: "TIMER",
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/timer");
  return ok("Timer started.");
}

export async function stopTimer(): Promise<void> {
  const user = await requireUser();
  await stopActiveTimer(user.id);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/timer");
}

const manualSchema = z.object({
  projectId: z.string().min(1, "Pick a project."),
  date: z.string().min(1, "Pick a date."),
  hours: z.coerce.number().positive("Hours must be positive.").max(24, "Max 24 hours."),
  taskId: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function createManualEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid entry.");
  const { projectId, date, hours, taskId, notes } = parsed.data;

  if (!(await assertCanLog(user.id, user.role, projectId))) {
    return fail("You're not a member of that project.");
  }

  const start = new Date(`${date}T09:00:00`);
  if (Number.isNaN(start.getTime())) return fail("Invalid date.");
  const durationSeconds = Math.round(hours * 3600);
  const end = new Date(start.getTime() + durationSeconds * 1000);

  await prisma.timeLog.create({
    data: {
      userId: user.id,
      projectId,
      taskId: taskId || null,
      notes: notes || null,
      startTime: start,
      endTime: end,
      durationSeconds,
      source: "MANUAL",
    },
  });

  revalidatePath("/dashboard/timer");
  revalidatePath("/dashboard", "layout");
  return ok(`Logged ${hours}h.`);
}

const deleteSchema = z.object({ timeLogId: z.string().min(1) });

export async function deleteTimeLog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid request.");

  const log = await prisma.timeLog.findUnique({
    where: { id: parsed.data.timeLogId },
    select: { userId: true, timesheetId: true },
  });
  if (!log || log.userId !== user.id) return fail("That entry no longer exists.");
  if (log.timesheetId) return fail("This entry is on a submitted timesheet and can't be deleted.");

  await prisma.timeLog.delete({ where: { id: parsed.data.timeLogId } });
  revalidatePath("/dashboard/timer");
  revalidatePath("/dashboard", "layout");
  return ok("Entry deleted.");
}
