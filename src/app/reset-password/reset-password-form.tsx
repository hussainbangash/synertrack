"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "./actions";
import { initialActionState } from "@/lib/forms";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialActionState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">SaaS RBAC Starter</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Reset password</h1>
          <p className="mt-2 text-sm text-slate-600">Choose a new password for your account.</p>
        </div>

        {!token ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Missing reset token. Request a new link from the{" "}
            <Link href="/forgot-password" className="underline">forgot password</Link> page.
          </p>
        ) : state.status === "success" ? (
          <div className="space-y-5">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
              {state.message}
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="token" value={token} />

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={12}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Min 12 chars with uppercase, lowercase, and a number.
              </p>
            </div>

            <div>
              <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
                required
              />
            </div>

            {state.status === "error" && state.message ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
