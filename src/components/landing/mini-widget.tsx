import { LiveTimer } from "./live-timer";

/** Mockup of the desktop always-on-top mini timer widget (light, to match the cards). */
export function MiniWidget() {
  return (
    <div className="flex w-64 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] text-slate-500">Acme Website Redesign</p>
        <LiveTimer baseSeconds={4517} className="text-lg font-bold text-slate-900" />
      </div>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500 text-xs text-white">
        ■
      </span>
    </div>
  );
}
