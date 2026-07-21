import Link from "next/link";
import { signInWithCredentials, signInWithGoogle } from "./actions";
import { googleEnabled } from "@/auth";
import { demoAccounts, getDemoAccount } from "@/lib/auth/demo-accounts";

type LoginSearchParams = Promise<{
  demo?: string | string[];
  error?: string | string[];
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const selectedAccount = getDemoAccount(params.demo);
  const hasAuthError = Boolean(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            SaaS RBAC Starter
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use a seeded demo account or enter credentials for a user created by
            an admin.
          </p>
        </div>

        <form
          key={selectedAccount.id}
          action={signInWithCredentials}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={selectedAccount.email}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue={selectedAccount.password}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
              required
            />
          </div>

          {hasAuthError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Invalid email or password.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in
          </button>
        </form>

        {googleEnabled ? (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">OR</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                </svg>
                Sign in with Google
              </button>
            </form>
          </>
        ) : null}

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Demo accounts
          </p>

          <div className="grid gap-2">
            {demoAccounts.map((account) => (
              <Link
                key={account.email}
                href={`/login?demo=${account.id}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-900 transition hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  {account.label}
                </span>
                <span className="block text-slate-500">{account.email}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
