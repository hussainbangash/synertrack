import { prisma } from "@/lib/prisma";
import { requireUser, roleLabels } from "@/lib/permissions/roles";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  const usersCount = await prisma.user.count();
  const reportsCount = await prisma.report.count();
  const activityCount = await prisma.activityLog.count();

  const latestActivity = await prisma.activityLog.findMany({
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Overview
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          You are signed in as{" "}
          <span className="font-semibold">{roleLabels[user.role]}</span>.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Users
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {usersCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Reports
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {reportsCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Activity Logs
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {activityCount}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Latest actions recorded in the system.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {latestActivity.map((item) => (
              <div key={item.id} className="py-4">
                <p className="text-sm font-semibold text-slate-900">
                  {item.action}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  By {item.user?.name ?? "System"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Role Access
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            This dashboard uses server-side role checks. Restricted pages are
            blocked even if the user manually enters the URL.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <Link
              href="/dashboard/profile"
              className="block rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900 hover:bg-slate-50"
            >
              View profile
            </Link>

            {(user.role === "ADMIN" || user.role === "MANAGER") && (
              <Link
                href="/dashboard/reports"
                className="block rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900 hover:bg-slate-50"
              >
                View reports
              </Link>
            )}

            {user.role === "ADMIN" && (
              <Link
                href="/dashboard/users"
                className="block rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-900 hover:bg-slate-50"
              >
                Manage users
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
