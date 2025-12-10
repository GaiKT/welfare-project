import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/welfare-management/[id]/documents/[docId]
 * Update a required document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requireAdmin();
    const { id, docId } = await params;

    // Check if document exists
    const existingDoc = await prisma.requiredDocument.findFirst({
      where: {
        id: docId,
        welfareTypeId: id,
      },
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { name, description, isRequired, sortOrder } = data;

    const document = await prisma.requiredDocument.update({
      where: { id: docId },
      data: {
        name: name || existingDoc.name,
        description: description !== undefined ? description : existingDoc.description,
        isRequired: isRequired !== undefined ? isRequired : existingDoc.isRequired,
        sortOrder: sortOrder !== undefined ? sortOrder : existingDoc.sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Error updating required document:", error);
    return NextResponse.json(
      { error: "Failed to update required document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/welfare-management/[id]/documents/[docId]
 * Delete a required document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requireAdmin();
    const { id, docId } = await params;

    // Check if document exists
    const document = await prisma.requiredDocument.findFirst({
      where: {
        id: docId,
        welfareTypeId: id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await prisma.requiredDocument.delete({
      where: { id: docId },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting required document:", error);
    return NextResponse.json(
      { error: "Failed to delete required document" },
      { status: 500 }
    );
  }
}
