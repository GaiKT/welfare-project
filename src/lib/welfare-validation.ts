import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { WelfareUnitType } from "@prisma/client";

export interface WelfareValidationResult {
  isValid: boolean;
  calculatedAmount: number;
  maxClaimable: number;
  remainingYearly: number | null;
  remainingLifetime: number | null;
  remainingClaimsYearly: number | null;
  remainingClaimsLifetime: number | null;
  message?: string;
  errors: string[];
}

export interface ValidateWelfareClaimParams {
  userId: string;
  welfareSubTypeId: string;
  requestedAmount?: number;
  nights?: number; // For medical welfare (PER_NIGHT)
  fiscalYear?: number;
}

/**
 * Validate if a user can make a welfare claim based on various limits
 */
export async function validateWelfareClaim(
  params: ValidateWelfareClaimParams
): Promise<WelfareValidationResult> {
  const {
    userId,
    welfareSubTypeId,
    requestedAmount,
    nights,
    fiscalYear = getCurrentFiscalYear(),
  } = params;

  const errors: string[] = [];

  // Get welfare sub-type with its settings
  const subType = await prisma.welfareSubType.findUnique({
    where: { id: welfareSubTypeId },
    include: {
      welfareType: true,
    },
  });

  if (!subType) {
    return {
      isValid: false,
      calculatedAmount: 0,
      maxClaimable: 0,
      remainingYearly: null,
      remainingLifetime: null,
      remainingClaimsYearly: null,
      remainingClaimsLifetime: null,
      message: "ไม่พบประเภทสวัสดิการที่เลือก",
      errors: ["Welfare sub-type not found"],
    };
  }

  if (!subType.isActive) {
    return {
      isValid: false,
      calculatedAmount: 0,
      maxClaimable: 0,
      remainingYearly: null,
      remainingLifetime: null,
      remainingClaimsYearly: null,
      remainingClaimsLifetime: null,
      message: "สวัสดิการนี้ไม่เปิดใช้งาน",
      errors: ["Welfare sub-type is not active"],
    };
  }

  // Get or create quota tracking
  let quota = await prisma.welfareQuota.findUnique({
    where: {
      userId_welfareSubTypeId_fiscalYear: {
        userId,
        welfareSubTypeId,
        fiscalYear,
      },
    },
  });

  // If no quota exists, create default values
  const usedAmountYear = quota?.usedAmountYear || 0;
  const usedClaimsYear = quota?.usedClaimsYear || 0;
  const usedAmountLifetime = quota?.usedAmountLifetime || 0;
  const usedClaimsLifetime = quota?.usedClaimsLifetime || 0;

  // Calculate amount based on unit type
  let calculatedAmount: number;

  if (subType.unitType === WelfareUnitType.PER_NIGHT) {
    // Medical welfare - calculate by nights
    if (!nights || nights <= 0) {
      errors.push("กรุณาระบุจำนวนคืนที่พักรักษาตัว");
      calculatedAmount = 0;
    } else {
      calculatedAmount = subType.amount * nights;
    }
  } else if (subType.unitType === WelfareUnitType.PER_INCIDENT) {
    // Disaster welfare - fixed amount per incident
    calculatedAmount = subType.amount;
  } else {
    // LUMP_SUM - use requested amount or default amount
    calculatedAmount = requestedAmount || subType.amount;
  }

  // Apply maxPerRequest limit
  if (subType.maxPerRequest && calculatedAmount > subType.maxPerRequest) {
    calculatedAmount = subType.maxPerRequest;
  }

  // Calculate remaining quotas
  let remainingYearly: number | null = null;
  let remainingLifetime: number | null = null;
  let remainingClaimsYearly: number | null = null;
  let remainingClaimsLifetime: number | null = null;
  let maxClaimable = calculatedAmount;

  // Check yearly amount limit
  if (subType.maxPerYear) {
    remainingYearly = subType.maxPerYear - usedAmountYear;
    if (remainingYearly <= 0) {
      errors.push(`คุณใช้สิทธิ์เต็มโควต้าประจำปีแล้ว (${subType.maxPerYear.toLocaleString()} บาท)`);
      maxClaimable = 0;
    } else if (calculatedAmount > remainingYearly) {
      maxClaimable = Math.min(maxClaimable, remainingYearly);
    }
  }

  // Check lifetime amount limit
  if (subType.maxLifetime) {
    remainingLifetime = subType.maxLifetime - usedAmountLifetime;
    if (remainingLifetime <= 0) {
      errors.push(`คุณใช้สิทธิ์เต็มโควต้าตลอดการเป็นสมาชิกแล้ว (${subType.maxLifetime.toLocaleString()} บาท)`);
      maxClaimable = 0;
    } else if (calculatedAmount > remainingLifetime) {
      maxClaimable = Math.min(maxClaimable, remainingLifetime);
    }
  }

  // Check yearly claims count limit
  if (subType.maxClaimsPerYear) {
    remainingClaimsYearly = subType.maxClaimsPerYear - usedClaimsYear;
    if (remainingClaimsYearly <= 0) {
      errors.push(`คุณเบิกครบจำนวนครั้งที่กำหนดต่อปีแล้ว (${subType.maxClaimsPerYear} ครั้ง)`);
      maxClaimable = 0;
    }
  }

  // Check lifetime claims count limit
  if (subType.maxClaimsLifetime) {
    remainingClaimsLifetime = subType.maxClaimsLifetime - usedClaimsLifetime;
    if (remainingClaimsLifetime <= 0) {
      errors.push(`คุณใช้สิทธิ์ครบตามจำนวนครั้งที่กำหนดตลอดการเป็นสมาชิกแล้ว (${subType.maxClaimsLifetime} ครั้ง)`);
      maxClaimable = 0;
    }
  }

  const isValid = errors.length === 0 && maxClaimable > 0;

  return {
    isValid,
    calculatedAmount: Math.min(calculatedAmount, maxClaimable),
    maxClaimable,
    remainingYearly,
    remainingLifetime,
    remainingClaimsYearly,
    remainingClaimsLifetime,
    message: errors.length > 0 ? errors[0] : undefined,
    errors,
  };
}

