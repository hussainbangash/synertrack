import { NextResponse } from "next/server";
import { authenticateApiToken, type ApiTokenUser } from "@/lib/api-token";

// Bearer-token auth (not cookies), so a permissive CORS policy is safe and lets
// the Electron renderer call these routes directly.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};

export function apiJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export function apiPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Resolve the caller from their bearer token, or return a 401 response.
 * Usage: `const auth = await requireApiUser(req); if (auth instanceof NextResponse) return auth;`
 */
export async function requireApiUser(request: Request): Promise<ApiTokenUser | NextResponse> {
  const user = await authenticateApiToken(request);
  if (!user) return apiJson({ error: "Invalid or missing API token." }, 401);
  return user;
}
