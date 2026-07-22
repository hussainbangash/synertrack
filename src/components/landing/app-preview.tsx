import { LiveTimer } from "./live-timer";

const BARS = [40, 62, 48, 80, 55, 70, 33]; // % heights for the mini 7-day chart
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** An inline, responsive mockup of the Synertrack dashboard (no image files). */
export function AppPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 shadow-inner">
          synertrack.vercel.app/dashboard
        </div>
      </div>

      {/* Dashboard body */}
      <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
        {/* Running timer */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Acme Website Redesign</p>
              <p className="text-xs text-slate-500">Design homepage hero</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveTimer className="text-2xl font-bold tracking-tight text-slate-900" />
            <span className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
              Stop
            </span>
          </div>
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">This week</p>
            <p className="mt-1 text-lg font-bold text-slate-900">14h 49m</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: "37%" }} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Today</p>
            <p className="mt-1 text-lg font-bold text-slate-900">3h 12m</p>
            <p className="mt-2 text-[11px] text-amber-600">18m idle removed</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Projects</p>
            <p className="mt-1 text-lg font-bold text-slate-900">4</p>
            <p className="mt-2 text-[11px] text-slate-400">this week</p>
          </div>
        </div>

        {/* Mini chart */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Last 7 days</p>
          <div className="mt-3 flex h-24 items-end justify-between gap-2">
            {BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t-md bg-slate-900/90" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-slate-400">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
