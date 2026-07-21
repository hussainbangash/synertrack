export type AppRole = "ADMIN" | "MANAGER" | "USER";

export const appRoles = ["ADMIN", "MANAGER", "USER"] as const satisfies readonly AppRole[];

export const roleLabels: Record<AppRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

export const dashboardRoutes = [
  {
    label: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["ADMIN", "MANAGER", "USER"] as AppRole[],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    allowedRoles: ["ADMIN"] as AppRole[],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    allowedRoles: ["ADMIN", "MANAGER"] as AppRole[],
  },
  {
    label: "Audit",
    href: "/dashboard/audit",
    allowedRoles: ["ADMIN"] as AppRole[],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    allowedRoles: ["ADMIN", "MANAGER", "USER"] as AppRole[],
  },
];

export function canAccess(userRole: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(userRole);
}
