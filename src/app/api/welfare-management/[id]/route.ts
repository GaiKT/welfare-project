import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const welfare = await prisma.welfare.findUnique({
      where: { id },
      include: {
        claims: {
          include: {
            user: {
              select: {
                identity: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            claims: true,
          },
        },
      },
    });

    if (!welfare) {
      return NextResponse.json(
        { error: "Welfare program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ welfare });
  } catch (error) {
    console.error("Error fetching welfare program:", error);
    return NextResponse.json(
      { error: "Failed to fetch welfare program" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const data = await request.json();
    const { name, description, budget, maxUsed, duration } = data;

    // Check if welfare program exists
    const existingWelfare = await prisma.welfare.findUnique({
      where: { id },
    });

    if (!existingWelfare) {
      return NextResponse.json(
        { error: "Welfare program not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !budget || !maxUsed || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (budget <= 0 || maxUsed <= 0 || duration <= 0) {
      return NextResponse.json(
        { error: "Budget, max usage, and duration must be positive numbers" },
        { status: 400 }
      );
    }

    if (maxUsed > budget) {
      return NextResponse.json(
        { error: "Maximum individual usage cannot exceed total budget" },
        { status: 400 }
      );
    }

    const welfare = await prisma.welfare.update({
      where: { id },
      data: {
        name,
        description: description || null,
        budget,
        maxUsed,
        duration,
      },
    });

    return NextResponse.json({ welfare });
  } catch (error) {
    console.error("Error updating welfare program:", error);
    return NextResponse.json(
      { error: "Failed to update welfare program" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if welfare program exists
    const welfare = await prisma.welfare.findUnique({
      where: { id },
      include: {
        claims: true,
      },
    });

    if (!welfare) {
      return NextResponse.json(
        { error: "Welfare program not found" },
        { status: 404 }
      );
    }

    // Check if there are existing claims
    if (welfare.claims.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete welfare program with existing claims. Please resolve all claims first." 
        },
        { status: 400 }
      );
    }

    await prisma.welfare.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Welfare program deleted successfully" });
  } catch (error) {
    console.error("Error deleting welfare program:", error);
    return NextResponse.json(
      { error: "Failed to delete welfare program" },
      { status: 500 }
    );
  }
}