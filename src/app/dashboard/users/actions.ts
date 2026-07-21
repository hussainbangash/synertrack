"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appRoles } from "@/lib/permissions/access";
import { canAdminChangeRole, canAdminDeleteUser } from "@/lib/permissions/matrix";
import { requireRole } from "@/lib/permissions/roles";
import { passwordSchema } from "@/lib/security/password";
import { BCRYPT_COST } from "@/auth";
import type { ActionState } from "./action-state";

const roleSchema = z.enum(appRoles);

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  role: roleSchema,
});

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

function ok(message: string): ActionState {
  return { status: "success", message };
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

export async function createUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid user form submission.");
  }

  const { name, email, password, role } = parsed.data;
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return fail("A user with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  await prisma.activityLog.create({
    data: {
      action: "User Created",
      description: `${admin.email} created ${email} with the ${role} role.`,
      userId: admin.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  return ok(`Created ${email}.`);
}

export async function updateUserRole(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = updateRoleSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fail("Invalid role update submission.");
  }

  const { userId, role } = parsed.data;

  if (!canAdminChangeRole(admin.id, userId, role)) {
    return fail("Admins cannot remove their own admin role.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!targetUser) {
    return fail("That user no longer exists.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await prisma.activityLog.create({
    data: {
      action: "Role Updated",
      description: `${admin.email} changed ${targetUser.email} to ${role}.`,
      userId: admin.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  return ok(`Updated ${targetUser.email} to ${role}.`);
}

export async function deleteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fail("Invalid delete user submission.");
  }

  const { userId } = parsed.data;

  if (!canAdminDeleteUser(admin.id, userId)) {
    return fail("Admins cannot delete their own account.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!targetUser) {
    return fail("That user no longer exists.");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  await prisma.activityLog.create({
    data: {
      action: "User Deleted",
      description: `${admin.email} deleted ${targetUser.email}.`,
      userId: admin.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/users");
  return ok(`Deleted ${targetUser.email}.`);
}
