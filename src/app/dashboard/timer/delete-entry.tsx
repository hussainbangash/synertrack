"use client";

import { useActionState } from "react";
import { deleteTimeLog } from "./actions";
import { initialActionState } from "@/lib/forms";

export function DeleteEntryButton({ timeLogId }: { timeLogId: string }) {
  const [, formAction, pending] = useActionState(deleteTimeLog, initialActionState);

  return (
    <form action={formAction}>
      <input type="hidden" name="timeLogId" value={timeLogId} />
      <button
        type="submit"
        disabled={pending}
        title="Delete entry"
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>
    </form>
  );
}
