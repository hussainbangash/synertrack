import { signOut } from "@/auth";
import {
  canAccess,
  dashboardRoutes,
  requireUser,
  roleLabels,
} from "@/lib/permissions/roles";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const visibleRoutes = dashboardRoutes.filter((route) =>
    canAccess(user.role, route.allowedRoles)
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm font-medium text-slate-500">
              SaaS Admin
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              RBAC Dashboard
            </h1>
          </div>

          <nav className="space-y-1 px-4 py-5">
            {visibleRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div>
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Signed in as
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  {user.name}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
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

          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}