import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({ BCRYPT_COST: 4 }));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    passwordResetToken: { findUnique: vi.fn(), update: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { resetPassword } from "./actions";
import { hashToken } from "@/lib/password-reset";
import { initialActionState } from "@/lib/forms";

function fd(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.append(k, v);
  return data;
}

const VALID = { token: "abc123", password: "StrongPass123", confirm: "StrongPass123" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("resetPassword", () => {
  it("rejects mismatched confirmation without touching the DB", async () => {
    const res = await resetPassword(initialActionState, fd({ ...VALID, confirm: "Different123" }));
    expect(res.status).toBe("error");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a weak password", async () => {
    const res = await resetPassword(initialActionState, fd({ token: "abc", password: "weak", confirm: "weak" }));
    expect(res.status).toBe("error");
    expect(prismaMock.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown / already-used / expired token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
    const res = await resetPassword(initialActionState, fd(VALID));
    expect(res.status).toBe("error");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1", userId: "u1", usedAt: null, expiresAt: new Date(Date.now() - 1000),
    });
    const res = await resetPassword(initialActionState, fd(VALID));
    expect(res.status).toBe("error");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("resets the password for a valid token (looked up by hash)", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1", userId: "u1", usedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    const res = await resetPassword(initialActionState, fd(VALID));
    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashToken(VALID.token) } })
    );
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(res.status).toBe("success");
  });
});
