# RBAC Starter

[![Live demo](https://img.shields.io/badge/Live_demo-open-16a34a?style=flat-square)](https://rbacore.vercel.app)
[![CI](https://github.com/hussainbangash/RBAC-Starter/actions/workflows/ci.yml/badge.svg)](https://github.com/hussainbangash/RBAC-Starter/actions/workflows/ci.yml)

A reusable Next.js SaaS template with credentials authentication, PostgreSQL,
Prisma, and server-side role-based access control.

> **🔗 Live demo:** https://rbacore.vercel.app — sign in with
> `admin@demo.com` / `password123` (or the Manager / User demo buttons) to try the
> role-based dashboard. Running on Vercel + Neon.

Use it as a GitHub template when you want a project where auth, dashboard
routing, seeded users, and protected admin actions are already wired.

## Stack

- Next.js 16 App Router
- React 19
- NextAuth v5 credentials provider
- Prisma 7 with PostgreSQL
- Tailwind CSS 4
- Zod validation

## What Is Included

- Login page with seeded demo accounts.
- JWT sessions with role data attached to the session.
- Admin, Manager, and User roles.
- Server-side route guards for protected pages.
- Admin-only user management.
- Admin/Manager reports page.
- Admin audit-log viewer with action filtering + pagination.
- Profile page for authenticated users.
- Password reset (with session invalidation) and optional "Sign in with Google".
- Prisma schema, migration, and seed data.
- RBAC documentation and template setup checklist.

## Screenshots

| Login | Dashboard | User management |
| --- | --- | --- |
| ![Login](public/screenshots/login.png) | ![Dashboard](public/screenshots/dashboard.png) | ![Admin user management](public/screenshots/admin-users.png) |

| Manager reports | Profile | Access denied |
| --- | --- | --- |
| ![Reports](public/screenshots/manager-reports.png) | ![Profile](public/screenshots/profile.png) | ![Unauthorized](public/screenshots/unauthorized.png) |

## Demo videos

Recorded against a live PostgreSQL database.

### Live role revocation (the headline)

A signed-in Manager is demoted to USER *directly in the database* and loses access on the
very next request — no re-login required.

![Live role revocation](docs/demos/03-live-role-revocation.gif)

### Login → dashboard

![Login to dashboard](docs/demos/01-login-dashboard.gif)

### RBAC gating

A Manager is blocked from the admin-only Users page but allowed on Reports.

![RBAC gating](docs/demos/02-rbac-gating.gif)

### Admin user management

Creating a new user with the enforced password policy.

![Admin user management](docs/demos/04-user-management.gif)

Full-resolution MP4s:
[login](docs/demos/01-login-dashboard.mp4) ·
[gating](docs/demos/02-rbac-gating.mp4) ·
[revocation](docs/demos/03-live-role-revocation.mp4) ·
[user management](docs/demos/04-user-management.mp4)

## Quick Start

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Open `http://localhost:3000`.

Demo accounts after seeding:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `password123` |
| Manager | `manager@demo.com` | `password123` |
| User | `user@demo.com` | `password123` |

## Environment

Required variables:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a local auth secret with:

```bash
npx auth secret
```

## Common Commands

```bash
npm run dev          # Start the local app
npm run build        # Production build
npm run lint         # ESLint
npm test             # RBAC unit tests
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run local migrations
npm run db:deploy    # Apply migrations in deploy environments
npm run seed         # Seed demo users and data
```

## Architecture

Every request flows through the same guard path — and every protected request re-reads the
user from the database, so deletions and role changes take effect immediately:

```mermaid
flowchart TD
    Req["Browser request"] --> MW["Edge middleware<br/>per-request nonce CSP"]
    MW --> Route{"Route type"}
    Route -->|"public: /login, /forgot-password"| Pub["Render public page"]
    Route -->|"protected: /dashboard/**"| RU["requireUser()"]

    RU --> Sess["Read JWT session"]
    Sess --> DB[("PostgreSQL:<br/>re-read user by id")]
    DB -->|"user deleted"| Lo["redirect → /login"]
    DB -->|"password changed since login"| Lo
    DB -->|"ok"| RR["requireRole([...])"]
    RR -->|"role not allowed"| Un["redirect → /unauthorized"]
    RR -->|"allowed"| Comp["Server component / action"]
    Comp -->|"mutation"| Guard["requireRole() again<br/>+ Zod validation → Prisma"]
```

The reasoning behind the non-obvious choices (JWT + live DB re-check, session invalidation
on reset, nonce CSP, automated migrations, …) is written up in **[docs/DESIGN.md](docs/DESIGN.md)**.

## RBAC Model

The core access map lives in `src/lib/permissions/access.ts`.

Authentication-aware guards live in `src/lib/permissions/roles.ts`:

- `requireUser()` redirects anonymous users to `/login`.
- `requireRole([...])` redirects authenticated users without the required role
  to `/unauthorized`.

Route access:

| Route | Roles |
| --- | --- |
| `/dashboard` | Admin, Manager, User |
| `/dashboard/users` | Admin |
| `/dashboard/reports` | Admin, Manager |
| `/dashboard/audit` | Admin |
| `/dashboard/profile` | Admin, Manager, User |

See `docs/RBAC.md` for customization steps.

## Making This A GitHub Template

Push the repository to GitHub, then enable:

```text
Settings -> General -> Template repository
```

People copying the repo should create their own `.env`, run migrations, seed or
create users, and then build feature pages behind `requireUser()` or
`requireRole()`.

## Security

Built into the template:

- **Server-side enforcement** — every protected page and mutation calls
  `requireUser()` / `requireRole()`; UI filtering is only cosmetic.
- **Live role/deletion checks** — `requireUser()` re-reads the user from the
  database on every request, and the JWT callback refreshes the role, so role
  changes and account deletions take effect immediately instead of when the
  token expires. Sessions also cap at 24h.
- **Login rate limiting** — `src/lib/rate-limit.ts` throttles sign-in attempts
  per IP + email (in-memory; swap for Upstash Redis for multi-instance).
- **User-enumeration mitigation** — sign-in runs a constant-time bcrypt compare
  whether or not the email exists.
- **bcrypt cost 12** for password hashing.
- **Password reset** — token flow (`/forgot-password` → `/reset-password`) with
  **hashed, single-use, 30-minute** tokens, anti-enumeration, rate limiting, and
  **session invalidation** (a reset logs out existing sessions via a
  `passwordChangedAt` check). Sends via **Resend** if `RESEND_API_KEY` is set,
  otherwise logs the link to the server console.
- **Security headers + CSP** — HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` in `next.config.ts`, plus a per-request
  **nonce Content-Security-Policy** in `src/middleware.ts`.
- **Seed guard** — `prisma/seed.ts` refuses to run against `NODE_ENV=production`
  unless `ALLOW_PROD_SEED=1`, since it wipes tables and creates demo accounts.
- **CI** — GitHub Actions runs typecheck, lint, tests, and build on every push/PR.
- **Automated migrations** — every deploy runs `prisma migrate deploy` before serving
  (see `vercel.json`), so the live schema can't drift out of sync with the code.

Still recommended before shipping a real product: email verification and invite
flows, a breach check on passwords, multi-tenancy (an `Organization` model with
per-org roles) if you need tenant isolation, and any OAuth/SAML providers your
product requires.
