"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import { generateToken } from "@/lib/api-token";
import type { DesktopTokenState } from "@/lib/forms";

const MAX_TOKENS = 5;

const createSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
});

export async function createDesktopToken(
  _prev: DesktopTokenState,
  formData: FormData
): Promise<DesktopTokenState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  const name = (parsed.success && parsed.data.name) || "Desktop app";

  const count = await prisma.apiToken.count({ where: { userId: user.id } });
  if (count >= MAX_TOKENS) {
    return { status: "error", message: `You can have at most ${MAX_TOKENS} tokens. Revoke one first.` };
  }

  const { token, tokenHash } = generateToken();
  await prisma.apiToken.create({ data: { userId: user.id, name, tokenHash } });

  revalidatePath("/dashboard/profile");
  return { status: "success", message: "Token created - copy it now, it won't be shown again.", token };
}

const revokeSchema = z.object({ tokenId: z.string().min(1) });

export async function revokeDesktopToken(
  _prev: DesktopTokenState,
  formData: FormData
): Promise<DesktopTokenState> {
  const user = await requireUser();
  const parsed = revokeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Invalid request." };

  // Scope the delete to the caller so one user can't revoke another's token.
  await prisma.apiToken.deleteMany({ where: { id: parsed.data.tokenId, userId: user.id } });

  revalidatePath("/dashboard/profile");
  return { status: "success", message: "Token revoked." };
}
