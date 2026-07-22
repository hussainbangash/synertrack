import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions/roles";
import { SubmitButton, ApproveButton, RejectForm } from "./timesheet-controls";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function weekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeek(start: Date): string {
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000); // Sunday
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/** Human hours+minutes, e.g. "9h 40m", "20m", "2h". */
function formatHm(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBMITTED: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = {
    SUBMITTED: "Pending approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {label[status] ?? status}
    </span>
  );
}

export default async function TimesheetsPage() {
  const user = await requireUser();
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";

  const currentStart = weekStart(new Date());
  const weeks = Array.from({ length: 4 }, (_, i) => new Date(currentStart.getTime() - i * WEEK_MS));
  const earliest = weeks[weeks.length - 1];

  const [logs, timesheets, pending] = await Promise.all([
    prisma.timeLog.findMany({
      where: { userId: user.id, endTime: { not: null }, startTime: { gte: earliest } },
      select: { startTime: true, endTime: true, durationSeconds: true, idleSeconds: true },
    }),
    prisma.timesheet.findMany({
      where: { userId: user.id, periodStart: { gte: earliest } },
      select: { periodStart: true, status: true, totalHours: true, rejectionReason: true },
    }),
    canManage
      ? prisma.timesheet.findMany({
          where: { status: "SUBMITTED", userId: { not: user.id } },
          orderBy: { submittedAt: "asc" },
          select: {
            id: true,
            periodStart: true,
            totalHours: true,
            user: { select: { name: true, email: true } },
          },
        })
      : Promise.resolve([] as { id: string; periodStart: Date; totalHours: number; user: { name: string | null; email: string | null } }[]),
  ]);

  const tsByStart = new Map(timesheets.map((t) => [t.periodStart.getTime(), t]));

  // Idle time per pending timesheet, so the approver sees the worked/idle split.
  const pendingIdle =
    canManage && pending.length > 0
      ? await prisma.timeLog.groupBy({
          by: ["timesheetId"],
          where: { timesheetId: { in: pending.map((p) => p.id) } },
          _sum: { idleSeconds: true },
        })
      : [];
  const idleByTimesheet = new Map(pendingIdle.map((g) => [g.timesheetId, g._sum.idleSeconds ?? 0]));

  function totalsForWeek(start: Date): { workedSecs: number; idleSecs: number } {
    const end = new Date(start.getTime() + WEEK_MS);
    return logs
      .filter((l) => l.startTime >= start && l.startTime < end)
      .reduce(
        (acc, l) => {
          acc.workedSecs +=
            l.durationSeconds ??
            Math.max(0, Math.round(((l.endTime?.getTime() ?? 0) - l.startTime.getTime()) / 1000));
          acc.idleSecs += l.idleSeconds;
          return acc;
        },
        { workedSecs: 0, idleSecs: 0 }
      );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold text-slate-900">Timesheets</h2>
        <p className="mt-2 text-sm text-slate-600">Submit your week for approval and track its status.</p>
      </section>

      {/* Manager approval queue */}
      {canManage ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Pending approval</h3>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing waiting on you.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {pending.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{t.user.name ?? t.user.email}</p>
                    <p className="text-xs text-slate-500">
                      {formatWeek(t.periodStart)} · {t.totalHours}h worked
                      {(idleByTimesheet.get(t.id) ?? 0) > 0
                        ? ` · ${formatHm(idleByTimesheet.get(t.id) ?? 0)} idle`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RejectForm timesheetId={t.id} />
                    <ApproveButton timesheetId={t.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* My weeks */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-3">
          <h3 className="text-lg font-semibold text-slate-900">My weeks</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {weeks.map((start) => {
            const { workedSecs, idleSecs } = totalsForWeek(start);
            const ts = tsByStart.get(start.getTime());
            const status = ts?.status;
            const workedDisplaySecs =
              status === "APPROVED" || status === "SUBMITTED"
                ? Math.round(ts!.totalHours * 3600)
                : workedSecs;
            return (
              <li key={start.toISOString()} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{formatWeek(start)}</p>
                  {workedDisplaySecs > 0 || idleSecs > 0 ? (
                    <p className="text-xs text-slate-500">
                      {formatHm(workedDisplaySecs)} worked
                      {idleSecs > 0 ? (
                        <span className="text-amber-600"> · {formatHm(idleSecs)} idle</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">No time logged</p>
                  )}
                  {status === "REJECTED" && ts?.rejectionReason ? (
                    <p className="mt-1 text-xs text-red-600">Rejected: {ts.rejectionReason}</p>
                  ) : null}
                </div>
                <div>
                  {status === "SUBMITTED" || status === "APPROVED" ? (
                    <StatusBadge status={status} />
                  ) : workedSecs > 0 ? (
                    <SubmitButton
                      periodStart={start.toISOString()}
                      label={status === "REJECTED" ? "Resubmit" : "Submit"}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No time logged</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
