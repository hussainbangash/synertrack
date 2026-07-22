# Design decisions

Short notes on *why* this starter is built the way it is - the reasoning behind the
non-obvious choices, and the trade-offs each one makes.

## 1. RBAC is enforced on the server, always

**Decision:** Every protected page and every mutation calls `requireUser()` / `requireRole()`
before reading or writing data. The sidebar hiding links you can't use is *cosmetic only*.

**Why:** UI-level checks are trivially bypassed (edit the DOM, hit the URL directly, call the
server action). Authorization has to live where the data access happens - the server.

**Trade-off:** A little repetition (each page/action re-declares its guard), traded for the
guarantee that there's no unprotected path.

## 2. JWT sessions **plus** a live database re-check

**Decision:** Sessions are stateless JWTs, but `requireUser()` re-reads the user from the
database on every request (and the `jwt` callback refreshes the role).

**Why:** Pure JWT is fast but *stale* - if you delete a user or demote them, their existing
token still works until it expires (up to 30 days by default). Pure database sessions are
always fresh but add a lookup + write to every request and are more moving parts. The hybrid
keeps JWT's simplicity while making **deletions and role changes take effect on the next
request**. Sessions also cap at 24h as defense-in-depth.

**Trade-off:** One extra indexed `SELECT` per protected request. Cheap, and it's the single
choke point every guard already funnels through.

## 3. Password reset invalidates existing sessions

**Decision:** Resetting a password stamps `passwordChangedAt`. Tokens issued before that
moment are rejected in `requireUser()`.

**Why:** If someone resets a password (e.g. after a compromise), any sessions the attacker
still holds must die. With stateless JWTs there's no session table to revoke, so we compare
the token's issue time against `passwordChangedAt` and force re-login when the password is
newer than the token.

## 4. Content-Security-Policy with a per-request nonce

**Decision:** `src/middleware.ts` sets a CSP with a fresh `nonce` each request;
`script-src` uses `'nonce-…' 'strict-dynamic'` instead of `'unsafe-inline'`.

**Why:** `'unsafe-inline'` defeats most of the point of a script CSP. Next.js stamps the
nonce onto its own scripts, so we get a strict policy that still lets the framework run.
Written with Web APIs (`btoa`, Web Crypto) because middleware runs in the Edge runtime where
Node's `Buffer` isn't available.

## 5. Reset tokens are hashed, single-use, and short-lived

**Decision:** The raw reset token goes only in the email link; the database stores its
SHA-256 hash. Tokens expire in 30 minutes and are consumed on use.

**Why:** If the database leaks, the stored hashes can't be turned back into working links.
Single-use + short expiry shrink the window for a stolen link. The request endpoint also
returns the *same* generic response whether or not the account exists (no user enumeration)
and is rate-limited.

## 6. Login hardening

Rate limiting (per IP + email), a **constant-time** bcrypt comparison even when the email
doesn't exist (so response time doesn't leak which emails are registered), and bcrypt cost
12. Pluggable email: real delivery via Resend when `RESEND_API_KEY` is set, otherwise the
link is logged so the flow works with zero setup.

## 7. Migrations run automatically on deploy

**Decision:** The Vercel build runs `prisma migrate deploy` before `next build`.

**Why:** The classic outage is shipping code that expects a column the database doesn't have
yet. Running migrations *as part of the build* means new code never serves against an
un-migrated schema - and if a migration fails, the build fails and the bad code never ships.
Migrations use a **direct** connection (`DIRECT_URL`), since DDL and advisory locks misbehave
through a connection pooler.

## 8. Tests + CI as a gate

Unit tests cover the permission matrix, the server-action guards, the rate limiter, and the
reset-token logic. CI runs typecheck, lint, tests, and a production build on every push/PR -
so a regression in any of the above breaks the pipeline before it reaches `main`.
