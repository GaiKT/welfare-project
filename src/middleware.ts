import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { AdminRole, UserType } from "@/types/auth";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Root route - redirect to appropriate dashboard or signin
    if (pathname === "/") {
      if (!token) {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
      // Let the root page component handle the dashboard redirect
      return NextResponse.next();
    }

    // Admin panel routes - require admin authentication
    if (pathname.startsWith("/admin")) {
      if (!token || token.userType !== UserType.ADMIN) {
        return NextResponse.redirect(new URL("/signin", req.url));
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

    // User dashboard routes - require user authentication
    if (pathname.startsWith("/dashboard")) {
      if (!token || token.userType !== UserType.USER) {
        return NextResponse.redirect(new URL("/signin", req.url));
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
          pathname.startsWith("/api/users-management")) {
        if (token.userType !== UserType.ADMIN || token.role !== AdminRole.SUPER_ADMIN) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
      }

      // Welfare management APIs - Admin and above
      if (pathname.startsWith("/api/welfare-management")) {
        if (token.userType !== UserType.ADMIN || 
            ![AdminRole.ADMIN, AdminRole.SUPER_ADMIN].includes(token.role as AdminRole)) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
      }

      // User welfare claims APIs - User or Admin
      if (pathname.startsWith("/api/claims")) {
        if (token.userType === UserType.USER) {
          // Users can only access their own claims
          return NextResponse.next();
        } else if (token.userType === UserType.ADMIN && 
                   [AdminRole.ADMIN, AdminRole.SUPER_ADMIN].includes(token.role as AdminRole)) {
          // Admins can access all claims
          return NextResponse.next();
        } else {
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
        if (pathname.startsWith("/signin") || 
            pathname.startsWith("/signup") ||
            pathname.startsWith("/api/auth")) {
          return true;
        }

        // Root route requires authentication
        if (pathname === "/") {
          return !!token;
        }

        // Require authentication for protected routes
        if (pathname.startsWith("/admin") || 
            pathname.startsWith("/dashboard")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/welfare-management/:path*",
    "/api/claims/:path*",
    "/api/users-management/:path*",
    "/api/reports/:path*"
  ],
};
