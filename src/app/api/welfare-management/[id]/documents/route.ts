import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/welfare-management/[id]/documents
 * Add a new required document to a welfare type
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
    const { name, description, isRequired, sortOrder } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Document name is required" },
        { status: 400 }
      );
    }

    // Get max sort order
    const maxSortOrder = await prisma.requiredDocument.findFirst({
      where: { welfareTypeId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const document = await prisma.requiredDocument.create({
      data: {
        welfareTypeId: id,
        name,
        description: description || null,
        isRequired: isRequired !== false,
        sortOrder: sortOrder || (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      document,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating required document:", error);
    return NextResponse.json(
      { error: "Failed to create required document" },
      { status: 500 }
    );
  }
}
