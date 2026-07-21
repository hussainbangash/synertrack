"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { startTimer, stopTimer } from "./actions";
import { initialActionState } from "@/lib/forms";

type TimerProject = { id: string; name: string; tasks: { id: string; title: string }[] };

type ActiveTimer = {
  projectName: string;
  taskTitle: string | null;
  startTimeISO: string;
} | null;

function format(elapsedSeconds: number): string {
  const s = Math.max(0, elapsedSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerBar({
  active,
  projects,
}: {
  active: ActiveTimer;
  projects: TimerProject[];
}) {
  if (active) return <RunningTimer active={active} />;
  return <StartTimer projects={projects} />;
}

function RunningTimer({ active }: { active: NonNullable<ActiveTimer> }) {
  const start = useMemo(() => new Date(active.startTimeISO).getTime(), [active.startTimeISO]);
  const [elapsed, setElapsed] = useState(() => Math.round((Date.now() - start) / 1000));

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [start]);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-900 px-5 py-3 text-white">
      <span className="flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-green-400" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{active.projectName}</p>
        <p className="truncate text-xs text-slate-300">{active.taskTitle ?? "No task"}</p>
      </div>
      <span className="ml-auto font-mono text-2xl tabular-nums">{format(elapsed)}</span>
      <form action={stopTimer}>
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          ■ Stop
        </button>
      </form>
    </div>
  );
}

function StartTimer({ projects }: { projects: TimerProject[] }) {
  const [state, formAction, pending] = useActionState(startTimer, initialActionState);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const tasks = projects.find((p) => p.id === projectId)?.tasks ?? [];

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-3 text-sm text-slate-500">
        No projects to track yet — ask an admin to add you to one.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3"
    >
      <select
        name="projectId"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        name="taskId"
        defaultValue=""
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
      >
        <option value="">No task</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <input
        name="notes"
        type="text"
        placeholder="What are you working on? (optional)"
        className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        ▶ Start
      </button>

      {state.status === "error" && state.message ? (
        <span className="w-full text-xs text-red-600">{state.message}</span>
      ) : null}
    </form>
  );
}
