import { signOut } from "@/auth";
import {
  canAccess,
  dashboardRoutes,
  requireUser,
  roleLabels,
} from "@/lib/permissions/roles";
import { prisma } from "@/lib/prisma";
import { TimerBar } from "./timer/timer-bar";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const visibleRoutes = dashboardRoutes.filter((route) =>
    canAccess(user.role, route.allowedRoles)
  );

  const canManage = user.role === "ADMIN" || user.role === "MANAGER";
  const [timerProjects, active] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: "ACTIVE",
        ...(canManage ? {} : { members: { some: { userId: user.id } } }),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true },
        },
      },
    }),
    prisma.timeLog.findFirst({
      where: { userId: user.id, endTime: null },
      select: {
        startTime: true,
        project: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),
  ]);

  const activeTimer = active
    ? {
        projectName: active.project.name,
        taskTitle: active.task?.title ?? null,
        startTimeISO: active.startTime.toISOString(),
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        {/* Permanent sidebar from `lg` up; below that it lives in MobileNav's drawer. */}
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="font-display flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Synertrack
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Time &amp; Productivity
            </p>
          </div>

          <NavLinks routes={visibleRoutes} />
        </aside>

        {/* min-w-0 stops wide children (tables, charts) from forcing the grid wider. */}
        <div className="min-w-0">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <MobileNav routes={visibleRoutes} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    Signed in as
                  </p>
                  <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    {user.name}
                  </h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {/* Email is long, so it only appears once there is room for it. */}
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {roleLabels[user.role]}
                  </p>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await signOut({
                      redirectTo: "/login",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="px-4 pt-6 sm:px-6">
            <TimerBar active={activeTimer} projects={timerProjects} />
          </div>
          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}