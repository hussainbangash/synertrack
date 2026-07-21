"use client";

import { useActionState } from "react";
import { submitTimesheet, approveTimesheet, rejectTimesheet } from "./actions";
import { initialActionState } from "@/lib/forms";

export function SubmitButton({ periodStart, label }: { periodStart: string; label: string }) {
  const [state, formAction, pending] = useActionState(submitTimesheet, initialActionState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="periodStart" value={periodStart} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "…" : label}
      </button>
      {state.status === "error" && state.message ? (
        <span className="text-xs text-red-600">{state.message}</span>
      ) : null}
    </form>
  );
}

export function ApproveButton({ timesheetId }: { timesheetId: string }) {
  const [, formAction, pending] = useActionState(approveTimesheet, initialActionState);
  return (
    <form action={formAction}>
      <input type="hidden" name="timesheetId" value={timesheetId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "…" : "Approve"}
      </button>
    </form>
  );
}

export function RejectForm({ timesheetId }: { timesheetId: string }) {
  const [state, formAction, pending] = useActionState(rejectTimesheet, initialActionState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="timesheetId" value={timesheetId} />
      <input
        name="reason"
        type="text"
        placeholder="Reason to reject…"
        className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-950 outline-none focus:border-slate-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "…" : "Reject"}
      </button>
      {state.status === "error" && state.message ? (
        <span className="text-xs text-red-600">{state.message}</span>
      ) : null}
    </form>
  );
}
