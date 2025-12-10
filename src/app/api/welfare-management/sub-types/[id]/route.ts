import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/welfare-management/sub-types/[id]
 * Get welfare sub-type by ID with parent type and required documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const subType = await prisma.welfareSubType.findUnique({
      where: { id },
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

    if (!subType) {
      return NextResponse.json(
        { error: "Welfare sub-type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data : subType,
    });
  } catch (error) {
    console.error("Error fetching welfare sub-type:", error);
    return NextResponse.json(
      { error: "Failed to fetch welfare sub-type" },
      { status: 500 }
    );
  }
}
