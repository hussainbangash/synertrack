import { describe, expect, it } from "vitest";
import { appRoles, canAccess, dashboardRoutes, roleLabels } from "./access";

describe("RBAC access map", () => {
  it("defines labels for every app role", () => {
    for (const role of appRoles) {
      expect(roleLabels[role]).toBeTruthy();
    }
  });

  it("allows every authenticated role to access the dashboard and profile", () => {
    const dashboard = dashboardRoutes.find((route) => route.href === "/dashboard");
    const profile = dashboardRoutes.find(
      (route) => route.href === "/dashboard/profile"
    );

    expect(dashboard).toBeDefined();
    expect(profile).toBeDefined();

    for (const role of appRoles) {
      expect(canAccess(role, dashboard!.allowedRoles)).toBe(true);
      expect(canAccess(role, profile!.allowedRoles)).toBe(true);
    }
  });

  it("restricts users management to admins", () => {
    const users = dashboardRoutes.find((route) => route.href === "/dashboard/users");

    expect(users).toBeDefined();
    expect(canAccess("ADMIN", users!.allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", users!.allowedRoles)).toBe(false);
    expect(canAccess("USER", users!.allowedRoles)).toBe(false);
  });

  it("restricts the audit log to admins", () => {
    const audit = dashboardRoutes.find((route) => route.href === "/dashboard/audit");

    expect(audit).toBeDefined();
    expect(canAccess("ADMIN", audit!.allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", audit!.allowedRoles)).toBe(false);
    expect(canAccess("USER", audit!.allowedRoles)).toBe(false);
  });

  it("allows reports for admins and managers only", () => {
    const reports = dashboardRoutes.find(
      (route) => route.href === "/dashboard/reports"
    );

    expect(reports).toBeDefined();
    expect(canAccess("ADMIN", reports!.allowedRoles)).toBe(true);
    expect(canAccess("MANAGER", reports!.allowedRoles)).toBe(true);
    expect(canAccess("USER", reports!.allowedRoles)).toBe(false);
  });
});
