import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { UserType, AdminRole } from "@/types/auth";

/**
 * GET /api/claims
 * Get claims based on user role:
 * - USER: see their own claims
 * - ADMIN: see PENDING and IN_REVIEW claims (for review)
 * - MANAGER: see ADMIN_APPROVED claims (for final approval)
 * - PRIMARY: see all claims
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const welfareTypeId = searchParams.get("welfareTypeId");
    const welfareSubTypeId = searchParams.get("welfareSubTypeId");

    const whereClause: Record<string, unknown> = {};

    // Filter based on user type and role
    if (user.userType === UserType.USER) {
      // Users see only their own claims
      whereClause.userId = user.id;
    } else if (user.userType === UserType.ADMIN) {
      // Admin role-based filtering
      if (user.role === AdminRole.ADMIN) {
        // ADMIN sees pending claims for review
        if (!status) {
          whereClause.status = { in: ["PENDING", "IN_REVIEW"] };
        }
      } else if (user.role === AdminRole.MANAGER) {
        // MANAGER sees admin-approved claims for final approval
        if (!status) {
          whereClause.status = "ADMIN_APPROVED";
        }
      }
      // PRIMARY sees all (no additional filter)
    }

    // Add status filter if provided (overrides role-based default)
    if (status) {
      whereClause.status = status;
    }

    // Add welfare type filter if provided
    if (welfareSubTypeId) {
      whereClause.welfareSubTypeId = welfareSubTypeId;
    } else if (welfareTypeId) {
      whereClause.welfareSubType = {
        welfareTypeId: welfareTypeId,
      };
    }

    const claims = await prisma.welfareClaims.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            identity: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        welfareSubType: {
          select: {
            code: true,
            name: true,
            amount: true,
            unitType: true,
            maxPerRequest: true,
            maxPerYear: true,
            maxLifetime: true,
            welfareType: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ 
      success: true,
      data:{
        claims,
        count: claims.length,
      }
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

// Note: For creating new claims, use POST /api/claims/submit instead