/**
 * Update quota after a claim is approved
 */
export async function updateWelfareQuota(
  userId: string,
  welfareSubTypeId: string,
  approvedAmount: number,
  fiscalYear: number = getCurrentFiscalYear()
): Promise<void> {
  // First check if quota exists
  const existingQuota = await prisma.welfareQuota.findUnique({
    where: {
      userId_welfareSubTypeId_fiscalYear: {
        userId,
        welfareSubTypeId,
        fiscalYear,
      },
    },
  });

  if (existingQuota) {
    // Update existing quota
    await prisma.welfareQuota.update({
      where: {
        userId_welfareSubTypeId_fiscalYear: {
          userId,
          welfareSubTypeId,
          fiscalYear,
        },
      },
      data: {
        usedAmountYear: { increment: approvedAmount },
        usedClaimsYear: { increment: 1 },
        usedAmountLifetime: { increment: approvedAmount },
        usedClaimsLifetime: { increment: 1 },
      },
    });
  } else {
    // Create new quota record
    await prisma.welfareQuota.create({
      data: {
        userId,
        welfareSubTypeId,
        fiscalYear,
        usedAmountYear: approvedAmount,
        usedClaimsYear: 1,
        usedAmountLifetime: approvedAmount,
        usedClaimsLifetime: 1,
      },
    });
  }
}

/**
 * Get user's quota summary for all welfare sub-types
 */
export async function getUserQuotaSummary(
  userId: string,
  fiscalYear: number = getCurrentFiscalYear()
) {
  // Get all welfare sub-types with their settings
  const subTypes = await prisma.welfareSubType.findMany({
    where: { isActive: true },
    include: {
      welfareType: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: [
      { welfareType: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  // Get user's quotas
  const quotas = await prisma.welfareQuota.findMany({
    where: {
      userId,
      fiscalYear,
    },
  });

  const quotaMap = new Map(quotas.map(q => [q.welfareSubTypeId, q]));

  // Build summary for each sub-type
  return subTypes.map(subType => {
    const quota = quotaMap.get(subType.id);

    const usedAmountYear = quota?.usedAmountYear || 0;
    const usedClaimsYear = quota?.usedClaimsYear || 0;
    const usedAmountLifetime = quota?.usedAmountLifetime || 0;
    const usedClaimsLifetime = quota?.usedClaimsLifetime || 0;

    let remainingYearly: number | null = null;
    let remainingLifetime: number | null = null;
    let remainingClaimsYearly: number | null = null;
    let remainingClaimsLifetime: number | null = null;
    let canClaim = true;

    if (subType.maxPerYear) {
      remainingYearly = Math.max(0, subType.maxPerYear - usedAmountYear);
      if (remainingYearly <= 0) canClaim = false;
    }

    if (subType.maxLifetime) {
      remainingLifetime = Math.max(0, subType.maxLifetime - usedAmountLifetime);
      if (remainingLifetime <= 0) canClaim = false;
    }

    if (subType.maxClaimsPerYear) {
      remainingClaimsYearly = Math.max(0, subType.maxClaimsPerYear - usedClaimsYear);
      if (remainingClaimsYearly <= 0) canClaim = false;
    }

    if (subType.maxClaimsLifetime) {
      remainingClaimsLifetime = Math.max(0, subType.maxClaimsLifetime - usedClaimsLifetime);
      if (remainingClaimsLifetime <= 0) canClaim = false;
    }

    return {
      welfareTypeCode: subType.welfareType.code,
      welfareTypeName: subType.welfareType.name,
      subTypeId: subType.id,
      subTypeCode: subType.code,
      subTypeName: subType.name,
      amount: subType.amount,
      unitType: subType.unitType,
      maxPerRequest: subType.maxPerRequest,
      maxPerYear: subType.maxPerYear,
      maxLifetime: subType.maxLifetime,
      maxClaimsPerYear: subType.maxClaimsPerYear,
      maxClaimsLifetime: subType.maxClaimsLifetime,
      usedAmountYear,
      usedClaimsYear,
      usedAmountLifetime,
      usedClaimsLifetime,
      remainingYearly,
      remainingLifetime,
      remainingClaimsYearly,
      remainingClaimsLifetime,
      canClaim,
    };
  });
}
