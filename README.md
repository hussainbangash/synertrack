# Synertrack

[![CI](https://github.com/hussainbangash/synertrack/actions/workflows/ci.yml/badge.svg)](https://github.com/hussainbangash/synertrack/actions/workflows/ci.yml)

A **team time-tracking & productivity** web app: log work against projects, submit
weekly timesheets for approval, and see where the time goes on a dashboard.

> **🚧 Work in progress.** Built on a hardened auth/RBAC foundation; features are
> landing in phases (see status below).

## Stack

- Next.js (App Router) · React · TypeScript
- Prisma + PostgreSQL
- NextAuth (credentials + Google OAuth), server-side role-based access control
- Tailwind CSS · Zod · Recharts

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Projects & Tasks | ✅ done |
| 2 | Live timer + time logs | ⏳ next |
| 3 | Timesheets + approval | ⬜ planned |
| 4 | Dashboard + team view | ⬜ planned |
| 5 | Polish + deploy | ⬜ planned |

## Roles

- **Admin** — manages projects, members, and rates.
- **Manager** — approves timesheets and sees the team view.
- **Member** — tracks their own time and submits timesheets.

## How it works (the loop)

Start a timer on a project → it logs your hours → at week's end you submit a
timesheet → your manager approves it → the dashboard turns it all into charts.

## Local development

```powershell
npm install
copy .env.example .env          # set DATABASE_URL to a local Postgres + an AUTH_SECRET
npx prisma migrate deploy       # create the schema
npm run seed                    # demo users (admin/manager/user @demo.com / password123)
npm run dev                     # http://localhost:3000
```

## Foundation

Synertrack is built on the [RBAC-Starter](https://github.com/hussainbangash/RBAC-Starter)
template, so it inherits its server-side RBAC enforcement, live session re-checks,
password reset, nonce CSP, automated migrations, and CI. See
[`docs/DESIGN.md`](docs/DESIGN.md) for the auth/RBAC design decisions.

## License

MIT
