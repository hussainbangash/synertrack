"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function signInWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }

    throw error;
  }
}

export async function signInWithGoogle() {
  // Redirects to Google's consent screen, then back to /dashboard.
  await signIn("google", { redirectTo: "/dashboard" });
}
