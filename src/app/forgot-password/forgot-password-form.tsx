"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "./actions";
import { initialActionState } from "@/lib/forms";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialActionState
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">SaaS RBAC Starter</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Forgot password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email and we&apos;ll send a link to reset your password.
          </p>
        </div>

        {state.status === "success" ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
              {pending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-600 underline hover:text-slate-900">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
