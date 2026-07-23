import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions/roles";

const PALETTE = ["#0f172a", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function logSeconds(
  log: { startTime: Date; endTime: Date | null; durationSeconds: number | null },
  now: number
): number {
  if (log.durationSeconds != null) return log.durationSeconds;
  const end = log.endTime?.getTime() ?? now;
  return Math.max(0, Math.round((end - log.startTime.getTime()) / 1000));
}

const hrs = (secs: number) => Math.round((secs / 3600) * 100) / 100;

export default async function ReportsPage() {
  await requireRole(["ADMIN", "MANAGER"]);

  const nowDate = new Date();
  const now = nowDate.getTime();
  const start = monthStart(nowDate);
  const monthLabel = nowDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const logs = await prisma.timeLog.findMany({
    where: { OR: [{ startTime: { gte: start } }, { endTime: null }] },
    select: {
      startTime: true,
      endTime: true,
      durationSeconds: true,
      project: { select: { name: true, color: true } },
      user: { select: { name: true, email: true } },
    },
  });

  let totalSecs = 0;
  const byProject = new Map<string, { secs: number; color: string | null }>();
  const byMember = new Map<string, number>();

  for (const log of logs) {
    if (log.startTime.getTime() < start.getTime()) continue;
    const secs = logSeconds(log, now);
    totalSecs += secs;
    const p = byProject.get(log.project.name) ?? { secs: 0, color: log.project.color };
    p.secs += secs;
    byProject.set(log.project.name, p);
    const memberKey = log.user.name ?? log.user.email ?? "Unknown";
    byMember.set(memberKey, (byMember.get(memberKey) ?? 0) + secs);
  }

  const projectRows = Array.from(byProject.entries())
    .map(([name, v], i) => ({ name, hours: hrs(v.secs), color: v.color ?? PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.hours - a.hours);
  const memberRows = Array.from(byMember.entries())
    .map(([name, secs]) => ({ name, hours: hrs(secs) }))
    .sort((a, b) => b.hours - a.hours);
  const totalHours = hrs(totalSecs);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">Admin &amp; Manager</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">Reports</h2>
        <p className="mt-2 text-sm text-slate-600">
          Team time tracked in {monthLabel}. Visible to Admin and Manager roles only.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total hours</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalHours}h</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Projects</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{projectRows.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">People tracking</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{memberRows.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">By project</h3>
          {projectRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No time tracked this month.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {projectRows.map((row) => {
                const pct = totalHours > 0 ? Math.round((row.hours / totalHours) * 100) : 0;
                return (
                  <li key={row.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.name}
                      </span>
                      <span className="font-medium text-slate-900">{row.hours}h</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">By team member</h3>
          {memberRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No time tracked this month.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {memberRows.map((row) => (
                <li key={row.name} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-700">{row.name}</span>
                  <span className="font-medium text-slate-900">{row.hours}h</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
