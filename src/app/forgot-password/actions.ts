"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import type { ActionState } from "@/lib/forms";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// The same response whether or not the account exists (avoids user enumeration).
const GENERIC =
  "If an account exists for that email, a password reset link has been sent.";

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }
  const { email } = parsed.data;

  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`pwreset:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!limit.success) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (user) {
    // One active token per user: drop any earlier ones first.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const { token, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const base = process.env.AUTH_URL || `https://${hdrs.get("host")}`;
    const resetUrl = `${base}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (error) {
      // Don't leak delivery failures to the caller; log for the operator.
      console.error("Failed to send password reset email:", error);
    }
  }

  return { status: "success", message: GENERIC };
}
