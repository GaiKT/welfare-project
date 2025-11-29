import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { UserType, AdminRole } from "@/types/auth";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";

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
    const welfareId = searchParams.get("welfareId");

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

    // Add welfare program filter if provided
    if (welfareId) {
      whereClause.welfareId = welfareId;
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
        welfare: {
          select: {
            name: true,
            description: true,
            maxUsed: true,
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
      claims,
      count: claims.length,
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { welfareId, amount } = data;

    // Validate required fields
    if (!welfareId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Get welfare program
    const welfare = await prisma.welfare.findUnique({
      where: { id: welfareId },
    });

    if (!welfare) {
      return NextResponse.json(
        { error: "Welfare program not found" },
        { status: 404 }
      );
    }

    // Check if amount exceeds maximum allowed
    if (amount > welfare.maxUsed) {
      return NextResponse.json(
        { 
          error: `Amount exceeds maximum allowed (${welfare.maxUsed})` 
        },
        { status: 400 }
      );
    }

    // For users, only allow them to create claims for themselves
    let claimUserId = user.id;
    if (user.userType === UserType.ADMIN && data.userId) {
      // Admins can create claims for other users
      claimUserId = data.userId;
    }

    // Check user's existing claims for this welfare program within the duration
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - welfare.duration);

    const existingClaims = await prisma.welfareClaims.findMany({
      where: {
        userId: claimUserId,
        welfareId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const totalUsed = existingClaims.reduce((sum: number, claim: any) => sum + claim.amount, 0);
    
    if (totalUsed + amount > welfare.maxUsed) {
      return NextResponse.json(
        { 
          error: `Total claims would exceed maximum allowed (${welfare.maxUsed}). Current usage: ${totalUsed}` 
        },
        { status: 400 }
      );
    }

    const claim = await prisma.welfareClaims.create({
      data: {
        userId: claimUserId,
        welfareId,
        amount,
        status: "PENDING",
        fiscalYear: getCurrentFiscalYear(),
      },
      include: {
        user: {
          select: {
            identity: true,
            firstName: true,
            lastName: true,
          },
        },
        welfare: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}