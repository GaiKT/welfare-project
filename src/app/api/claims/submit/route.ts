import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { uploadMultipleFiles } from "@/lib/file-upload";
import { UserType } from "@/types/auth";
import { validateWelfareClaim } from "@/lib/welfare-validation";
import { WelfareUnitType, BeneficiaryRelation } from "@prisma/client";

/**
 * POST /api/claims/submit
 * Submit a new welfare claim with file attachments
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only regular users can submit claims
    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { error: "Only regular users can submit claims" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    console.log("Received claim submission");
    
    // Get form fields
    const welfareSubTypeId = formData.get("welfareSubTypeId") as string;
    // Also support old field name for backward compatibility
    const legacyWelfareId = formData.get("welfareId") as string;
    const subTypeId = welfareSubTypeId || legacyWelfareId;
    
    const description = formData.get("description") as string;
    const nights = formData.get("nights") ? parseInt(formData.get("nights") as string) : undefined;
    const beneficiaryName = formData.get("beneficiaryName") as string;
    const beneficiaryRelation = formData.get("beneficiaryRelation") as BeneficiaryRelation | undefined;
    const incidentDateStr = formData.get("incidentDate") as string;
    const hospitalName = formData.get("hospitalName") as string;
    const admissionDateStr = formData.get("admissionDate") as string;
    const dischargeDateStr = formData.get("dischargeDate") as string;

    // Validation
    if (!subTypeId) {
      return NextResponse.json(
        { error: "กรุณาเลือกประเภทสวัสดิการ" },
        { status: 400 }
      );
    }

    const fiscalYear = getCurrentFiscalYear();
    const userId = session.user.id;

    // Get welfare sub-type details
    const welfareSubType = await prisma.welfareSubType.findUnique({
      where: { id: subTypeId },
      include: {
        welfareType: {
          include: {
            requiredDocuments: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!welfareSubType) {
      return NextResponse.json(
        { error: "ไม่พบประเภทสวัสดิการที่เลือก" },
        { status: 404 }
      );
    }

    if (!welfareSubType.isActive || !welfareSubType.welfareType.isActive) {
      return NextResponse.json(
        { error: "สวัสดิการนี้ไม่เปิดใช้งาน" },
        { status: 400 }
      );
    }

    // For PER_NIGHT (medical) welfare, nights is required
    if (welfareSubType.unitType === WelfareUnitType.PER_NIGHT && (!nights || nights <= 0)) {
      return NextResponse.json(
        { error: "กรุณาระบุจำนวนคืนที่พักรักษาตัว" },
        { status: 400 }
      );
    }

    // Validate claim eligibility
    const validation = await validateWelfareClaim({
      userId,
      welfareSubTypeId: subTypeId,
      nights,
      fiscalYear,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.message || "ไม่สามารถยื่นคำขอได้",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Handle file uploads
    const files: File[] = [];
    const documentNames: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
        // Extract document name from key (e.g., "file_สำเนาบัตรประชาชน" -> "สำเนาบัตรประชาชน")
        const docName = key.replace("file_", "").replace(/_\d+$/, "");
        documentNames.push(decodeURIComponent(docName));
      } else if (key.startsWith("file") && value instanceof File) {
        // Legacy file upload support
        files.push(value);
        documentNames.push("เอกสารแนบ");
      }
    }

    // Check required documents
    const requiredDocs = welfareSubType.welfareType.requiredDocuments.filter(d => d.isRequired);
    if (requiredDocs.length > 0 && files.length < requiredDocs.length) {
      return NextResponse.json(
        { 
          error: `กรุณาแนบเอกสารให้ครบถ้วน (ต้องแนบ ${requiredDocs.length} รายการ)`,
          requiredDocuments: requiredDocs.map(d => d.name),
        },
        { status: 400 }
      );
    }

    let uploadedFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }> = [];
    
    if (files.length > 0) {
      try {
        uploadedFiles = await uploadMultipleFiles(files, "claims");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          { error: `การอัพโหลดไฟล์ล้มเหลว: ${errorMessage}` },
          { status: 400 }
        );
      }
    }

    // Parse dates
    const incidentDate = incidentDateStr ? new Date(incidentDateStr) : null;
    const admissionDate = admissionDateStr ? new Date(admissionDateStr) : null;
    const dischargeDate = dischargeDateStr ? new Date(dischargeDateStr) : null;

    // Create claim
    const claim = await prisma.welfareClaims.create({
      data: {
        userId,
        welfareSubTypeId: subTypeId,
        requestedAmount: validation.calculatedAmount,
        nights: nights || null,
        beneficiaryName: beneficiaryName || null,
        beneficiaryRelation: beneficiaryRelation || null,
        description: description || null,
        incidentDate,
        hospitalName: hospitalName || null,
        admissionDate,
        dischargeDate,
        status: "PENDING",
        fiscalYear,
        documents: {
          create: uploadedFiles.map((file, index) => ({
            documentName: documentNames[index] || "เอกสารแนบ",
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileType: file.fileType,
            fileSize: file.fileSize,
          })),
        },
      },
      include: {
        documents: true,
        welfareSubType: {
          include: {
            welfareType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "ยื่นคำขอสำเร็จ",
      data:{
        claim: {
          id: claim.id,
          requestedAmount: claim.requestedAmount,
          nights: claim.nights,
          status: claim.status,
          welfareTypeName: claim.welfareSubType.welfareType.name,
          welfareSubTypeName: claim.welfareSubType.name,
          documentCount: claim.documents.length,
          submittedDate: claim.submittedDate,
        },
      },
    });
  } catch (error) {
    console.error("Submit claim error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยื่นคำขอ" },
      { status: 500 }
    );
  }
}
