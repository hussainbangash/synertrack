import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/permissions/access";

const TOKEN_PREFIX = "synk_";

export type ApiTokenUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

/** SHA-256 hex of a token. Tokens are high-entropy, so a fast hash is appropriate. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a new plaintext token (shown once) and its hash (stored). */
export function generateToken(): { token: string; tokenHash: string } {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

/** Pull a bearer token out of the Authorization header. */
export function bearerFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Authenticate a request by its bearer token. Returns the owning user (with the
 * live DB role) or null. Updates lastUsedAt as a side effect on success.
 */
export async function authenticateApiToken(request: Request): Promise<ApiTokenUser | null> {
  const token = bearerFromRequest(request);
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  const record = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!record) return null;

  // Best-effort touch; never let it fail the request.
  await prisma.apiToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { ...record.user, role: record.user.role as AppRole };
}
