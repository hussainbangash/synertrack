"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/permissions/roles";
import type { ActionState } from "@/lib/forms";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  clientName: z.string().trim().max(120).optional(),
  color: z.string().trim().max(20).optional(),
});

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, "Task title is required").max(160),
  description: z.string().trim().max(1000).optional(),
});

const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

function fail(message: string): ActionState {
  return { status: "error", message };
}
function ok(message: string): ActionState {
  return { status: "success", message };
}

export async function createProject(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = createProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid project.");
  }
  const { name, description, clientName, color } = parsed.data;

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      clientName: clientName || null,
      color: color || null,
      createdById: admin.id,
      // The creator is a member so they can log time to it immediately.
      members: { create: { userId: admin.id, role: "owner" } },
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "Project Created",
      description: `${admin.email} created project "${name}".`,
      userId: admin.id,
    },
  });

  revalidatePath("/dashboard/projects");
  return ok(`Created project "${project.name}".`);
}

export async function createTask(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "MANAGER"]);
  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid task.");
  }
  const { projectId, title, description } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return fail("That project no longer exists.");

  await prisma.task.create({
    data: { projectId, title, description: description || null },
  });

  await prisma.activityLog.create({
    data: {
      action: "Task Created",
      description: `${user.email} added task "${title}".`,
      userId: user.id,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return ok(`Added task "${title}".`);
}

export async function updateTaskStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateTaskStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Invalid status update.");
  const { taskId, status } = parsed.data;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, assigneeId: true },
  });
  if (!task) return fail("That task no longer exists.");

  // Managers/admins can move any task; members can only move their own.
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";
  if (!canManage && task.assigneeId !== user.id) {
    return fail("You can only update tasks assigned to you.");
  }

  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath(`/dashboard/projects/${task.projectId}`);
  return ok("Task updated.");
}
