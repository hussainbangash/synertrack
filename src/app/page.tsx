import Link from "next/link";
import { DesktopDownload } from "@/components/desktop-download";
import { AppPreview } from "@/components/landing/app-preview";
import { MiniWidget } from "@/components/landing/mini-widget";

const WEB_REPO = "https://github.com/hussainbangash/synertrack";
const DESKTOP_REPO = "https://github.com/hussainbangash/synertrack-desktop";

const FEATURES: { icon: string; title: string; body: string; tint: string }[] = [
  {
    icon: "📁",
    title: "Projects & tasks",
    body: "Organize work into projects with clients, colours, and budget hours; assign tasks with estimates and status.",
    tint: "bg-blue-50",
  },
  {
    icon: "⏱️",
    title: "Live timer",
    body: "One running timer at a time, ticking in the header from any page. Start, stop, or add manual entries.",
    tint: "bg-emerald-50",
  },
  {
    icon: "🧾",
    title: "Timesheets & approval",
    body: "Weekly timesheets lock your entries; managers approve or reject with a reason. You can't approve your own.",
    tint: "bg-amber-50",
  },
  {
    icon: "📊",
    title: "Dashboards & team view",
    body: "Hours vs a weekly target, 7-day and by-project charts, and a live view of who's tracking right now.",
    tint: "bg-violet-50",
  },
  {
    icon: "🖥️",
    title: "Desktop app",
    body: "A Windows tray timer with a global hotkey and automatic idle detection - idle time is subtracted from your total.",
    tint: "bg-rose-50",
  },
  {
    icon: "🔐",
    title: "Roles & secure auth",
    body: "Credentials + Google sign-in, sessions re-checked on every request, and role gates enforced on the server.",
    tint: "bg-slate-100",
  },
];

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Start a timer",
    body: "Pick a project and hit start - from the web or the desktop tray. One timer runs at a time.",
  },
  {
    n: "2",
    title: "Submit your week",
    body: "At week's end, submit a timesheet. Your entries lock so nothing changes after you send it.",
  },
  {
    n: "3",
    title: "Manager approves",
    body: "Managers approve or reject with a reason, and the dashboard turns it all into charts.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display flex items-center gap-2 text-lg font-bold">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Synertrack
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <a href="#features" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
              Features
            </a>
            <a href="#how" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
              How it works
            </a>
            <a href="#desktop" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
              Desktop app
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-white" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="fade-up">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Time tracking your team will{" "}
              <span className="text-emerald-600">actually use</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Projects, a live timer, weekly timesheets with manager approvals, and dashboards -
              plus a desktop tray app that detects idle time and syncs automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Try the live demo →
              </Link>
              <a
                href="#desktop"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Get the desktop app
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              One-click demo accounts (Admin / Manager / Member) on the sign-in page - no signup.
            </p>
          </div>

          <div className="fade-up floaty" style={{ animationDelay: "0.15s" }}>
            <AppPreview />
          </div>
        </div>

        {/* Tech strip */}
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">
            Built with Next.js · Prisma · PostgreSQL · Auth.js · Recharts · Electron
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-2 text-slate-600">From a running timer to an approved timesheet.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Everything a team needs</h2>
          <p className="mt-2 text-slate-600">Track time, review it, and see where it goes.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${f.tint}`}>
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop spotlight */}
      <section id="desktop" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <DesktopDownload />
          </div>
          {/* Showcase with the always-on-top mini widget */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
            <p className="text-sm font-semibold text-emerald-600">Always in view</p>
            <p className="mt-1 text-slate-600">
              A tiny always-on-top timer stays visible while you work, and idle time is
              automatically subtracted.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="floaty">
                <MiniWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-8 py-14 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Start tracking in seconds
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Open the live demo with a one-click account, or grab the desktop app.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Try the live demo →
            </Link>
            <a
              href="#desktop"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Get the desktop app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500">
          <p>
            Synertrack - a portfolio project by Muhammad Hussain Bangash. Built with Next.js,
            Prisma, PostgreSQL &amp; Electron.
          </p>
          <div className="flex items-center gap-4">
            <a href={WEB_REPO} className="hover:text-slate-900">
              Web repo
            </a>
            <a href={DESKTOP_REPO} className="hover:text-slate-900">
              Desktop repo
            </a>
            <Link href="/login" className="hover:text-slate-900">
              Live demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
