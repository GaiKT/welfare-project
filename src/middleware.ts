import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { AdminRole, UserType } from "./types/auth";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    // Use optional chaining because `nextauth` may be undefined
    const token = req.nextauth?.token;

    // Check if user must change password (first login)
    if (token?.mustChangePassword) {
      // Allow access to reset-password page and auth APIs
      if (pathname === "/reset-password" || 
          pathname.startsWith("/api/auth/change-password") ||
          pathname.startsWith("/api/auth/session")) {
        return NextResponse.next();
      }
      // Redirect to reset-password page for all other routes
      if (!pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/reset-password", req.url));
      }
      // Block other API calls for users who must change password
      return NextResponse.json(
        { error: "Password change required" },
        { status: 403 }
      );
    }

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

      // PRIMARY (Super Admin) only routes
      if (pathname.startsWith("/admin/users-management") || 
          pathname.startsWith("/admin/admin-management")) {
        if (token?.role !== AdminRole.PRIMARY) {
          return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        }
      }

      // Admin and PRIMARY routes (claim review)
      if (pathname.startsWith("/admin/welfare-management") || 
          pathname.startsWith("/admin/reports")) {
        if (!token?.role || 
            ![AdminRole.ADMIN, AdminRole.PRIMARY].includes(token.role as AdminRole)) {
          return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        }
      }

      // Manager routes (final approval)
      if (pathname.startsWith("/admin/manager-approval")) {
        if (token?.role !== AdminRole.MANAGER && token?.role !== AdminRole.PRIMARY) {
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

    // Account settings routes - require authentication (any user type)
    if (pathname.startsWith("/account")) {
      if (!token) {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
    }

    // Profile routes - require authentication (any user type)
    if (pathname.startsWith("/profile")) {
      if (!token) {
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

      // Admin management APIs - PRIMARY (Super Admin) only
      // PRIMARY-only APIs (super admin)
      if (pathname.startsWith("/api/users-management")) {
        if (token?.userType !== UserType.ADMIN || token?.role !== AdminRole.PRIMARY) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
      }

      // Welfare management APIs - Admin and PRIMARY
      // if (pathname.startsWith("/api/welfare-management")) {
      //   if (token?.userType !== UserType.ADMIN || 
      //       ![AdminRole.ADMIN, AdminRole.PRIMARY].includes(token.role as AdminRole)) {
      //     return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      //   }
      // }

      // User welfare claims APIs - User or Admin/Manager
      if (pathname.startsWith("/api/claims")) {
        if (token?.userType === UserType.USER) {
          // Users can only access their own claims
          return NextResponse.next();
        } else if (token?.userType === UserType.ADMIN && 
                   [AdminRole.ADMIN, AdminRole.MANAGER, AdminRole.PRIMARY].includes(token.role as AdminRole)) {
          // Admins, Managers, and PRIMARY can access claims
          return NextResponse.next();
        } else {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
      }

      // Account settings APIs - Any authenticated user can access their own account
      if (pathname.startsWith("/api/account")) {
        // Already checked for token above, so just allow access
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // token may be undefined in some edge cases
        const t = token as any;

        // Allow access to public routes
        if (pathname.startsWith("/signin") || 
            pathname.startsWith("/signup") ||
            pathname.startsWith("/api/auth")) {
          return true;
        }

        // Reset password page requires authentication
        if (pathname === "/reset-password") {
          return !!t;
        }

        // Root route requires authentication
        if (pathname === "/") {
          return !!t;
        }

        // Require authentication for protected routes
        if (pathname.startsWith("/admin") || 
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/account") ||
            pathname.startsWith("/profile")) {
          return !!t;
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
    "/account/:path*",
    "/profile/:path*",
    "/reset-password",
    // API routes used in this project
    "/api/auth/:path*",
    "/api/claims/:path*",
    "/api/welfare-management/:path*",
    "/api/users-management/:path*",
    "/api/account/:path*",
    "/api/notifications/:path*",
    "/api/quota/:path*"
  ],
};
