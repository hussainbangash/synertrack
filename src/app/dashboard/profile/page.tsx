import { prisma } from "@/lib/prisma";
import { requireUser, roleLabels } from "@/lib/permissions/roles";

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: {
      id: sessionUser.id,
    },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

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
    </div>
  );
}