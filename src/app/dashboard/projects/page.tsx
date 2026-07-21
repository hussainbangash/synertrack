import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import { ProjectForm } from "./project-form";

export default async function ProjectsPage() {
  const user = await requireUser();
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";

  const projects = await prisma.project.findMany({
    where: canManage ? {} : { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      color: true,
      clientName: true,
      _count: { select: { tasks: true, members: true } },
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-slate-900">Projects</h2>
        <p className="mt-2 text-sm text-slate-600">
          {canManage
            ? "Create projects and manage their tasks."
            : "Projects you're a member of."}
        </p>
      </section>

      {canManage ? <ProjectForm /> : null}

      {projects.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No projects yet.{canManage ? " Create one above." : ""}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color ?? "#94a3b8" }}
                />
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                {project.status === "ARCHIVED" ? (
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    Archived
                  </span>
                ) : null}
              </div>
              {project.clientName ? (
                <p className="mt-1 text-xs text-slate-500">{project.clientName}</p>
              ) : null}
              {project.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>
              ) : null}
              <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <span>{project._count.tasks} tasks</span>
                <span>{project._count.members} members</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
