"use client";

import { useState, useTransition } from "react";
import { summarizeWeek } from "./summary-actions";
import type { WeeklySummaryResult } from "@/lib/ai/weekly-summary";

/**
 * "Summarize my week" panel.
 *
 * Generation is on demand rather than on page load: it costs a model call, and
 * the page is useful without it. Rendered only when the feature is configured,
 * so an unconfigured deployment shows no dead button.
 */
export function WeeklySummary({ periodStartISO }: { periodStartISO: string }) {
  const [result, setResult] = useState<WeeklySummaryResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      setResult(await summarizeWeek(periodStartISO));
    });
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            Week in review
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              AI
            </span>
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            A short recap of this week, written from your tracked time.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Writing…" : result ? "Regenerate" : "Summarize my week"}
        </button>
      </div>

      {pending ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
        </div>
      ) : result ? (
        <div className="mt-4" aria-live="polite">
          {result.status === "ok" ? (
            <>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {result.summary}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Generated from your tracked hours. Check anything you rely on.
              </p>
            </>
          ) : (
            <p
              className={`text-sm ${result.status === "error" ? "text-red-600" : "text-slate-500"}`}
            >
              {result.message}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
