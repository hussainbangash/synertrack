import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiJson, apiPreflight } from "@/lib/desktop-api";
import { stopRunningTimer } from "@/lib/timer-service";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiPreflight();
}

const stopSchema = z.object({
  // Optional idle time (seconds) to trim off the end when the user discards it.
  idleSeconds: z.coerce.number().int().min(0).max(86400).optional(),
});

// POST /api/desktop/timer/stop — stop the running timer. When idleSeconds is
// given (idle discarded), the entry ends that many seconds before now.
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const parsed = stopSchema.safeParse(body ?? {});
  const idleSeconds = parsed.success ? parsed.data.idleSeconds ?? 0 : 0;

  const stopped = await stopRunningTimer(auth.id, idleSeconds);

  return apiJson({
    stopped: Boolean(stopped),
    durationSeconds: stopped?.durationSeconds ?? null,
    idleSeconds: stopped?.idleSeconds ?? null,
    serverTime: new Date().toISOString(),
  });
}
