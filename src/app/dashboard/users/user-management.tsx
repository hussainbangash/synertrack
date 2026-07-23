"use client";

import { useActionState } from "react";
import { appRoles, roleLabels } from "@/lib/permissions/access";
import type { AppRole } from "@/lib/permissions/access";
import { createUser, deleteUser, updateUserRole } from "./actions";
import { initialActionState } from "./action-state";

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
  createdLabel: string;
};

function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (status === "idle" || !message) return null;
  const styles =
    status === "error"
      ? "bg-red-50 text-red-700"
      : "bg-green-50 text-green-700";
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${styles}`} role="status">
      {message}
    </p>
  );
}

function AddUserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialActionState
  );

  return (
    <form
      action={formAction}
      className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_180px_auto]"
    >
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={12}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          Min 12 chars with uppercase, lowercase, and a number.
        </p>
      </div>

      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="USER"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900"
        >
          {appRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="lg:col-span-5">
        <StatusMessage status={state.status} message={state.message} />
      </div>
    </form>
  );
}

function UserTableRow({
  user,
  isSelf,
}: {
  user: UserRow;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRole,
    initialActionState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUser,
    initialActionState
  );

  const rowMessage =
    deleteState.status !== "idle" ? deleteState : roleState;

  return (
    <tr>
      <td className="px-6 py-4 font-medium text-slate-900">
        {user.name ?? "Unnamed user"}
      </td>
      <td className="px-6 py-4 text-slate-600">{user.email}</td>
      <td className="px-6 py-4">
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={isSelf}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {appRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSelf || rolePending}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rolePending ? "Saving..." : "Save"}
          </button>
        </form>
      </td>
      <td className="px-6 py-4 text-slate-600">{user.createdLabel}</td>
      <td className="px-6 py-4">
        <form action={deleteAction} className="space-y-2">
          <input type="hidden" name="userId" value={user.id} />
          <button
            type="submit"
            disabled={isSelf || deletePending}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletePending ? "Deleting..." : "Delete"}
          </button>
        </form>
        {rowMessage.status === "error" && rowMessage.message ? (
          <p className="mt-2 text-xs text-red-600">{rowMessage.message}</p>
        ) : null}
      </td>
    </tr>
  );
}

export function UserManagement({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-slate-500">Admin only</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">User Management</h2>
        <p className="mt-2 text-sm text-slate-600">
          Add users, assign roles, and keep access control managed from one
          protected route.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Add user</h3>
          <p className="mt-1 text-sm text-slate-500">
            New users can sign in immediately with the password you set here.
          </p>
        </div>
        <AddUserForm />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Created</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
