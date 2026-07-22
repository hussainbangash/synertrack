import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiJson, apiPreflight, requireApiUser } from "@/lib/desktop-api";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiPreflight();
}

// GET /api/desktop/me - the signed-in user plus the projects (and open tasks)
// they can log time against. Used by the desktop app to populate its pickers.
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  const isManager = auth.role !== "USER";
  const projects = await prisma.project.findMany({
    where: isManager
      ? { status: "ACTIVE" }
      : { status: "ACTIVE", members: { some: { userId: auth.id } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      tasks: {
        where: { status: { not: "DONE" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, status: true },
      },
    },
  });

  return apiJson({
    user: { id: auth.id, name: auth.name, email: auth.email, role: auth.role },
    projects,
    serverTime: new Date().toISOString(),
  });
}
