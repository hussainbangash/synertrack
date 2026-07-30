"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import {
  generateWeeklySummary,
  type WeeklySummaryInput,
  type WeeklySummaryResult,
} from "@/lib/ai/weekly-summary";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Seconds a completed log accounts for, preferring the stored duration. */
function logSeconds(log: {
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number | null;
}): number {
  if (log.durationSeconds != null) return log.durationSeconds;
  const end = log.endTime?.getTime() ?? log.startTime.getTime();
  return Math.max(0, Math.round((end - log.startTime.getTime()) / 1000));
}

/**
 * Build the week's figures server-side and hand them to the model.
 *
 * The client sends only the week it wants; every number is read from the
 * database under the signed-in user's own scope, so a caller cannot ask for
 * someone else's week by tampering with the payload.
 */
export async function summarizeWeek(periodStartISO: string): Promise<WeeklySummaryResult> {
  const user = await requireUser();

  const start = new Date(periodStartISO);
  if (Number.isNaN(start.getTime())) {
    return { status: "error", message: "That week is not a valid date." };
  }
  const end = new Date(start.getTime() + WEEK_MS);

  const logs = await prisma.timeLog.findMany({
    where: {
      userId: user.id,
      endTime: { not: null },
      startTime: { gte: start, lt: end },
    },
    select: {
      startTime: true,
      endTime: true,
      durationSeconds: true,
      idleSeconds: true,
      project: { select: { name: true } },
    },
  });

  let workedSeconds = 0;
  let idleSeconds = 0;
  const byProject = new Map<string, number>();
  const byDay = new Array(7).fill(0) as number[];

  for (const log of logs) {
    const secs = logSeconds(log);
    workedSeconds += secs;
    idleSeconds += log.idleSeconds;
    byProject.set(log.project.name, (byProject.get(log.project.name) ?? 0) + secs);
    // Monday-first index, matching how the weeks are bucketed elsewhere.
    const dayIdx = (log.startTime.getDay() + 6) % 7;
    byDay[dayIdx] += secs;
  }

  const input: WeeklySummaryInput = {
    weekLabel: start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    workedSeconds,
    idleSeconds,
    projects: [...byProject.entries()]
      .map(([name, seconds]) => ({ name, seconds }))
      .sort((a, b) => b.seconds - a.seconds),
    days: DAY_LABELS.map((label, i) => ({ label, seconds: byDay[i] })),
    entryCount: logs.length,
  };

  return generateWeeklySummary(input);
}
