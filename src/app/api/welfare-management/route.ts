import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/welfare-management
 * Get all welfare types with their sub-types and required documents
 */
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

    const welfareTypes = await prisma.welfareType.findMany({
      where: {
        isActive: true,
      },
      include: {
        subTypes: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        requiredDocuments: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        _count: {
          select: {
            subTypes: true,
            requiredDocuments: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    console.log("Fetched welfare types:", welfareTypes.length);

    return NextResponse.json({ 
      success: true,
      data: {
        welfareTypes,
        // Keep old name for backward compatibility
        welfarePrograms: welfareTypes,
      },
    });
  } catch (error) {
    console.error("Error fetching welfare types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch welfare types" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/welfare-management
 * Create a new welfare type with sub-types and required documents
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const data = await request.json();
    const { code, name, description, subTypes, requiredDocuments } = data;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingWelfare = await prisma.welfareType.findUnique({
      where: { code },
    });

    if (existingWelfare) {
      return NextResponse.json(
        { error: "Welfare type with this code already exists" },
        { status: 400 }
      );
    }

    // Create welfare type with sub-types and documents
    const welfareType = await prisma.welfareType.create({
      data: {
        code,
        name,
        description: description || null,
        subTypes: subTypes?.length > 0 ? {
          create: subTypes.map((st: {
            code: string;
            name: string;
            description?: string;
            amount: number;
            unitType?: string;
            maxPerRequest?: number;
            maxPerYear?: number;
            maxLifetime?: number;
            maxClaimsPerYear?: number;
            maxClaimsLifetime?: number;
            sortOrder?: number;
          }, index: number) => ({
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
            sortOrder: st.sortOrder || index + 1,
          })),
        } : undefined,
        requiredDocuments: requiredDocuments?.length > 0 ? {
          create: requiredDocuments.map((doc: {
            name: string;
            description?: string;
            isRequired?: boolean;
            sortOrder?: number;
          }, index: number) => ({
            name: doc.name,
            description: doc.description || null,
            isRequired: doc.isRequired !== false,
            sortOrder: doc.sortOrder || index + 1,
          })),
        } : undefined,
      },
      include: {
        subTypes: true,
        requiredDocuments: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Welfare type created successfully",
      data: {
        welfareType,
        welfare: welfareType, // backward compatibility
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating welfare type:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create welfare type" },
      { status: 500 }
    );
  }
}