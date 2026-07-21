"use client";

import { useActionState, useState } from "react";
import { createManualEntry } from "./actions";
import { initialActionState } from "@/lib/forms";

type TimerProject = { id: string; name: string; tasks: { id: string; title: string }[] };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualEntryForm({ projects }: { projects: TimerProject[] }) {
  const [state, formAction, pending] = useActionState(createManualEntry, initialActionState);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const tasks = projects.find((p) => p.id === projectId)?.tasks ?? [];

  if (projects.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Log time manually</h3>
      <p className="mt-1 text-sm text-slate-500">Forgot to start the timer? Add it here.</p>

      <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Project</label>
          <select
            name="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Task</label>
          <select
            name="taskId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          >
            <option value="">No task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-700">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today()}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label htmlFor="hours" className="mb-2 block text-sm font-medium text-slate-700">Hours</label>
          <input
            id="hours"
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            required
            placeholder="1.5"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
            Notes <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Logging..." : "Log time"}
          </button>
        </div>

        {state.status === "error" && state.message ? (
          <p className="text-sm text-red-600 lg:col-span-4">{state.message}</p>
        ) : null}
        {state.status === "success" && state.message ? (
          <p className="text-sm text-green-600 lg:col-span-4">{state.message}</p>
        ) : null}
      </form>
    </section>
  );
}
