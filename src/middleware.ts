import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/notes/:path*",
    "/achievements/:path*",
    "/study/:path*",
    "/login",
    "/register",
  ],
};
