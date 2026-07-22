import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, roleLabels } from "@/lib/permissions/roles";
import { DesktopDownload } from "@/components/desktop-download";
import {
  ByProjectChart,
  HoursPerDayChart,
  type DayPoint,
  type ProjectSlice,
} from "./dashboard-charts";

const DAY_MS = 24 * 60 * 60 * 1000;
const PALETTE = ["#0f172a", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

function startOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekStart(d: Date): Date {
  const date = startOfDay(d);
  const day = date.getDay(); // 0 = Sun
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day)); // back to Monday
  return date;
}

/** Seconds attributable to a log, treating a running timer as ending "now". */
function logSeconds(
  log: { startTime: Date; endTime: Date | null; durationSeconds: number | null },
  now: number
): number {
  if (log.durationSeconds != null) return log.durationSeconds;
  const end = log.endTime?.getTime() ?? now;
  return Math.max(0, Math.round((end - log.startTime.getTime()) / 1000));
}

function hours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
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

export default async function DashboardPage() {
  const user = await requireUser();
  const canManage = user.role === "ADMIN" || user.role === "MANAGER";
  const nowDate = new Date();
  const now = nowDate.getTime();
  const todayStart = startOfDay(nowDate);
  const monday = weekStart(nowDate);
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * DAY_MS);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { weeklyTargetHours: true },
  });
  const targetHours = profile?.weeklyTargetHours ?? 40;

  // The current user's logs since the start of the 7-day window (covers week + chart).
  const windowStart = monday < sevenDaysAgo ? monday : sevenDaysAgo;
  const myLogs = await prisma.timeLog.findMany({
    where: { userId: user.id, startTime: { gte: windowStart } },
    select: {
      startTime: true,
      endTime: true,
      durationSeconds: true,
      idleSeconds: true,
      project: { select: { name: true, color: true } },
    },
  });

  let weekSeconds = 0;
  let weekIdleSeconds = 0;
  let todaySeconds = 0;
  const perDay = new Map<number, number>();
  const perProject = new Map<string, { hours: number; color: string | null }>();

  for (const log of myLogs) {
    const secs = logSeconds(log, now);
    const started = log.startTime.getTime();
    if (started >= monday.getTime()) {
      weekSeconds += secs;
      weekIdleSeconds += log.idleSeconds;
      const key = log.project.name;
      const cur = perProject.get(key) ?? { hours: 0, color: log.project.color };
      cur.hours += secs;
      perProject.set(key, cur);
    }
    if (started >= todayStart.getTime()) todaySeconds += secs;
    if (started >= sevenDaysAgo.getTime()) {
      const dayKey = startOfDay(log.startTime).getTime();
      perDay.set(dayKey, (perDay.get(dayKey) ?? 0) + secs);
    }
  }

  const dayData: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sevenDaysAgo.getTime() + i * DAY_MS);
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      hours: hours(perDay.get(day.getTime()) ?? 0),
    };
  });

  const projectData: ProjectSlice[] = Array.from(perProject.entries())
    .map(([name, v], i) => ({
      name,
      hours: hours(v.hours),
      color: v.color ?? PALETTE[i % PALETTE.length],
    }))
    .filter((p) => p.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  const weekHours = hours(weekSeconds);
  const targetPct = targetHours > 0 ? Math.min(100, Math.round((weekHours / targetHours) * 100)) : 0;

  // Manager team view: who's running a timer right now + team hours this week.
  type TeamMember = {
    id: string;
    name: string;
    activeProject: string | null;
    activeSince: number | null;
    weekHours: number;
  };
  let team: TeamMember[] = [];
  if (canManage) {
    const teamLogs = await prisma.timeLog.findMany({
      where: {
        OR: [{ startTime: { gte: monday } }, { endTime: null }],
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
        durationSeconds: true,
        user: { select: { id: true, name: true, email: true } },
        project: { select: { name: true } },
      },
    });
    const byUser = new Map<string, TeamMember>();
    for (const log of teamLogs) {
      const entry =
        byUser.get(log.userId) ??
        ({
          id: log.userId,
          name: log.user.name ?? log.user.email ?? "Unknown",
          activeProject: null,
          activeSince: null,
          weekHours: 0,
        } satisfies TeamMember);
      if (log.startTime.getTime() >= monday.getTime()) {
        entry.weekHours += logSeconds(log, now);
      }
      if (log.endTime === null) {
        entry.activeProject = log.project.name;
        entry.activeSince = log.startTime.getTime();
      }
      byUser.set(log.userId, entry);
    }
    team = Array.from(byUser.values())
      .map((m) => ({ ...m, weekHours: hours(m.weekHours) }))
      .sort((a, b) => {
        if ((b.activeSince ? 1 : 0) !== (a.activeSince ? 1 : 0)) {
          return (b.activeSince ? 1 : 0) - (a.activeSince ? 1 : 0);
        }
        return b.weekHours - a.weekHours;
      });
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">Overview</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-semibold">{roleLabels[user.role]}</span>.
        </p>
      </section>

      {/* Personal stat cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">This week</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{weekHours}h</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {targetPct}% of {targetHours}h target
          </p>
          {weekIdleSeconds > 0 ? (
            <p className="mt-1 text-xs text-amber-600">{formatHm(weekIdleSeconds)} idle removed</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Today</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{hours(todaySeconds)}h</p>
          <p className="mt-2 text-xs text-slate-500">Logged since midnight</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active projects</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{projectData.length}</p>
          <p className="mt-2 text-xs text-slate-500">Worked on this week</p>
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Last 7 days</h3>
          <p className="mt-1 text-sm text-slate-500">Hours logged per day.</p>
          <div className="mt-4">
            <HoursPerDayChart data={dayData} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">This week by project</h3>
          <p className="mt-1 text-sm text-slate-500">Where your time went.</p>
          <div className="mt-4">
            <ByProjectChart data={projectData} />
          </div>
        </div>
      </section>

      {/* Manager team view */}
      {canManage ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Team this week</h3>
              <p className="mt-1 text-sm text-slate-500">
                Who is tracking right now, and hours logged since Monday.
              </p>
            </div>
            <Link
              href="/dashboard/timesheets"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Review timesheets
            </Link>
          </div>

          {team.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No time tracked by the team yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        m.activeSince ? "animate-pulse bg-green-500" : "bg-slate-300"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.activeProject ? `Working on ${m.activeProject}` : "Idle"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{m.weekHours}h</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <DesktopDownload compact />
    </div>
  );
}
