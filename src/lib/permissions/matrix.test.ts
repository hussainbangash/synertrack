import { describe, expect, it } from "vitest";
import { canAccess } from "./access";
import {
  canAdminChangeRole,
  canAdminDeleteUser,
  rbacFeatures,
} from "./matrix";

function feature(name: string) {
  const found = rbacFeatures.find((item) => item.feature === name);

  if (!found) {
    throw new Error(`Missing RBAC feature: ${name}`);
  }

  return found;
}

describe("RBAC feature matrix", () => {
  it("allows dashboard and own profile access for every role", () => {
    for (const role of ["ADMIN", "MANAGER", "USER"] as const) {
      expect(canAccess(role, feature("View dashboard").allowedRoles)).toBe(true);
      expect(canAccess(role, feature("Edit own profile").allowedRoles)).toBe(
        true
      );
    }
  });

  it("restricts user management and role changes to admins", () => {
    expect(canAccess("ADMIN", feature("Manage users").allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", feature("Manage users").allowedRoles)).toBe(
      false
    );
    expect(canAccess("USER", feature("Manage users").allowedRoles)).toBe(false);

    expect(canAccess("ADMIN", feature("Change roles").allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", feature("Change roles").allowedRoles)).toBe(
      false
    );
    expect(canAccess("USER", feature("Change roles").allowedRoles)).toBe(false);
  });

  it("blocks unauthorized users from report access", () => {
    expect(canAccess("ADMIN", feature("View reports").allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", feature("View reports").allowedRoles)).toBe(
      true
    );
    expect(canAccess("USER", feature("View reports").allowedRoles)).toBe(false);
  });

  it("prevents admins from deleting themselves", () => {
    expect(canAdminDeleteUser("admin-1", "user-1")).toBe(true);
    expect(canAdminDeleteUser("admin-1", "admin-1")).toBe(false);
  });

  it("prevents admins from removing their own admin role", () => {
    expect(canAdminChangeRole("admin-1", "user-1", "USER")).toBe(true);
    expect(canAdminChangeRole("admin-1", "admin-1", "ADMIN")).toBe(true);
    expect(canAdminChangeRole("admin-1", "admin-1", "MANAGER")).toBe(false);
    expect(canAdminChangeRole("admin-1", "admin-1", "USER")).toBe(false);
  });
});
