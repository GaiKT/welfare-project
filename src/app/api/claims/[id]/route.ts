import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";

/**
 * GET /api/claims/[id]
 * Get detailed claim information with full relationships
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const claim = await prisma.welfareClaims.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            identity: true,
            firstName: true,
            lastName: true,
            title: true,
            email: true,
            phone: true,
          },
        },
        welfare: {
          select: {
            id: true,
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
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: "asc",
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                username: true,
                role: true,
                signatureUrl: true,
              },
            },
          },
          orderBy: {
            approvedAt: "asc",
          },
        },
        comments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        adminApprover: {
          select: {
            id: true,
            name: true,
            username: true,
            signatureUrl: true,
          },
        },
        managerApprover: {
          select: {
            id: true,
            name: true,
            username: true,
            signatureUrl: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Check permissions - Users can only view their own claims
    if (user.userType === UserType.USER && claim.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only view your own claims" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error("Get claim detail error:", error);
    return NextResponse.json(
      { error: "Failed to get claim details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { status, amount } = data;

    // Check if claim exists
    let whereClause: any = { id };

    // Users can only update their own pending claims
    if (user.userType === UserType.USER) {
      whereClause.userId = user.id;
      whereClause.status = "PENDING";
    }

    const existingClaim = await prisma.welfareClaims.findFirst({
      where: whereClause,
      include: {
        welfare: true,
      },
    });

    if (!existingClaim) {
      return NextResponse.json(
        { error: "Claim not found or not editable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Users can only update amount of pending claims
    if (user.userType === UserType.USER) {
      if (amount !== undefined) {
        if (amount <= 0) {
          return NextResponse.json(
            { error: "Amount must be a positive number" },
            { status: 400 }
          );
        }

        if (amount > existingClaim.welfare.maxUsed) {
          return NextResponse.json(
            { 
              error: `Amount exceeds maximum allowed (${existingClaim.welfare.maxUsed})` 
            },
            { status: 400 }
          );
        }

        updateData.amount = amount;
      }
    } else {
      // Admins can update both status and amount
      if (status !== undefined) {
        if (!["PENDING", "IN_REVIEW", "ADMIN_APPROVED", "MANAGER_APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 }
          );
        }
        updateData.status = status;
      }

      if (amount !== undefined) {
        if (amount <= 0) {
          return NextResponse.json(
            { error: "Amount must be a positive number" },
            { status: 400 }
          );
        }

        if (amount > existingClaim.welfare.maxUsed) {
          return NextResponse.json(
            { 
              error: `Amount exceeds maximum allowed (${existingClaim.welfare.maxUsed})` 
            },
            { status: 400 }
          );
        }

        updateData.amount = amount;
      }
    }

    const claim = await prisma.welfareClaims.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Error updating claim:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let whereClause: any = { id };

    // Users can only delete their own pending claims
    if (user.userType === UserType.USER) {
      whereClause.userId = user.id;
      whereClause.status = "PENDING";
    }

    const claim = await prisma.welfareClaims.findFirst({
      where: whereClause,
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found or not deletable" },
        { status: 404 }
      );
    }

    await prisma.welfareClaims.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting claim:", error);
    return NextResponse.json(
      { error: "Failed to delete claim" },
      { status: 500 }
    );
  }
}