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
  const response = NextResponse.next();
  // Pass pathname to layout so it can hide sidebar on public pages
  response.headers.set("x-pathname", req.nextUrl.pathname);

  if (isDev) return response;

  // Landing page is public
  if (req.nextUrl.pathname === "/") {
    return response;
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
