import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser, roleLabels } from "@/lib/permissions/roles";
import { DesktopTokens } from "./desktop-tokens";
import { DesktopDownload } from "./desktop-download";

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const [user, tokens, headerList] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { name: true, email: true, role: true, createdAt: true, updatedAt: true },
    }),
    prisma.apiToken.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    }),
    headers(),
  ]);

  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const appUrl =
    envUrl ??
    (headerList.get("host") ? `https://${headerList.get("host")}` : "http://localhost:3000");

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Profile not found
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Account
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Profile
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          All authenticated users can access their own profile.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <dl className="grid gap-5 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">
              Name
            </dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {user.name}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">
              Email
            </dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {user.email}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">
              Role
            </dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {roleLabels[user.role]}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">
              Created
            </dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {user.createdAt.toLocaleDateString("en-US")}
            </dd>
          </div>
        </dl>
      </section>

      <DesktopDownload />

      <DesktopTokens
        appUrl={appUrl}
        tokens={tokens.map((t) => ({
          id: t.id,
          name: t.name,
          lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}