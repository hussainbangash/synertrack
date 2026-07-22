import { createHash, randomBytes } from "crypto";

// How long a password-reset link stays valid.
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Create a reset token pair: the raw token goes in the email link, and only its
 * SHA-256 hash is stored in the database - so a database leak can't be used to
 * reset anyone's password.
 */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
