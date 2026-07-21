import { describe, expect, it } from "vitest";
import { demoAccounts, getDemoAccount } from "./demo-accounts";

describe("demo account selection", () => {
  it("defaults to the admin demo account", () => {
    expect(getDemoAccount(undefined)).toEqual(demoAccounts[0]);
  });

  it("selects a requested demo account by id", () => {
    expect(getDemoAccount("manager").email).toBe("manager@demo.com");
    expect(getDemoAccount("user").email).toBe("user@demo.com");
  });

  it("falls back to admin for unknown ids", () => {
    expect(getDemoAccount("missing")).toEqual(demoAccounts[0]);
  });
});
