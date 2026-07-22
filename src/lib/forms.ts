// Shared form-action state for `useActionState` forms. Kept out of any
// "use server" file because those may only export async functions.

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };

// Token creation returns the plaintext token exactly once, alongside the state.
export type DesktopTokenState = ActionState & { token?: string };
export const initialDesktopTokenState: DesktopTokenState = { status: "idle" };
