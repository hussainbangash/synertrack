import Link from "next/link";
import { DesktopDownload } from "@/components/desktop-download";

const WEB_REPO = "https://github.com/hussainbangash/synertrack";
const DESKTOP_REPO = "https://github.com/hussainbangash/synertrack-desktop";

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: "📁",
    title: "Projects & tasks",
    body: "Organize work into projects with clients, colours, and budget hours; assign tasks with estimates and status.",
  },
  {
    icon: "⏱️",
    title: "Live timer",
    body: "One running timer at a time, ticking in the header from any page. Start, stop, or add manual entries.",
  },
  {
    icon: "🧾",
    title: "Timesheets & approval",
    body: "Weekly timesheets lock your entries; managers approve or reject with a reason. You can't approve your own.",
  },
  {
    icon: "📊",
    title: "Dashboards & team view",
    body: "Hours vs a weekly target, 7-day and by-project charts, and a live view of who's tracking right now.",
  },
  {
    icon: "🖥️",
    title: "Desktop app",
    body: "A Windows tray timer with a global hotkey and automatic idle detection — idle time is subtracted from your total.",
  },
  {
    icon: "🔐",
    title: "Roles & secure auth",
    body: "Credentials + Google sign-in, sessions re-checked on every request, and role gates enforced on the server.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-bold">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          Synertrack
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="#features" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Features
          </a>
          <a href="#desktop" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Desktop app
          </a>
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-8 pt-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
          Team time tracking
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Time tracking your team will actually use
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Projects, a live timer, weekly timesheets with manager approvals, and dashboards — plus a
          desktop tray app that detects idle time and syncs automatically.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Try the live demo →
          </Link>
          <a
            href="#desktop"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Get the desktop app
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          One-click demo accounts (Admin / Manager / Member) on the sign-in page — no signup.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop app */}
      <section id="desktop" className="mx-auto max-w-3xl px-6 py-12">
        <DesktopDownload />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500">
          <p>
            Synertrack — a portfolio project by Muhammad Hussain Bangash. Built with Next.js,
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
