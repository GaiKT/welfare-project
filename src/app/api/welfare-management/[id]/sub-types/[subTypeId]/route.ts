import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/welfare-management/[id]/sub-types/[subTypeId]
 * Update a sub-type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subTypeId: string }> }
) {
  try {
    await requireAdmin();
    const { id, subTypeId } = await params;

    // Check if sub-type exists
    const existingSubType = await prisma.welfareSubType.findFirst({
      where: {
        id: subTypeId,
        welfareTypeId: id,
      },
    });

    if (!existingSubType) {
      return NextResponse.json(
        { error: "Sub-type not found" },
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
      isActive,
      sortOrder,
    } = data;

    // Check if new code conflicts with existing
    if (code && code !== existingSubType.code) {
      const codeExists = await prisma.welfareSubType.findUnique({
        where: {
          welfareTypeId_code: {
            welfareTypeId: id,
            code,
          },
        },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Sub-type with this code already exists" },
          { status: 400 }
        );
      }
    }

    const subType = await prisma.welfareSubType.update({
      where: { id: subTypeId },
      data: {
        code: code || existingSubType.code,
        name: name || existingSubType.name,
        description: description !== undefined ? description : existingSubType.description,
        amount: amount !== undefined ? amount : existingSubType.amount,
        unitType: unitType || existingSubType.unitType,
        maxPerRequest: maxPerRequest !== undefined ? maxPerRequest : existingSubType.maxPerRequest,
        maxPerYear: maxPerYear !== undefined ? maxPerYear : existingSubType.maxPerYear,
        maxLifetime: maxLifetime !== undefined ? maxLifetime : existingSubType.maxLifetime,
        maxClaimsPerYear: maxClaimsPerYear !== undefined ? maxClaimsPerYear : existingSubType.maxClaimsPerYear,
        maxClaimsLifetime: maxClaimsLifetime !== undefined ? maxClaimsLifetime : existingSubType.maxClaimsLifetime,
        isActive: isActive !== undefined ? isActive : existingSubType.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : existingSubType.sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      subType,
    });
  } catch (error) {
    console.error("Error updating sub-type:", error);
    return NextResponse.json(
      { error: "Failed to update sub-type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/welfare-management/[id]/sub-types/[subTypeId]
 * Delete a sub-type (soft delete if has claims)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subTypeId: string }> }
) {
  try {
    await requireAdmin();
    const { id, subTypeId } = await params;

    // Check if sub-type exists and has claims
    const subType = await prisma.welfareSubType.findFirst({
      where: {
        id: subTypeId,
        welfareTypeId: id,
      },
      include: {
        claims: true,
      },
    });

    if (!subType) {
      return NextResponse.json(
        { error: "Sub-type not found" },
        { status: 404 }
      );
    }

    if (subType.claims.length > 0) {
      // Soft delete
      await prisma.welfareSubType.update({
        where: { id: subTypeId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Sub-type has been disabled (has existing claims)",
        softDeleted: true,
      });
    }

    // Hard delete
    await prisma.welfareSubType.delete({
      where: { id: subTypeId },
    });

    return NextResponse.json({
      success: true,
      message: "Sub-type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sub-type:", error);
    return NextResponse.json(
      { error: "Failed to delete sub-type" },
      { status: 500 }
    );
  }
}
