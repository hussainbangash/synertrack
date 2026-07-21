# Synertrack

[![CI](https://github.com/hussainbangash/synertrack/actions/workflows/ci.yml/badge.svg)](https://github.com/hussainbangash/synertrack/actions/workflows/ci.yml)

**Team time tracking & productivity.** Log work against projects with a live timer,
submit weekly timesheets for approval, and see where the time goes on a dashboard —
with server-side role-based access control throughout.

<!-- LIVE_DEMO -->

## Features

- **Projects & tasks** — organize work into projects (client, colour, budget hours)
  with per-project membership and tasks (estimate, assignee, status).
- **Live timer** — one running timer at a time, ticking in the header from any page;
  start/stop or add manual entries.
- **Timesheets & approval** — weekly (Monday-start) periods; submitting locks the
  week's entries, managers approve or reject with a reason, rejection unlocks. You
  can't approve your own.
- **Dashboard** — hours this week vs a weekly target, hours today, a 7-day bar chart,
  and this week's split by project.
- **Team view** *(manager/admin)* — who's tracking right now (live) and everyone's
  hours since Monday.
- **Reports** *(manager/admin)* — this month's team hours by project and by member.
- **Auth & RBAC** — credentials + Google OAuth, JWT sessions re-checked against the DB
  on every request, and role gates enforced on the server (not just the UI).

## Roles

- **Admin** — manages users, projects, and sees everything.
- **Manager** — approves timesheets, sees the team view and reports.
- **Member** — tracks their own time and submits timesheets.

## How it works (the loop)

Start a timer on a project → it logs your hours → at week's end you submit a
timesheet → your manager approves it → the dashboard turns it all into charts.

## Stack

- Next.js (App Router) · React · TypeScript · Server Actions
- Prisma + PostgreSQL
- NextAuth (credentials + Google OAuth), server-side role-based access control
- Tailwind CSS · Zod · Recharts · Vitest

## Local development

```powershell
npm install
copy .env.example .env          # set DATABASE_URL to a local Postgres + an AUTH_SECRET
npx prisma migrate deploy       # create the schema
npm run seed                    # demo data + accounts (see below)
npm run dev                     # http://localhost:3000
```

### Demo accounts

All use the password `password123`:

| Role | Email |
| --- | --- |
| Admin | `admin@demo.com` |
| Manager | `manager@demo.com` |
| Member | `user@demo.com` |

The login screen also has one-click buttons to prefill each demo account.

## Checks

```powershell
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest (RBAC access map + server-action guards)
npm run build        # production build
```

## Foundation

Synertrack is built on the [RBAC-Starter](https://github.com/hussainbangash/RBAC-Starter)
template, so it inherits server-side RBAC enforcement, live session re-checks,
password reset, a nonce CSP, automated migrations, and CI. See
[`docs/DESIGN.md`](docs/DESIGN.md) for the auth/RBAC design decisions.

## License

MIT
