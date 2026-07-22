# Template Checklist

Use this checklist when turning a copied repository into a real SaaS app.

## Required Setup

- Copy `.env.example` to `.env`.
- Set `DATABASE_URL` to a PostgreSQL database.
- Set `AUTH_SECRET` to a long random value.
- Run `npm install`.
- Run `npx prisma generate`.
- Run `npx prisma migrate deploy` for an existing migration history, or
  `npx prisma migrate dev` while developing locally.
- Run `npm run seed` if you want the demo accounts.
- Run `npm run dev`.

## Before Production

Already handled by the template:

- Login rate limiting (`src/lib/rate-limit.ts`) - swap the in-memory store for
  Upstash Redis if you run more than one instance.
- Live role/deletion checks in `requireUser()` and the JWT callback.
- Security headers in `next.config.ts` (add a tuned CSP).
- Seed guard against `NODE_ENV=production`.
- CI (typecheck, lint, test, build) in `.github/workflows/ci.yml`.

Still yours to do:

- Replace demo users and passwords (never ship the seeded `password123` accounts).
- Decide whether credentials auth is enough or whether to add OAuth/SAML.
- Add password reset + email verification and (optionally) an invite flow.
- Add a tuned Content-Security-Policy.
- Add audit log views if your admins need traceability.
- Add tests for any new roles or protected routes.
- Rotate `AUTH_SECRET` and database credentials outside source control.

## GitHub Template Repo

After pushing to GitHub, open repository settings and enable:

```text
Settings -> General -> Template repository
```

Users can then click "Use this template", add their own `.env`, run migrations,
seed or create users, and start building feature pages behind the existing RBAC
guards.
