import { type NextRequest, NextResponse } from "next/server"

export default function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path starts with /dashboard
  const isDashboardPath = path.startsWith("/dashboard")

  // Get the authentication cookie
  // Accept custom auth cookie or PocketBase's default cookie if present
  const authCookie = request.cookies.get("auth")?.value || request.cookies.get("pb_auth")?.value

  // If the path is a dashboard path and there's no auth cookie, redirect to login
  if (isDashboardPath && !authCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ["/dashboard/:path*"],
}
