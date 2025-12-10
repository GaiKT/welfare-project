import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/welfare-management/[id]/sub-types
 * Add a new sub-type to a welfare type
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if welfare type exists
    const welfareType = await prisma.welfareType.findUnique({
      where: { id },
    });

    if (!welfareType) {
      return NextResponse.json(
        { error: "Welfare type not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const {
      code,
      name,
      description,
      amount,
      unitType,
      maxPerRequest,
      maxPerYear,
      maxLifetime,
      maxClaimsPerYear,
      maxClaimsLifetime,
      sortOrder,
    } = data;

    // Validate required fields
    if (!code || !name || amount === undefined) {
      return NextResponse.json(
        { error: "Code, name, and amount are required" },
        { status: 400 }
      );
    }

    // Check if code already exists for this welfare type
    const existingSubType = await prisma.welfareSubType.findUnique({
      where: {
        welfareTypeId_code: {
          welfareTypeId: id,
          code,
        },
      },
    });

    if (existingSubType) {
      return NextResponse.json(
        { error: "Sub-type with this code already exists for this welfare type" },
        { status: 400 }
      );
    }

    // Get max sort order
    const maxSortOrder = await prisma.welfareSubType.findFirst({
      where: { welfareTypeId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const subType = await prisma.welfareSubType.create({
      data: {
        welfareTypeId: id,
        code,
        name,
        description: description || null,
        amount,
        unitType: unitType || "LUMP_SUM",
        maxPerRequest: maxPerRequest || null,
        maxPerYear: maxPerYear || null,
        maxLifetime: maxLifetime || null,
        maxClaimsPerYear: maxClaimsPerYear || null,
        maxClaimsLifetime: maxClaimsLifetime || null,
        sortOrder: sortOrder || (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      subType,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating sub-type:", error);
    return NextResponse.json(
      { error: "Failed to create sub-type" },
      { status: 500 }
    );
  }
}
