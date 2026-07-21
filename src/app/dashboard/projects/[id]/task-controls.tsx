"use client";

import { useActionState } from "react";
import { createTask, updateTaskStatus } from "../actions";
import { initialActionState } from "@/lib/forms";

const STATUSES = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

export function AddTaskForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createTask, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex-1">
        <input
          name="title"
          type="text"
          required
          placeholder="Add a task…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
        />
        {state.status === "error" && state.message ? (
          <p className="mt-1 text-xs text-red-600">{state.message}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}

export function TaskStatusForm({
  taskId,
  status,
  canManage,
}: {
  taskId: string;
  status: string;
  canManage: boolean;
}) {
  const [, formAction, pending] = useActionState(updateTaskStatus, initialActionState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={status}
        disabled={!canManage || pending}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-950 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {canManage ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>
      ) : null}
    </form>
  );
}
