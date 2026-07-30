"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLinks, type NavRoute } from "./nav-links";

/**
 * Mobile navigation: a hamburger button that opens the sidebar as a slide-in
 * drawer. Below `lg` the static sidebar is hidden, so this is the only way to
 * navigate; from `lg` up this component is hidden and the sidebar is permanent.
 */
export function MobileNav({ routes }: { routes: NavRoute[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation, so tapping a link doesn't leave the drawer covering the page.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape and lock background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
      >
        {/* Hamburger */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="font-display flex items-center gap-2 text-lg font-bold text-slate-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Synertrack
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Time &amp; Productivity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NavLinks routes={routes} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
