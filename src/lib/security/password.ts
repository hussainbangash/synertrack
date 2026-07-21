import { z } from "zod";

export const passwordPolicyMessage =
  "Password must be at least 12 characters and include uppercase, lowercase, and a number.";

export const passwordSchema = z
  .string()
  .min(12, passwordPolicyMessage)
  .regex(/[a-z]/, passwordPolicyMessage)
  .regex(/[A-Z]/, passwordPolicyMessage)
  .regex(/[0-9]/, passwordPolicyMessage);
