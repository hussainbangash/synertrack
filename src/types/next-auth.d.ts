import type { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "MANAGER" | "USER";

declare module "next-auth" {
  interface User {
    id: string;
    role: AppRole;
    // Epoch ms of the last password change at token-issue time (null if never).
    pwdChangedAt?: number | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      pwdChangedAt?: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    pwdChangedAt?: number | null;
  }
}

export {};
