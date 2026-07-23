import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Access denied
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          You do not have permission to view this page.
        </h1>

        <p className="mt-4 text-sm text-slate-600">
          This area is restricted by role-based access control.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}