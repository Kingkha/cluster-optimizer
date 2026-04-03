import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";

// Skip auth middleware entirely in development
const isDev = process.env.NODE_ENV === "development";

// Lightweight NextAuth config for middleware (no Prisma adapter — Edge compatible)
const { auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "unused",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "unused",
    }),
  ],
  pages: {
    signIn: "/login",
  },
});

export default auth((req) => {
  if (isDev) return NextResponse.next();
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
