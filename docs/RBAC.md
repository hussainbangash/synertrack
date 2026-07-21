# RBAC Architecture

This template uses server-side role checks as the source of truth. UI navigation
is filtered by role, but restricted pages and mutations also call protected
helpers before they read or write data.

`requireUser()` re-reads the account from the database on every request rather
than trusting the JWT alone. This means a changed role or a deleted account is
enforced immediately, not only when the token expires. The `jwt` callback in
`src/auth.ts` also refreshes the role so session-derived UI (like the sidebar)
stays in sync.

## Roles

The starter ships with three roles:

- `ADMIN`: full dashboard access, user management, reports, profile.
- `MANAGER`: dashboard, reports, profile.
- `USER`: dashboard and profile.

Role constants and route permissions live in:

```text
src/lib/permissions/access.ts
```

Authentication-aware helpers live in:

```text
src/lib/permissions/roles.ts
```

Use `requireUser()` for authenticated-only pages. Use `requireRole([...])` for
role-restricted pages and server actions.

## Protected Routes

Current routes:

| Route | Access |
| --- | --- |
| `/dashboard` | Admin, Manager, User |
| `/dashboard/users` | Admin |
| `/dashboard/reports` | Admin, Manager |
| `/dashboard/audit` | Admin |
| `/dashboard/profile` | Admin, Manager, User |

The dashboard layout filters sidebar links with `canAccess()`. Each restricted
page still calls `requireRole()` so manually entering a URL does not bypass RBAC.

## Adding A New Role

1. Add the role to the Prisma `Role` enum in `prisma/schema.prisma`.
2. Create and apply a Prisma migration.
3. Add the role to `appRoles` and `roleLabels` in `src/lib/permissions/access.ts`.
4. Add the role to any route `allowedRoles` arrays that should allow it.
5. Update seed data in `prisma/seed.ts` if you want a demo account.
6. Run `npm test`, `npm run lint`, and `npm run build`.

## Adding A Protected Page

1. Add a route entry in `dashboardRoutes`.
2. Create the page under `src/app/dashboard`.
3. Call `requireRole(["ADMIN"])`, `requireRole(["ADMIN", "MANAGER"])`, or
   `requireUser()` at the top of the server component.
4. If the page mutates data, call the same guard inside the server action.

## User Management

Admins can create users, update roles, and delete users from `/dashboard/users`.
The server actions live in:

```text
src/app/dashboard/users/actions.ts
```

The actions intentionally prevent an admin from deleting their own account or
removing their own admin role.
