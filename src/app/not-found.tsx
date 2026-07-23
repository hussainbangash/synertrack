import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
        <p className="text-sm font-medium text-slate-500">404</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you are looking for does not exist or you do not have access
          to it.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
