import type { AppRole } from "@/lib/permissions/access";

export type RbacFeature = {
  feature: string;
  allowedRoles: AppRole[];
};

export const rbacFeatures: RbacFeature[] = [
  {
    feature: "View dashboard",
    allowedRoles: ["ADMIN", "MANAGER", "USER"],
  },
  {
    feature: "Manage users",
    allowedRoles: ["ADMIN"],
  },
  {
    feature: "View reports",
    allowedRoles: ["ADMIN", "MANAGER"],
  },
  {
    feature: "Edit own profile",
    allowedRoles: ["ADMIN", "MANAGER", "USER"],
  },
  {
    feature: "Change roles",
    allowedRoles: ["ADMIN"],
  },
];

export function canAdminChangeRole(
  adminId: string,
  targetUserId: string,
  nextRole: AppRole
) {
  return adminId !== targetUserId || nextRole === "ADMIN";
}

export function canAdminDeleteUser(adminId: string, targetUserId: string) {
  return adminId !== targetUserId;
}
