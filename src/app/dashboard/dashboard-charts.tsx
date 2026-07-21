"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DayPoint = { label: string; hours: number };
export type ProjectSlice = { name: string; hours: number; color: string };

const numberFmt = (v: number) => `${Math.round(v * 10) / 10}h`;
const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export function HoursPerDayChart({ data }: { data: DayPoint[] }) {
  const empty = data.every((d) => d.hours === 0);
  if (empty) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No time logged in the last 7 days.
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#94a3b8"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#94a3b8"
            width={40}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(v) => [numberFmt(toNum(v)), "Logged"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Bar dataKey="hours" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ByProjectChart({ data }: { data: ProjectSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No project time this week yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [numberFmt(toNum(v)), n as string]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate text-slate-700">{slice.name}</span>
            <span className="font-medium text-slate-900">{numberFmt(slice.hours)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
