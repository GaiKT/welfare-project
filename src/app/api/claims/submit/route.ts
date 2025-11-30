import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { uploadMultipleFiles } from "@/lib/file-upload";
import { UserType } from "@/types/auth";

/**
 * POST /api/claims/submit
 * Submit a new welfare claim with file attachments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only regular users can submit claims
    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { error: "Only regular users can submit claims" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    console.log("Received claim submission:", formData);
    const welfareId = formData.get("welfareId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;

    // Validation
    if (!welfareId || !amount) {
      return NextResponse.json(
        { error: "Welfare type and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get welfare details
    const welfare = await prisma.welfare.findUnique({
      where: { id: welfareId },
    });

    if (!welfare) {
      return NextResponse.json(
        { error: "Welfare type not found" },
        { status: 404 }
      );
    }

    // Check if amount exceeds welfare limit
    if (amount > welfare.maxUsed) {
      return NextResponse.json(
        {
          error: `Amount exceeds maximum allowed (${welfare.maxUsed} per claim)`,
        },
        { status: 400 }
      );
    }

    const fiscalYear = getCurrentFiscalYear();
    const userId = session.user.id;

    // Check remaining quota
    const quota = await prisma.welfareQuota.findUnique({
      where: {
        userId_welfareId_fiscalYear: {
          userId,
          welfareId,
          fiscalYear,
        },
      },
    });

    if (quota && quota.remainingAmount < amount) {
      return NextResponse.json(
        {
          error: `Insufficient quota. Remaining: ${quota.remainingAmount}, Requested: ${amount}`,
        },
        { status: 400 }
      );
    }

    // Handle file uploads
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file") && value instanceof File) {
        files.push(value);
      }
    }

    let uploadedFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }> = [];
    if (files.length > 0) {
      try {
        uploadedFiles = await uploadMultipleFiles(files, "claims");
      } catch (error: any) {
        return NextResponse.json(
          { error: `File upload failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Create claim
    const claim = await prisma.welfareClaims.create({
      data: {
        userId,
        welfareId,
        amount,
        description: description || null,
        status: "PENDING",
        fiscalYear,
        documents: {
          create: uploadedFiles.map((file) => ({
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            fileSize: file.fileSize,
          })),
        },
      },
      include: {
        documents: true,
        welfare: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notification for admins (we'll notify all ADMINs and PRIMARY)
    // const admins = await prisma.admin.findMany({
    //   where: {
    //     role: {
    //       in: ["ADMIN", "PRIMARY"],
    //     },
    //     isActive: true,
    //   },
    //   select: {
    //     id: true,
    //   },
    // });

    // await Promise.all(
    //   admins.map((admin) =>
    //     prisma.notification.create({
    //       data: {
    //         userId: admin.id,
    //         type: "CLAIM_SUBMITTED",
    //         title: "มีคำร้องใหม่รอการตรวจสอบ",
    //         message: `${session.user.name} ยื่นคำร้อง ${claim.welfare.name} จำนวน ${claim.amount} บาท`,
    //         relatedClaimId: claim.id,
    //       },
    //     })
    //   )
    // );

    return NextResponse.json({
      success: true,
      message: "Claim submitted successfully",
      claim: {
        id: claim.id,
        amount: claim.amount,
        status: claim.status,
        welfareName: claim.welfare.name,
        documentCount: claim.documents.length,
        submittedDate: claim.submittedDate,
      },
    });
  } catch (error) {
    console.error("Submit claim error:", error);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 }
    );
  }
}
