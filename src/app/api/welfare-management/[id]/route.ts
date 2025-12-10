import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/welfare-management/[id]
 * Get a specific welfare type with its sub-types and required documents
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

    const welfareType = await prisma.welfareType.findUnique({
      where: { id },
      include: {
        subTypes: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            _count: {
              select: {
                claims: true,
              },
            },
          },
        },
        requiredDocuments: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!welfareType) {
      return NextResponse.json(
        { error: "Welfare type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      welfareType,
      welfare: welfareType, // backward compatibility
    });
  } catch (error) {
    console.error("Error fetching welfare type:", error);
    return NextResponse.json(
      { error: "Failed to fetch welfare type" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/welfare-management/[id]
 * Update a welfare type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const data = await request.json();
    const { code, name, description, isActive, sortOrder, subTypes, requiredDocuments } = data;

    // Check if welfare type exists
    const existingWelfare = await prisma.welfareType.findUnique({
      where: { id },
    });

    if (!existingWelfare) {
      return NextResponse.json(
        { error: "Welfare type not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if new code conflicts with existing
    if (code && code !== existingWelfare.code) {
      const codeExists = await prisma.welfareType.findUnique({
        where: { code },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Welfare type with this code already exists" },
          { status: 400 }
        );
      }
    }

    // Update welfare type
    // const welfareType = await prisma.welfareType.update({
    //   where: { id },
    //   data: {
    //     code: code || existingWelfare.code,
    //     name,
    //     description: description || null,
    //     isActive: isActive !== undefined ? isActive : existingWelfare.isActive,
    //     sortOrder: sortOrder !== undefined ? sortOrder : existingWelfare.sortOrder,
    //   },
    //   include: {
    //     subTypes: true,
    //     requiredDocuments: true,
    //   },
    // });

    // Update sub-types if provided
    if (subTypes && Array.isArray(subTypes)) {
      for (const st of subTypes) {
        if (st.id) {
          // Update existing sub-type
          await prisma.welfareSubType.update({
            where: { id: st.id },
            data: {
              code: st.code,
              name: st.name,
              description: st.description || null,
              amount: st.amount,
              unitType: st.unitType || "LUMP_SUM",
              maxPerRequest: st.maxPerRequest || null,
              maxPerYear: st.maxPerYear || null,
              maxLifetime: st.maxLifetime || null,
              maxClaimsPerYear: st.maxClaimsPerYear || null,
              maxClaimsLifetime: st.maxClaimsLifetime || null,
              isActive: st.isActive !== undefined ? st.isActive : true,
              sortOrder: st.sortOrder || 0,
            },
          });
        } else {
          // Create new sub-type
          await prisma.welfareSubType.create({
            data: {
              welfareTypeId: id,
              code: st.code,
              name: st.name,
              description: st.description || null,
              amount: st.amount,
              unitType: st.unitType || "LUMP_SUM",
              maxPerRequest: st.maxPerRequest || null,
              maxPerYear: st.maxPerYear || null,
              maxLifetime: st.maxLifetime || null,
              maxClaimsPerYear: st.maxClaimsPerYear || null,
              maxClaimsLifetime: st.maxClaimsLifetime || null,
              sortOrder: st.sortOrder || 0,
            },
          });
        }
      }
    }

    // Update required documents if provided
    if (requiredDocuments && Array.isArray(requiredDocuments)) {
      for (const doc of requiredDocuments) {
        if (doc.id) {
          // Update existing document
          await prisma.requiredDocument.update({
            where: { id: doc.id },
            data: {
              name: doc.name,
              description: doc.description || null,
              isRequired: doc.isRequired !== undefined ? doc.isRequired : true,
              sortOrder: doc.sortOrder || 0,
            },
          });
        } else {
          // Create new document
          await prisma.requiredDocument.create({
            data: {
              welfareTypeId: id,
              name: doc.name,
              description: doc.description || null,
              isRequired: doc.isRequired !== undefined ? doc.isRequired : true,
              sortOrder: doc.sortOrder || 0,
            },
          });
        }
      }
    }

    // Fetch updated welfare type
    const updatedWelfareType = await prisma.welfareType.findUnique({
      where: { id },
      include: {
        subTypes: {
          orderBy: { sortOrder: "asc" },
        },
        requiredDocuments: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      welfareType: updatedWelfareType,
      welfare: updatedWelfareType, // backward compatibility
    });
  } catch (error) {
    console.error("Error updating welfare type:", error);
    return NextResponse.json(
      { error: "Failed to update welfare type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/welfare-management/[id]
 * Delete a welfare type (soft delete by setting isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if welfare type exists
    const welfareType = await prisma.welfareType.findUnique({
      where: { id },
      include: {
        subTypes: {
          include: {
            claims: true,
          },
        },
      },
    });

    if (!welfareType) {
      return NextResponse.json(
        { error: "Welfare type not found" },
        { status: 404 }
      );
    }

    // Check if there are existing claims for any sub-type
    const hasClaims = welfareType.subTypes.some(st => st.claims.length > 0);

    if (hasClaims) {
      // Soft delete - just disable
      await prisma.welfareType.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ 
        success: true,
        message: "Welfare type has been disabled (has existing claims)",
        softDeleted: true,
      });
    }

    // Hard delete if no claims
    // First delete required documents
    await prisma.requiredDocument.deleteMany({
      where: { welfareTypeId: id },
    });

    // Delete sub-types
    await prisma.welfareSubType.deleteMany({
      where: { welfareTypeId: id },
    });

    // Delete welfare type
    await prisma.welfareType.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Welfare type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting welfare type:", error);
    return NextResponse.json(
      { error: "Failed to delete welfare type" },
      { status: 500 }
    );
  }
}