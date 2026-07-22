import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiJson, apiPreflight } from "@/lib/desktop-api";
import { canLog, startTimerFor } from "@/lib/timer-service";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiPreflight();
}

const startSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

// POST /api/desktop/timer/start — start a timer (switching off any running one).
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return apiJson({ error: "Pick a project." }, 400);

  if (!(await canLog(auth.id, auth.role, parsed.data.projectId))) {
    return apiJson({ error: "You're not a member of that project." }, 403);
  }

  const running = await startTimerFor(auth.id, parsed.data);
  return apiJson({
    running: {
      id: running.id,
      startTime: running.startTime.toISOString(),
      notes: running.notes,
      project: running.project,
      task: running.task,
    },
    serverTime: new Date().toISOString(),
  });
}
