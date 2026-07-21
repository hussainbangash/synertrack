import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccess, type AppRole } from "@/lib/permissions/access";

export { appRoles, canAccess, dashboardRoutes, roleLabels, type AppRole } from "@/lib/permissions/access";

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

/**
 * Require an authenticated user and re-validate them against the database.
 *
 * This is the single choke point for every protected page and server action, so
 * re-reading the user here means that a deleted account or a changed role takes
 * effect immediately — not only once the JWT expires.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, passwordChangedAt: true },
  });

  // User was deleted (or disabled) after the token was issued.
  if (!dbUser) {
    redirect("/login");
  }

  // Password was reset after this session's token was issued -> force re-login.
  const dbChanged = dbUser.passwordChangedAt ? dbUser.passwordChangedAt.getTime() : null;
  if (dbChanged !== (session.user.pwdChangedAt ?? null)) {
    redirect("/login");
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as AppRole,
  };
}

export async function requireRole(allowedRoles: AppRole[]): Promise<CurrentUser> {
  const user = await requireUser();

  if (!canAccess(user.role, allowedRoles)) {
    redirect("/unauthorized");
  }

  return user;
}
