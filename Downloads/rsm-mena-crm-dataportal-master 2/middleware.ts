import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // Skip middleware for API routes with file uploads
  if (pathname.includes('/api/admin/users/') && pathname.includes('/file')) {
    console.log("Skipping middleware for file upload API route:", pathname);
    return NextResponse.next();
  }

  // Check if the path is protected
  const isAdminPath = pathname.startsWith("/admin/dashboard")
  const isUserPath = pathname.startsWith("/dashboard")
  const isAdminLoginPath = pathname === "/admin" || pathname === "/admin/login"
  const isUserLoginPath = pathname === "/"

  // If no token and trying to access protected routes
  if (!token && (isAdminPath || isUserPath)) {
    const redirectUrl = isAdminPath ? "/admin" : "/"
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // If token exists, verify it
  if (token) {
    try {
      console.log("Verifying token in middleware...");
      const payload = await verifyToken(token)
      console.log("Token payload:", payload);

      if (!payload) {
        // Invalid token
        console.log("Invalid token, redirecting to login...");
        if (isAdminPath || isUserPath) {
          const redirectUrl = isAdminPath ? "/admin" : "/"
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
      } else {
        // Valid token
        const isAdmin = payload.role === "admin"
        console.log("Valid token, user role:", payload.role);

        // Redirect logged-in users from login pages
        if (isAdminLoginPath || isUserLoginPath) {
          const redirectUrl = isAdmin ? "/admin/dashboard" : "/dashboard"
          console.log("Redirecting to:", redirectUrl);
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        }

        // Check if user has access to the requested path
        if (isAdminPath && !isAdmin) {
          return NextResponse.redirect(new URL("/", request.url))
        }

        if (isUserPath && isAdmin) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url))
        }
      }
    } catch (error) {
      // Token verification failed
      if (isAdminPath || isUserPath) {
        const redirectUrl = isAdminPath ? "/admin" : "/"
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin", "/admin/dashboard/:path*"],
}

