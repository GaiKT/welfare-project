import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole, UserType } from "@/types/auth";

/**
 * POST /api/claims/[id]/reject
 * Admin or Manager rejects a claim
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

    // Only ADMIN, MANAGER, and PRIMARY can reject
    if (session.user.userType !== UserType.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can reject claims" },
        { status: 403 }
      );
    }

    const { id: claimId } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get claim
    const claim = await prisma.welfareClaims.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        welfareSubType: {
          include: {
            welfareType: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Check if claim can be rejected
    if (claim.status === "COMPLETED" || claim.status === "REJECTED") {
      return NextResponse.json(
        { error: "Claim cannot be rejected in current status" },
        { status: 400 }
      );
    }

    // Update claim status
    const updatedClaim = await prisma.welfareClaims.update({
      where: { id: claimId },
      data: {
        status: "REJECTED",
        rejectionReason,
        completedDate: new Date(),
      },
    });

    // Create approval record
    await prisma.claimApproval.create({
      data: {
        claimId,
        approverId: session.user.id,
        approverRole: session.user.role as AdminRole,
        status: "REJECTED",
        comments: rejectionReason,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type: "CLAIM_REJECTED",
        title: "คำร้องถูกปฏิเสธ",
        message: `คำร้อง ${claim.welfareSubType.welfareType.name} - ${claim.welfareSubType.name} จำนวน ${claim.requestedAmount} บาท ถูกปฏิเสธ: ${rejectionReason}`,
        relatedClaimId: claimId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CLAIM_REJECTED",
        entity: "WelfareClaims",
        entityId: claimId,
        adminId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Claim rejected successfully",
      data: {
        claim: updatedClaim,
      },
    });
  } catch (error) {
    console.error("Reject claim error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reject claim" },
      { status: 500 }
    );
  }
}
