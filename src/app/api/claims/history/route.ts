import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";

/**
 * GET /api/claims/history
 * Get claim history with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get("fiscalYear")
      ? parseInt(searchParams.get("fiscalYear")!)
      : undefined;
    const status = searchParams.get("status");
    const welfareId = searchParams.get("welfareId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause based on user type
    const where: Record<string, unknown> = {};

    // Users can only see their own claims
    if (session.user.userType === UserType.USER) {
      where.userId = session.user.id;
    }
    // Admins can see all claims (filter applied later if needed)

    // Apply filters
    if (fiscalYear) {
      where.fiscalYear = fiscalYear;
    }

    if (status) {
      where.status = status;
    }

    if (welfareId) {
      where.welfareId = welfareId;
    }

    if (startDate && endDate) {
      where.submittedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.submittedDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.submittedDate = {
        lte: new Date(endDate),
      };
    }

    // Get total count
    const totalCount = await prisma.welfareClaims.count({ where });

    // Get paginated claims
    const claims = await prisma.welfareClaims.findMany({
      where,
      include: {
        user: {
          select: {
            identity: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        welfare: {
          select: {
            name: true,
            description: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        adminApprover: {
          select: {
            name: true,
            username: true,
          },
        },
        managerApprover: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: { submittedDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      claims,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Get claim history error:", error);
    return NextResponse.json(
      { error: "Failed to get claim history" },
      { status: 500 }
    );
  }
}
