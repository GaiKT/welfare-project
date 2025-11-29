import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole, UserType } from "@/types/auth";

/**
 * POST /api/claims/[id]/admin-approve
 * Admin approves a claim (first approval step)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only ADMIN and PRIMARY can approve
    if (
      session.user.userType !== UserType.ADMIN ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.PRIMARY)
    ) {
      return NextResponse.json(
        { error: "Only administrators can approve claims" },
        { status: 403 }
      );
    }

    const { id: claimId } = await params;
    const body = await request.json();
    const { comments } = body;

    // Get claim
    const claim = await prisma.welfareClaims.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        welfare: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Check if claim is in correct status
    if (claim.status !== "PENDING" && claim.status !== "IN_REVIEW") {
      return NextResponse.json(
        { error: "Claim cannot be approved in current status" },
        { status: 400 }
      );
    }

    // Update claim status and admin approval
    const updatedClaim = await prisma.welfareClaims.update({
      where: { id: claimId },
      data: {
        status: "ADMIN_APPROVED",
        adminApproverId: session.user.id,
        adminApprovedAt: new Date(),
      },
    });

    // Create approval record
    await prisma.claimApproval.create({
      data: {
        claimId,
        approverId: session.user.id,
        approverRole: session.user.role as AdminRole,
        status: "ADMIN_APPROVED",
        comments: comments || null,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type: "CLAIM_APPROVED",
        title: "คำร้องได้รับการอนุมัติจาก Admin",
        message: `คำร้อง ${claim.welfare.name} จำนวน ${claim.amount} บาท ได้รับการอนุมัติจาก Admin แล้ว รอการอนุมัติจาก Manager`,
        relatedClaimId: claimId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CLAIM_ADMIN_APPROVED",
        entity: "WelfareClaims",
        entityId: claimId,
        adminId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Claim approved by admin successfully",
      claim: updatedClaim,
    });
  } catch (error) {
    console.error("Admin approve claim error:", error);
    return NextResponse.json(
      { error: "Failed to approve claim" },
      { status: 500 }
    );
  }
}
