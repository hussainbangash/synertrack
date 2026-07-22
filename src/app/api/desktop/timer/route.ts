import { NextResponse } from "next/server";
import { requireApiUser, apiJson, apiPreflight } from "@/lib/desktop-api";
import { getRunningTimer } from "@/lib/timer-service";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiPreflight();
}

// GET /api/desktop/timer — the caller's currently running timer, or null.
// serverTime lets the client compute elapsed time from the shared clock, so the
// desktop and web apps always show the same value.
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const running = await getRunningTimer(auth.id);
  return apiJson({
    running: running
      ? {
          id: running.id,
          startTime: running.startTime.toISOString(),
          notes: running.notes,
          project: running.project,
          task: running.task,
        }
      : null,
    serverTime: new Date().toISOString(),
  });
}
