import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe fragment (no Prisma / bcrypt). Used by `middleware.ts`.
 * Full providers + adapter live in `src/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const logged = !!auth?.user;
      const protectedPaths = ["/courses", "/notes"];
      const isProtected = protectedPaths.some((p) => path.startsWith(p));
      if (isProtected && !logged) return false;
      if ((path === "/login" || path === "/register") && logged) {
        return Response.redirect(new URL("/courses", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
