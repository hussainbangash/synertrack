"use client";

import { useActionState, useState } from "react";
import { createDesktopToken, revokeDesktopToken } from "./actions";
import { initialDesktopTokenState } from "@/lib/forms";

export type TokenRow = {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
          {value}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked - user can select manually */
            }
          }}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function DesktopTokens({ tokens, appUrl }: { tokens: TokenRow[]; appUrl: string }) {
  const [state, formAction, pending] = useActionState(createDesktopToken, initialDesktopTokenState);
  const [, revokeAction, revoking] = useActionState(revokeDesktopToken, initialDesktopTokenState);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Desktop app access</h3>
          <p className="mt-1 text-sm text-slate-600">
            Create a token to sign in to the Synertrack desktop app. Treat it like a password.
          </p>
        </div>
        <form action={formAction} className="flex items-center gap-2">
          <input
            name="name"
            type="text"
            placeholder="Token name (e.g. My laptop)"
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create token"}
          </button>
        </form>
      </div>

      {state.status === "error" && state.message ? (
        <p className="mt-3 text-sm text-red-600">{state.message}</p>
      ) : null}

      {/* One-time reveal of a freshly created token */}
      {state.status === "success" && state.token ? (
        <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Copy these into the desktop app now - the token is shown only once.
          </p>
          <CopyField label="Server URL" value={appUrl} />
          <CopyField label="Access token" value={state.token} />
        </div>
      ) : null}

      {/* Existing tokens */}
      <div className="mt-5">
        {tokens.length === 0 ? (
          <p className="text-sm text-slate-500">No desktop tokens yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    Created {new Date(t.createdAt).toLocaleDateString("en-US")}
                    {t.lastUsedAt
                      ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString("en-US")}`
                      : " · never used"}
                  </p>
                </div>
                <form action={revokeAction}>
                  <input type="hidden" name="tokenId" value={t.id} />
                  <button
                    type="submit"
                    disabled={revoking}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
