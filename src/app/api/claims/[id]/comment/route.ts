import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";
import { UserType as PrismaUserType } from "@prisma/client";

/**
 * POST /api/claims/[id]/comment
 * Add a comment to a claim (for requesting revisions)
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

    const { id: claimId } = await params;
    const body = await request.json();
    const { comment } = body;

    if (!comment || comment.trim() === "") {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    // Get claim
    const claim = await prisma.welfareClaims.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        welfareSubType: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Check permissions
    // Admins can comment on any claim, Users can only comment on their own
    if (session.user.userType === UserType.USER) {
      if (claim.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You can only comment on your own claims" },
          { status: 403 }
        );
      }
    }

    // Create comment
    const newComment = await prisma.claimComment.create({
      data: {
        claimId,
        commentBy: session.user.id,
        userType: session.user.userType === UserType.USER ? PrismaUserType.USER : PrismaUserType.ADMIN,
        comment,
      },
    });

    // If admin commented, create notification for user
    if (session.user.userType === UserType.ADMIN && claim.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: claim.userId,
          type: "CLAIM_COMMENT",
          title: "มีความคิดเห็นใหม่สำหรับคำร้องของคุณ",
          message: `${session.user.name} แสดงความคิดเห็น: ${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}`,
          relatedClaimId: claimId,
        },
      });
    }

    // If user commented, update claim status to IN_REVIEW if it was pending
    if (session.user.userType === UserType.USER && claim.status === "PENDING") {
      await prisma.welfareClaims.update({
        where: { id: claimId },
        data: { status: "IN_REVIEW" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claims/[id]/comment
 * Get all comments for a claim
 */
export async function GET(
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

    const { id: claimId } = await params;

    // Get claim to check permissions
    const claim = await prisma.welfareClaims.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.userType === UserType.USER && claim.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only view comments on your own claims" },
        { status: 403 }
      );
    }

    // Get comments
    const comments = await prisma.claimComment.findMany({
      where: { claimId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}
