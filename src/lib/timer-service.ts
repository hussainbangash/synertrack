import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/permissions/access";

export type RunningTimer = {
  id: string;
  startTime: Date;
  notes: string | null;
  project: { id: string; name: string; color: string | null };
  task: { id: string; title: string } | null;
};

const runningSelect = {
  id: true,
  startTime: true,
  notes: true,
  project: { select: { id: true, name: true, color: true } },
  task: { select: { id: true, title: true } },
} as const;

function durationBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

/** Members may only log to projects they belong to; managers/admins to any. */
export async function canLog(userId: string, role: AppRole, projectId: string): Promise<boolean> {
  if (role !== "USER") return true;
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId },
    select: { id: true },
  });
  return Boolean(membership);
}

export function getRunningTimer(userId: string): Promise<RunningTimer | null> {
  return prisma.timeLog.findFirst({
    where: { userId, endTime: null },
    orderBy: { startTime: "desc" },
    select: runningSelect,
  });
}

/** Close any running timer for the user. `endOverride` trims idle time on stop. */
export async function stopRunningTimer(userId: string, endOverride?: Date) {
  const active = await prisma.timeLog.findFirst({
    where: { userId, endTime: null },
    select: { id: true, startTime: true },
  });
  if (!active) return null;
  // Never let an override predate the start.
  const end =
    endOverride && endOverride.getTime() > active.startTime.getTime() ? endOverride : new Date();
  return prisma.timeLog.update({
    where: { id: active.id },
    data: { endTime: end, durationSeconds: durationBetween(active.startTime, end) },
  });
}

/** Start a new timer, switching off any currently running one. Returns the new running timer. */
export async function startTimerFor(
  userId: string,
  input: { projectId: string; taskId?: string | null; notes?: string | null }
): Promise<RunningTimer> {
  await stopRunningTimer(userId);
  return prisma.timeLog.create({
    data: {
      userId,
      projectId: input.projectId,
      taskId: input.taskId || null,
      notes: input.notes || null,
      startTime: new Date(),
      source: "TIMER",
    },
    select: runningSelect,
  });
}
