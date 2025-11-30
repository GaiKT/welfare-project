import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Allow all authenticated users to view welfare programs
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const welfarePrograms = await prisma.welfare.findMany({
      include: {
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Fetched welfare programs:", welfarePrograms);

    return NextResponse.json({ welfarePrograms });
  } catch (error) {
    console.error("Error fetching welfare programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch welfare programs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const data = await request.json();
    const { name, description, budget, maxUsed, duration } = data;

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

    const welfare = await prisma.welfare.create({
      data: {
        name,
        description: description || null,
        budget,
        maxUsed,
        duration,
      },
    });

    return NextResponse.json({ welfare }, { status: 201 });
  } catch (error) {
    console.error("Error creating welfare program:", error);
    return NextResponse.json(
      { error: "Failed to create welfare program" },
      { status: 500 }
    );
  }
}