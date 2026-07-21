import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions/roles";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "MANAGER"]);

  const reports = await prisma.report.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: true,
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Admin and Manager
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Reports
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Reports are available to Admin and Manager roles only.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {report.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {report.description}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {report.status}
              </span>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
              Created by {report.createdBy.name ?? "Unknown"} on{" "}
              {report.createdAt.toLocaleDateString("en-US")}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
