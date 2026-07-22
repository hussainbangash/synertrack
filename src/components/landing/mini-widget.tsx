import { LiveTimer } from "./live-timer";

/** Mockup of the desktop always-on-top mini timer widget. */
export function MiniWidget() {
  return (
    <div className="flex w-64 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 shadow-2xl shadow-slate-900/30">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-slate-400">Acme Website Redesign</p>
        <LiveTimer baseSeconds={4517} className="text-lg font-bold text-white" />
      </div>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500 text-xs text-white">
        ■
      </span>
    </div>
  );
}
