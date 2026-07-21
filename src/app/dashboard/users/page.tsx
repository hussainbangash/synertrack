import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions/roles";
import type { AppRole } from "@/lib/permissions/access";
import { UserManagement, type UserRow } from "./user-management";

export default async function UsersPage() {
  const currentUser = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AppRole,
    createdLabel: user.createdAt.toLocaleDateString("en-US"),
  }));

  return <UserManagement users={rows} currentUserId={currentUser.id} />;
}
