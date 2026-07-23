import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import { AddTaskForm, TaskStatusForm } from "./task-controls";

const STATUS_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      color: true,
      clientName: true,
      members: {
        select: { id: true, role: true, user: { select: { name: true, email: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          assignee: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!project) notFound();

  // Members-only access for non-managers.
  const isMember = project.members.some(
    (m) => m.user.email === user.email
  );
  if (!canManage && !isMember) redirect("/dashboard/projects");

  return (
    <div className="space-y-8">
      <section>
        <Link href="/dashboard/projects" className="text-sm text-slate-500 hover:text-slate-900">
          ← All projects
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: project.color ?? "#94a3b8" }}
          />
          <h2 className="text-3xl font-bold text-slate-900">{project.name}</h2>
        </div>
        {project.clientName ? (
          <p className="mt-1 text-sm text-slate-500">Client: {project.clientName}</p>
        ) : null}
        {project.description ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{project.description}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
          <span className="text-sm text-slate-500">{project.tasks.length} total</span>
        </div>

        {canManage ? (
          <div className="mt-4">
            <AddTaskForm projectId={project.id} />
          </div>
        ) : null}

        <ul className="mt-5 divide-y divide-slate-100">
          {project.tasks.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">No tasks yet.</li>
          ) : (
            project.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.assignee
                      ? `Assigned to ${task.assignee.name ?? task.assignee.email}`
                      : "Unassigned"}
                    {" · "}
                    {STATUS_LABEL[task.status] ?? task.status}
                  </p>
                </div>
                <TaskStatusForm taskId={task.id} status={task.status} canManage={canManage} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Members</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span className="text-slate-700">{m.user.name ?? m.user.email}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
