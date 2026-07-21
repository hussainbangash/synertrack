import { describe, it, expect, vi, beforeEach } from "vitest";

// Keep bcrypt cost low here so the hashing in createUser stays fast in tests.
vi.mock("@/auth", () => ({ BCRYPT_COST: 4 }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { requireRoleMock } = vi.hoisted(() => ({ requireRoleMock: vi.fn() }));
vi.mock("@/lib/permissions/roles", () => ({ requireRole: requireRoleMock }));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: { create: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { createUser, updateUserRole, deleteUser } from "./actions";
import { initialActionState } from "./action-state";

const ADMIN = { id: "admin-1", name: "Admin", email: "admin@demo.com", role: "ADMIN" };

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.append(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue(ADMIN);
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockResolvedValue({ id: "new-1" });
  prismaMock.user.update.mockResolvedValue({ email: "target@demo.com" });
  prismaMock.user.delete.mockResolvedValue({ id: "target-1" });
});

describe("user management server actions enforce the ADMIN role", () => {
  it("createUser calls requireRole(['ADMIN'])", async () => {
    await createUser(
      initialActionState,
      formData({ name: "New", email: "new@demo.com", password: "StrongPass123", role: "USER" })
    );
    expect(requireRoleMock).toHaveBeenCalledWith(["ADMIN"]);
  });

  it("updateUserRole calls requireRole(['ADMIN'])", async () => {
    await updateUserRole(initialActionState, formData({ userId: "target-1", role: "MANAGER" }));
    expect(requireRoleMock).toHaveBeenCalledWith(["ADMIN"]);
  });

  it("deleteUser calls requireRole(['ADMIN'])", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "target@demo.com" });
    await deleteUser(initialActionState, formData({ userId: "target-1" }));
    expect(requireRoleMock).toHaveBeenCalledWith(["ADMIN"]);
  });

  it("does not mutate data when the guard rejects a non-admin", async () => {
    requireRoleMock.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      createUser(
        initialActionState,
        formData({ name: "New", email: "new@demo.com", password: "StrongPass123", role: "USER" })
      )
    ).rejects.toThrow();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("user management validation and self-protection", () => {
  it("creates a user and reports success on valid input", async () => {
    const result = await createUser(
      initialActionState,
      formData({ name: "New", email: "new@demo.com", password: "StrongPass123", role: "USER" })
    );
    expect(prismaMock.user.create).toHaveBeenCalledOnce();
    expect(result.status).toBe("success");
  });

  it("rejects a duplicate email without creating a user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });
    const result = await createUser(
      initialActionState,
      formData({ name: "Dup", email: "dup@demo.com", password: "StrongPass123", role: "USER" })
    );
    expect(result.status).toBe("error");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects a too-short password", async () => {
    const result = await createUser(
      initialActionState,
      formData({ name: "Weak", email: "weak@demo.com", password: "short", role: "USER" })
    );
    expect(result.status).toBe("error");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("prevents an admin from removing their own admin role", async () => {
    const result = await updateUserRole(
      initialActionState,
      formData({ userId: ADMIN.id, role: "USER" })
    );
    expect(result.status).toBe("error");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("prevents an admin from deleting their own account", async () => {
    const result = await deleteUser(initialActionState, formData({ userId: ADMIN.id }));
    expect(result.status).toBe("error");
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });
});
