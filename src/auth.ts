import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import type { AppRole } from "@/lib/permissions/access";

// Work factor for password hashing. Keep in sync with prisma/seed.ts and
// src/app/dashboard/users/actions.ts.
export const BCRYPT_COST = 12;

// A hash used to keep the timing of failed logins roughly constant whether or
// not the email exists, which mitigates user enumeration.
const DUMMY_HASH = bcrypt.hashSync("unused-dummy-password", BCRYPT_COST);

// Google sign-in is enabled only when its credentials are configured, so the app
// runs fine without them (the "Sign in with Google" button is hidden otherwise -
// see the login page). Auth.js reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    // Shorter than the 30-day default so stale tokens age out faster. Role
    // changes and deletions take effect immediately via the checks below.
    maxAge: 60 * 60 * 24, // 24 hours
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@demo.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "password123",
        },
      },

      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        // Throttle by client IP + email to slow down brute-force attempts.
        const forwardedFor = request?.headers?.get("x-forwarded-for") ?? "";
        const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
        const limit = rateLimit(`login:${ip}:${email.toLowerCase()}`);
        if (!limit.success) {
          throw new Error("Too many sign-in attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Always run a bcrypt comparison (against a dummy hash when the user is
        // missing) so response time does not reveal whether the email exists.
        const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
        const isValidPassword = await bcrypt.compare(password, hashToCheck);

        if (!user || !user.passwordHash || !isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as AppRole,
          pwdChangedAt: user.passwordChangedAt ? user.passwordChangedAt.getTime() : null,
        };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // OAuth (e.g. Google) sign-in: upsert a matching app user. New users default
      // to the USER role; an existing account is matched by its verified email.
      if (account && account.provider !== "credentials" && user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: "USER",
          },
          select: { id: true, role: true, passwordChangedAt: true },
        });
        token.id = dbUser.id;
        token.role = dbUser.role as AppRole;
        token.pwdChangedAt = dbUser.passwordChangedAt
          ? dbUser.passwordChangedAt.getTime()
          : null;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Snapshot of the password's last-changed time when this token was issued.
        // requireUser() compares it to the DB to force re-login after a reset.
        token.pwdChangedAt = user.pwdChangedAt ?? null;
        return token;
      }

      // On subsequent requests, refresh the role from the database so role
      // changes are reflected without waiting for the token to expire.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });

        if (dbUser) {
          token.role = dbUser.role as AppRole;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.pwdChangedAt = (token.pwdChangedAt as number | null) ?? null;
      }

      return session;
    },
  },
});
