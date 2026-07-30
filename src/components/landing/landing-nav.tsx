"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#desktop", label: "Desktop app" },
];

/**
 * Landing header navigation. The section links sit inline on desktop; on mobile
 * they collapse into a menu so they stay reachable instead of being hidden.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="flex items-center gap-2 text-sm sm:gap-5">
      {SECTIONS.map((s) => (
        <a
          key={s.href}
          href={s.href}
          className="hidden text-slate-600 transition hover:text-slate-900 sm:inline"
        >
          {s.label}
        </a>
      ))}

      <Link
        href="/login"
        className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
      >
        Sign in
      </Link>

      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 sm:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Mobile dropdown, anchored under the sticky header */}
      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-slate-100 bg-white shadow-lg sm:hidden">
          <div className="flex flex-col px-6 py-2">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-slate-700 transition hover:bg-slate-50"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
