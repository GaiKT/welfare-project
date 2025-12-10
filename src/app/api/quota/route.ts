import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { getUserQuotaSummary } from "@/lib/welfare-validation";
import { UserType } from "@/types/auth";

/**
 * GET /api/quota
 * Get current user's welfare quota summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only regular users have quotas
    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { error: "Only regular users have welfare quotas" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fiscalYearParam = searchParams.get("fiscalYear");
    const fiscalYear = fiscalYearParam ? parseInt(fiscalYearParam) : getCurrentFiscalYear();

    const quotaSummary = await getUserQuotaSummary(session.user.id, fiscalYear);

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      fiscalYear,
      quotas: quotaSummary,
    });
  } catch (error) {
    console.error("Error fetching quota:", error);
    return NextResponse.json(
      { error: "Failed to fetch quota" },
      { status: 500 }
    );
  }
}
