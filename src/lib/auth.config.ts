import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth/");
      const isPublicRoute = nextUrl.pathname === "/";

      // If on auth page and logged in, redirect to home
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // If on protected page and not logged in, redirect to sign in
      if (!isAuthPage && !isPublicRoute && !isLoggedIn) {
        return Response.redirect(new URL("/auth/sign-in", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig; 