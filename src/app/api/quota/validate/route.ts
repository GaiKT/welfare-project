import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { validateWelfareClaim } from "@/lib/welfare-validation";
import { UserType } from "@/types/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/quota/validate
 * Validate if a user can make a claim and calculate amount
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

    // Only regular users can validate claims
    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { error: "Only regular users can validate claims" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { welfareSubTypeId, nights, requestedAmount } = data;

    if (!welfareSubTypeId) {
      return NextResponse.json(
        { error: "กรุณาเลือกประเภทสวัสดิการ" },
        { status: 400 }
      );
    }

    const fiscalYear = getCurrentFiscalYear();
    const userId = session.user.id;

    // Get welfare sub-type details for response
    const welfareSubType = await prisma.welfareSubType.findUnique({
      where: { id: welfareSubTypeId },
      include: {
        welfareType: {
          include: {
            requiredDocuments: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!welfareSubType) {
      return NextResponse.json(
        { error: "ไม่พบประเภทสวัสดิการที่เลือก" },
        { status: 404 }
      );
    }

    // Validate claim
    const validation = await validateWelfareClaim({
      userId,
      welfareSubTypeId,
      nights,
      requestedAmount,
      fiscalYear,
    });

    return NextResponse.json({
      success: true,
      validation,
      welfareSubType: {
        id: welfareSubType.id,
        code: welfareSubType.code,
        name: welfareSubType.name,
        description: welfareSubType.description,
        amount: welfareSubType.amount,
        unitType: welfareSubType.unitType,
        maxPerRequest: welfareSubType.maxPerRequest,
        maxPerYear: welfareSubType.maxPerYear,
        maxLifetime: welfareSubType.maxLifetime,
        maxClaimsPerYear: welfareSubType.maxClaimsPerYear,
        maxClaimsLifetime: welfareSubType.maxClaimsLifetime,
        welfareType: {
          code: welfareSubType.welfareType.code,
          name: welfareSubType.welfareType.name,
          requiredDocuments: welfareSubType.welfareType.requiredDocuments,
        },
      },
    });
  } catch (error) {
    console.error("Error validating claim:", error);
    return NextResponse.json(
      { error: "Failed to validate claim" },
      { status: 500 }
    );
  }
}
