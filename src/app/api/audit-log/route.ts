import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      OR?: Array<{ action?: { contains: string; mode: "insensitive" }; entity?: { contains: string; mode: "insensitive" }; entityId?: { contains: string; mode: "insensitive" }; admin?: { OR: Array<{ name?: { contains: string; mode: "insensitive" }; username?: { contains: string; mode: "insensitive" } }> } }>;
      action?: { contains: string; mode: "insensitive" };
      entity?: { contains: string; mode: "insensitive" };
      timestamp?: { gte?: Date; lte?: Date };
    } = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { admin: { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ] } },
      ];
    }

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    if (entity) {
      where.entity = { contains: entity, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get unique actions and entities for filters
    const [uniqueActions, uniqueEntities] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
      }),
      prisma.auditLog.findMany({
        select: { entity: true },
        distinct: ["entity"],
      }),
    ]);

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        actions: uniqueActions.map((a) => a.action),
        entities: uniqueEntities.map((e) => e.entity),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
