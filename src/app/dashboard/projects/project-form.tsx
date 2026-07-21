"use client";

import { useActionState } from "react";
import { createProject } from "./actions";
import { initialActionState } from "@/lib/forms";

const COLORS = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B3", "#937860"];

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, initialActionState);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">New project</h3>
      <p className="mt-1 text-sm text-slate-500">
        Create a project so your team can log time against it.
      </p>

      <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label htmlFor="clientName" className="mb-2 block text-sm font-medium text-slate-700">
            Client <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label htmlFor="color" className="mb-2 block text-sm font-medium text-slate-700">
            Color
          </label>
          <select
            id="color"
            name="color"
            defaultValue={COLORS[0]}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          >
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create project"}
          </button>
          {state.status === "error" && state.message ? (
            <span className="text-sm text-red-600">{state.message}</span>
          ) : null}
          {state.status === "success" && state.message ? (
            <span className="text-sm text-green-600">{state.message}</span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
