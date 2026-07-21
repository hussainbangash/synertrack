// Shared form-action state. Kept out of the "use server" actions file because
// such files may only export async server functions, not plain values.

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };
