import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import { ManualEntryForm } from "./manual-entry-form";
import { DeleteEntryButton } from "./delete-entry";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function TimerPage() {
  const user = await requireUser();
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";

  const [projects, logs] = await Promise.all([
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
    prisma.timeLog.findMany({
      where: { userId: user.id, endTime: { not: null } },
      orderBy: { startTime: "desc" },
      take: 100,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        durationSeconds: true,
        notes: true,
        source: true,
        project: { select: { name: true, color: true } },
        task: { select: { title: true } },
      },
    }),
  ]);

  // Group entries by calendar day.
  const groups = new Map<
    string,
    { label: string; totalSeconds: number; entries: typeof logs }
  >();
  for (const log of logs) {
    const key = log.startTime.toISOString().slice(0, 10);
    const seconds =
      log.durationSeconds ??
      Math.max(0, Math.round(((log.endTime?.getTime() ?? 0) - log.startTime.getTime()) / 1000));
    if (!groups.has(key)) {
      groups.set(key, { label: dayLabel(log.startTime), totalSeconds: 0, entries: [] });
    }
    const g = groups.get(key)!;
    g.totalSeconds += seconds;
    g.entries.push(log);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-slate-900">Timer</h2>
        <p className="mt-2 text-sm text-slate-600">
          Start the timer in the bar above, or log time by hand — your entries show up here.
        </p>
      </section>

      <ManualEntryForm projects={projects} />

      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Recent entries</h3>
        {groups.size === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No time logged yet.
          </p>
        ) : (
          [...groups.values()].map((group) => (
            <div key={group.label} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
                <span className="text-sm font-semibold text-slate-900">{group.label}</span>
                <span className="text-sm font-medium text-slate-500">
                  {formatDuration(group.totalSeconds)}
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {group.entries.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-4 px-6 py-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.project.color ?? "#94a3b8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {entry.project.name}
                        {entry.task ? (
                          <span className="text-slate-400"> · {entry.task.title}</span>
                        ) : null}
                      </p>
                      {entry.notes ? (
                        <p className="truncate text-xs text-slate-500">{entry.notes}</p>
                      ) : null}
                    </div>
                    {entry.source === "MANUAL" ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        manual
                      </span>
                    ) : null}
                    <span className="w-16 text-right text-sm font-medium tabular-nums text-slate-700">
                      {formatDuration(
                        entry.durationSeconds ??
                          Math.round(
                            ((entry.endTime?.getTime() ?? 0) - entry.startTime.getTime()) / 1000
                          )
                      )}
                    </span>
                    <DeleteEntryButton timeLogId={entry.id} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
