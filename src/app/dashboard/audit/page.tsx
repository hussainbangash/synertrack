import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions/roles";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ action?: string | string[]; page?: string | string[] }>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(action: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dashboard/audit?${qs}` : "/dashboard/audit";
}

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["ADMIN"]);

  const params = await searchParams;
  const action = first(params.action);
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);
  const where = action ? { action } : {};

  const [logs, total, distinctActions] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const actions = distinctActions.map((row) => row.action);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">Admin only</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">Audit Log</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every recorded action across the system, newest first - {total} entr
          {total === 1 ? "y" : "ies"}.
        </p>
      </section>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" href={buildHref(undefined, 1)} active={!action} />
        {actions.map((a) => (
          <FilterChip key={a} label={a} href={buildHref(a, 1)} active={action === a} />
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">When</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No activity{action ? ` for "${action}"` : ""} yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {log.createdAt.toLocaleString("en-US")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{log.description}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.user?.name ?? log.user?.email ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <PageLink label="← Previous" href={buildHref(action, page - 1)} disabled={page <= 1} />
          <PageLink label="Next →" href={buildHref(action, page + 1)} disabled={page >= totalPages} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      }
    >
      {label}
    </Link>
  );
}

function PageLink({ label, href, disabled }: { label: string; href: string; disabled: boolean }) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-slate-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}
