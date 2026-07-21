# Deploying to Vercel + Neon (free tier)

A step-by-step guide to put this template live on **Vercel** (Next.js host) with a
**Neon** serverless PostgreSQL database. Both have free tiers that are enough for a demo.

> **Migrations run automatically on every deploy** — `vercel.json`'s build command runs
> `prisma migrate deploy` before `next build`, so new code never goes live against an
> un-migrated schema. You never have to remember to run migrations by hand.

## 1. Create the database (Neon)

1. In the [Neon console](https://console.neon.tech), create a new **Project** (any region).
2. Open **Dashboard → Connect** and copy the connection string(s):
   - the **Pooled** string (host contains `-pooler`) → runtime (`DATABASE_URL`)
   - the **Direct** string (pooling toggled off) → migrations (`DIRECT_URL`)

   Keeping it simple is fine too: one **direct** string works for both — just leave
   `DIRECT_URL` unset and use it as `DATABASE_URL`.

## 2. Deploy the app (Vercel)

1. In [Vercel](https://vercel.com/new), **Import** this GitHub repository.
2. Framework preset auto-detects **Next.js**. Leave the build settings as-is —
   `vercel.json` runs `prisma generate && prisma migrate deploy && next build`.
3. Add **Environment Variables** (Production):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **Pooled** Neon URL (host has `-pooler`) |
   | `DIRECT_URL` | the **Direct** Neon URL for migrations — optional if `DATABASE_URL` is already direct |
   | `AUTH_SECRET` | a long random string — generate with `npx auth secret` |

4. Click **Deploy**. The build applies any pending migrations, so your tables are
   created/updated automatically.

## 3. Seed demo users (once)

The build migrates the schema but does **not** seed data (the seed is guarded against
production and creates known-password demo accounts). Create the demo users once from
your machine:

```powershell
cd path\to\RBAC-Starter
npm install
$env:DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require"
npx prisma generate
npm run seed
```

## 4. Lock the auth URL to your domain

1. Copy your production URL (e.g. `https://your-app.vercel.app`).
2. In Vercel → **Settings → Environment Variables**, set `AUTH_URL` and `NEXTAUTH_URL`
   to that URL.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new values take effect.

Then sign in with a seeded account:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `password123` |

## Notes

- **Automatic migrations** use `DIRECT_URL` (falling back to `DATABASE_URL`), because DDL
  and advisory locks don't behave well through a transaction pooler. Every deploy —
  including previews — runs `migrate deploy`; it's idempotent, so re-runs are safe.
- **Free-tier scope:** Vercel's Hobby plan is for non-commercial use — fine for a demo/template.
- **Change the demo passwords** before sharing the link widely — `npm run seed` sets a
  known password.
