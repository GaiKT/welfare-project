import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminRole, UserType } from "@/types/auth";

/**
 * POST /api/claims/[id]/manager-approve
 * Manager approves a claim (final approval step)
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

    // Only MANAGER and PRIMARY can do final approval
    if (
      session.user.userType !== UserType.ADMIN ||
      (session.user.role !== AdminRole.MANAGER &&
        session.user.role !== AdminRole.PRIMARY)
    ) {
      return NextResponse.json(
        { error: "Only managers can give final approval" },
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

    // Check if claim is in correct status (must be approved by admin first)
    if (claim.status !== "ADMIN_APPROVED") {
      return NextResponse.json(
        {
          error:
            "Claim must be approved by admin before manager can approve",
        },
        { status: 400 }
      );
    }

    // Update claim status to completed
    const updatedClaim = await prisma.welfareClaims.update({
      where: { id: claimId },
      data: {
        status: "COMPLETED",
        managerApproverId: session.user.id,
        managerApprovedAt: new Date(),
        completedDate: new Date(),
      },
    });

    // Create approval record
    await prisma.claimApproval.create({
      data: {
        claimId,
        approverId: session.user.id,
        approverRole: session.user.role as AdminRole,
        status: "COMPLETED",
        comments: comments || null,
      },
    });

    // Update welfare quota
    const fiscalYear = claim.fiscalYear;
    const existingQuota = await prisma.welfareQuota.findUnique({
      where: {
        userId_welfareId_fiscalYear: {
          userId: claim.userId,
          welfareId: claim.welfareId,
          fiscalYear,
        },
      },
    });

    if (existingQuota) {
      await prisma.welfareQuota.update({
        where: {
          userId_welfareId_fiscalYear: {
            userId: claim.userId,
            welfareId: claim.welfareId,
            fiscalYear,
          },
        },
        data: {
          usedAmount: existingQuota.usedAmount + claim.amount,
          remainingAmount: existingQuota.remainingAmount - claim.amount,
        },
      });
    } else {
      // Create new quota record
      await prisma.welfareQuota.create({
        data: {
          userId: claim.userId,
          welfareId: claim.welfareId,
          fiscalYear,
          totalQuota: claim.welfare.maxUsed,
          usedAmount: claim.amount,
          remainingAmount: claim.welfare.maxUsed - claim.amount,
        },
      });
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type: "CLAIM_COMPLETED",
        title: "คำร้องได้รับการอนุมัติเรียบร้อย",
        message: `คำร้อง ${claim.welfare.name} จำนวน ${claim.amount} บาท ได้รับการอนุมัติเรียบร้อยแล้ว`,
        relatedClaimId: claimId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CLAIM_MANAGER_APPROVED",
        entity: "WelfareClaims",
        entityId: claimId,
        adminId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Claim approved by manager successfully",
      claim: updatedClaim,
    });
  } catch (error) {
    console.error("Manager approve claim error:", error);
    return NextResponse.json(
      { error: "Failed to approve claim" },
      { status: 500 }
    );
  }
}
