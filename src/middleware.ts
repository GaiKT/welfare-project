import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { AdminRole } from "@/types/next-auth";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin panel routes - require authentication
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }

      // Super admin only routes
      if (pathname.startsWith("/admin/users-management") || 
          pathname.startsWith("/admin/admin-management")) {
        if (token.role !== AdminRole.SUPER_ADMIN) {
          return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        }
      }

      // Admin and above routes
      if (pathname.startsWith("/admin/welfare-management") || 
          pathname.startsWith("/admin/reports")) {
        if (!token.role || 
            ![AdminRole.ADMIN, AdminRole.SUPER_ADMIN].includes(token.role as AdminRole)) {
          return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        }
      }
    }

    // API routes protection
    if (pathname.startsWith("/api/")) {
      // Public API routes
      if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
      }

      // Protected API routes
      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Admin management APIs - Super Admin only
      if (pathname.startsWith("/api/admin") || 
          pathname.startsWith("/api/users")) {
        if (token.role !== AdminRole.SUPER_ADMIN) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (pathname.startsWith("/auth") || 
            pathname === "/" || 
            pathname.startsWith("/api/auth")) {
          return true;
        }

        // Require authentication for protected routes
        if (pathname.startsWith("/admin") || 
            pathname.startsWith("/api/")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/welfare/:path*",
    "/api/users/:path*",
    "/api/reports/:path*"
  ],
};
