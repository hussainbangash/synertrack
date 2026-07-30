"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavRoute = { label: string; href: string };

/** "/dashboard" must match exactly, since it prefixes every other route. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The dashboard navigation links, shared by the desktop sidebar and the mobile
 * drawer so both always show the same routes and the same active state.
 */
export function NavLinks({
  routes,
  onNavigate,
}: {
  routes: NavRoute[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-4 py-5">
      {routes.map((route) => {
        const active = isActive(pathname, route.href);
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
