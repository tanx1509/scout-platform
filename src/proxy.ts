import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";

// Define the routes that are protected (Pages only, not APIs)
const protectedRoutes = [
  "/dashboard",
  "/analytics",
  "/candidates",
  "/jobs",
  "/matches"
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // We explicitly DO NOT protect /api/* here in middleware.
  // APIs are protected individually via auth() to prevent bypasses.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = await auth();

    // If unauthorized, redirect to the landing page
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
