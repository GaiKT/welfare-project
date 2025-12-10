import { PrismaClient, WelfareUnitType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // =============================================
  // ADMIN USERS
  // =============================================

  // Create default super admin
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const superAdmin = await prisma.admin.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      email: "superadmin@welfare.com",
      password: hashedPassword,
      name: "Super Administrator",
      role: "PRIMARY",
      isActive: true,
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  console.log("✅ Created super admin:", superAdmin.username);

  // Create default admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@welfare.com",
      password: adminPassword,
      name: "Administrator",
      role: "ADMIN",
      isActive: true,
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  console.log("✅ Created admin:", admin.username);

  // Create default manager
  const managerPassword = await bcrypt.hash("manager123", 12);
  
  const manager = await prisma.admin.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      email: "manager@welfare.com",
      password: managerPassword,
      name: "Manager",
      role: "MANAGER",
      isActive: true,
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  console.log("✅ Created manager:", manager.username);

  // =============================================
  // SAMPLE USERS
  // =============================================

  const userPassword = await bcrypt.hash("user123", 12);
  
  const user1 = await prisma.user.upsert({
    where: { identity: "EMP001" },
    update: {},
    create: {
      identity: "EMP001",
      firstName: "สมชาย",
      lastName: "ใจดี",
      title: "นาย",
      email: "somchai@company.com",
      phone: "0812345678",
      password: userPassword,
      isActive: true,
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { identity: "EMP002" },
    update: {},
    create: {
      identity: "EMP002",
      firstName: "สมหญิง",
      lastName: "รักงาน",
      title: "นางสาว",
      email: "somying@company.com",
      phone: "0823456789",
      password: userPassword,
      isActive: true,
      isFirstLogin: false,
      mustChangePassword: false,
    },
  });

  console.log("✅ Created users:", [user1.identity, user2.identity]);

  // =============================================
  // WELFARE TYPES AND SUB-TYPES
  // =============================================

  // 1. สวัสดิการสงเคราะห์เกี่ยวกับศพ
  const funeralWelfare = await prisma.welfareType.upsert({
    where: { code: "FUNERAL" },
    update: {},
    create: {
      code: "FUNERAL",
      name: "สวัสดิการสงเคราะห์เกี่ยวกับศพ",
      description: "สวัสดิการช่วยเหลือกรณีสมาชิกหรือครอบครัวเสียชีวิต",
      isActive: true,
      sortOrder: 1,
    },
  });

  // Sub-types for Funeral
  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: funeralWelfare.id, code: "MEMBER" } },
    update: {},
    create: {
      welfareTypeId: funeralWelfare.id,
      code: "MEMBER",
      name: "สมาชิกเสียชีวิต",
      description: "กรณีสมาชิกเสียชีวิต",
      amount: 10000,
      unitType: WelfareUnitType.LUMP_SUM,
      sortOrder: 1,
    },
  });

  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: funeralWelfare.id, code: "FAMILY" } },
    update: {},
    create: {
      welfareTypeId: funeralWelfare.id,
      code: "FAMILY",
      name: "ครอบครัวสมาชิกเสียชีวิต",
      description: "กรณีคู่สมรสหรือบุตรของสมาชิกเสียชีวิต",
      amount: 10000,
      unitType: WelfareUnitType.LUMP_SUM,
      sortOrder: 2,
    },
  });

  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: funeralWelfare.id, code: "PARENT" } },
    update: {},
    create: {
      welfareTypeId: funeralWelfare.id,
      code: "PARENT",
      name: "บิดา/มารดาเสียชีวิต",
      description: "กรณีบิดาหรือมารดาของสมาชิกเสียชีวิต",
      amount: 5000,
      unitType: WelfareUnitType.LUMP_SUM,
      sortOrder: 3,
    },
  });

  // Required documents for Funeral
  const funeralDocs = [
    { name: "สำเนาบัตรประชาชนสมาชิก", sortOrder: 1 },
    { name: "ทะเบียนบ้านสมาชิก", sortOrder: 2 },
    { name: "ใบมรณะบัตร", sortOrder: 3 },
    { name: "ทะเบียนบ้านผู้เสียชีวิต", sortOrder: 4 },
    { name: "หน้าบัญชีรับเงิน", sortOrder: 5 },
  ];

  for (const doc of funeralDocs) {
    await prisma.requiredDocument.upsert({
      where: { id: `${funeralWelfare.id}-${doc.sortOrder}` },
      update: {},
      create: {
        id: `${funeralWelfare.id}-${doc.sortOrder}`,
        welfareTypeId: funeralWelfare.id,
        name: doc.name,
        isRequired: true,
        sortOrder: doc.sortOrder,
      },
    });
  }

  console.log("✅ Created welfare type: สวัสดิการสงเคราะห์เกี่ยวกับศพ (3 sub-types, 5 documents)");

  // 2. สวัสดิการรักษาพยาบาล
  const medicalWelfare = await prisma.welfareType.upsert({
    where: { code: "MEDICAL" },
    update: {},
    create: {
      code: "MEDICAL",
      name: "สวัสดิการรักษาพยาบาล",
      description: "สวัสดิการช่วยเหลือค่ารักษาพยาบาลกรณีเป็นผู้ป่วยใน",
      isActive: true,
      sortOrder: 2,
    },
  });

  // Sub-type for Medical (only one: inpatient)
  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: medicalWelfare.id, code: "INPATIENT" } },
    update: {},
    create: {
      welfareTypeId: medicalWelfare.id,
      code: "INPATIENT",
      name: "ผู้ป่วยใน",
      description: "ค่าชดเชยการนอนพักรักษาตัวในโรงพยาบาล คืนละ 500 บาท",
      amount: 500, // ต่อคืน
      unitType: WelfareUnitType.PER_NIGHT,
      maxPerRequest: 5000, // สูงสุดต่อครั้ง
      maxPerYear: 10000, // สูงสุดต่อปี
      sortOrder: 1,
    },
  });

  // Required documents for Medical
  const medicalDocs = [
    { name: "สำเนาบัตรประชาชนสมาชิก", sortOrder: 1 },
    { name: "หลักฐานที่สถานพยาบาลออกให้", sortOrder: 2 },
    { name: "หน้าบัญชีรับเงิน", sortOrder: 3 },
  ];

  for (const doc of medicalDocs) {
    await prisma.requiredDocument.upsert({
      where: { id: `${medicalWelfare.id}-${doc.sortOrder}` },
      update: {},
      create: {
        id: `${medicalWelfare.id}-${doc.sortOrder}`,
        welfareTypeId: medicalWelfare.id,
        name: doc.name,
        isRequired: true,
        sortOrder: doc.sortOrder,
      },
    });
  }

  console.log("✅ Created welfare type: สวัสดิการรักษาพยาบาล (1 sub-type, 3 documents)");

  // 3. สวัสดิการมงคลสมรส
  const marriageWelfare = await prisma.welfareType.upsert({
    where: { code: "MARRIAGE" },
    update: {},
    create: {
      code: "MARRIAGE",
      name: "สวัสดิการมงคลสมรส",
      description: "สวัสดิการช่วยเหลือกรณีสมาชิกจดทะเบียนสมรส (ได้ครั้งเดียวตลอดการเป็นสมาชิก)",
      isActive: true,
      sortOrder: 3,
    },
  });

  // Sub-type for Marriage
  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: marriageWelfare.id, code: "MARRIAGE" } },
    update: {},
    create: {
      welfareTypeId: marriageWelfare.id,
      code: "MARRIAGE",
      name: "มงคลสมรส",
      description: "เงินช่วยเหลือกรณีจดทะเบียนสมรส",
      amount: 2000,
      unitType: WelfareUnitType.LUMP_SUM,
      maxClaimsLifetime: 1, // ได้ครั้งเดียวตลอดการเป็นสมาชิก
      sortOrder: 1,
    },
  });

  // Required documents for Marriage
  const marriageDocs = [
    { name: "สำเนาบัตรประชาชนสมาชิก", sortOrder: 1 },
    { name: "ทะเบียนสมรส", sortOrder: 2 },
    { name: "สำเนาบัตรประชาชนคู่สมรส", sortOrder: 3 },
    { name: "หน้าบัญชีรับเงิน", sortOrder: 4 },
  ];

  for (const doc of marriageDocs) {
    await prisma.requiredDocument.upsert({
      where: { id: `${marriageWelfare.id}-${doc.sortOrder}` },
      update: {},
      create: {
        id: `${marriageWelfare.id}-${doc.sortOrder}`,
        welfareTypeId: marriageWelfare.id,
        name: doc.name,
        isRequired: true,
        sortOrder: doc.sortOrder,
      },
    });
  }

  console.log("✅ Created welfare type: สวัสดิการมงคลสมรส (1 sub-type, 4 documents)");

  // 4. สวัสดิการรับขวัญทายาทใหม่
  const newbornWelfare = await prisma.welfareType.upsert({
    where: { code: "NEWBORN" },
    update: {},
    create: {
      code: "NEWBORN",
      name: "สวัสดิการรับขวัญทายาทใหม่",
      description: "สวัสดิการช่วยเหลือกรณีสมาชิกมีบุตรใหม่",
      isActive: true,
      sortOrder: 4,
    },
  });

  // Sub-type for Newborn
  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: newbornWelfare.id, code: "NEWBORN" } },
    update: {},
    create: {
      welfareTypeId: newbornWelfare.id,
      code: "NEWBORN",
      name: "รับขวัญทายาทใหม่",
      description: "เงินช่วยเหลือกรณีมีบุตรใหม่",
      amount: 2000,
      unitType: WelfareUnitType.LUMP_SUM,
      sortOrder: 1,
    },
  });

  // Required documents for Newborn
  const newbornDocs = [
    { name: "สำเนาบัตรประชาชนสมาชิก", sortOrder: 1 },
    { name: "ทะเบียนสมรส", sortOrder: 2 },
    { name: "สูติบัตรบุตร", sortOrder: 3 },
    { name: "สำเนาบัตรประชาชนคู่สมรส", sortOrder: 4 },
    { name: "หน้าบัญชีรับเงิน", sortOrder: 5 },
  ];

  for (const doc of newbornDocs) {
    await prisma.requiredDocument.upsert({
      where: { id: `${newbornWelfare.id}-${doc.sortOrder}` },
      update: {},
      create: {
        id: `${newbornWelfare.id}-${doc.sortOrder}`,
        welfareTypeId: newbornWelfare.id,
        name: doc.name,
        isRequired: true,
        sortOrder: doc.sortOrder,
      },
    });
  }

  console.log("✅ Created welfare type: สวัสดิการรับขวัญทายาทใหม่ (1 sub-type, 5 documents)");

  // 5. สวัสดิการประสบภัยพิบัติ
  const disasterWelfare = await prisma.welfareType.upsert({
    where: { code: "DISASTER" },
    update: {},
    create: {
      code: "DISASTER",
      name: "สวัสดิการประสบภัยพิบัติ",
      description: "สวัสดิการช่วยเหลือกรณีสมาชิกประสบภัยพิบัติ (2,000 บาท/ครั้ง ตลอดสมาชิกไม่เกิน 20,000 บาท)",
      isActive: true,
      sortOrder: 5,
    },
  });

  // Sub-type for Disaster
  await prisma.welfareSubType.upsert({
    where: { welfareTypeId_code: { welfareTypeId: disasterWelfare.id, code: "DISASTER" } },
    update: {},
    create: {
      welfareTypeId: disasterWelfare.id,
      code: "DISASTER",
      name: "ประสบภัยพิบัติ",
      description: "เงินช่วยเหลือกรณีประสบภัยพิบัติ ครั้งละ 2,000 บาท",
      amount: 2000,
      unitType: WelfareUnitType.PER_INCIDENT,
      maxLifetime: 20000, // สูงสุดตลอดการเป็นสมาชิก
      sortOrder: 1,
    },
  });

  // Required documents for Disaster
  const disasterDocs = [
    { name: "สำเนาบัตรประชาชนสมาชิก", sortOrder: 1 },
    { name: "ทะเบียนบ้านสมาชิก", sortOrder: 2 },
    { name: "ทะเบียนบ้านที่ประสบภัย", sortOrder: 3 },
    { name: "หนังสือรับรองการประสบภัยพิบัติ", sortOrder: 4 },
    { name: "รูปถ่ายทรัพย์สินที่เสียหาย", sortOrder: 5 },
    { name: "หน้าบัญชีรับเงิน", sortOrder: 6 },
  ];

  for (const doc of disasterDocs) {
    await prisma.requiredDocument.upsert({
      where: { id: `${disasterWelfare.id}-${doc.sortOrder}` },
      update: {},
      create: {
        id: `${disasterWelfare.id}-${doc.sortOrder}`,
        welfareTypeId: disasterWelfare.id,
        name: doc.name,
        isRequired: true,
        sortOrder: doc.sortOrder,
      },
    });
  }

  console.log("✅ Created welfare type: สวัสดิการประสบภัยพิบัติ (1 sub-type, 6 documents)");

  // =============================================
  // SUMMARY
  // =============================================

  console.log("\n📊 Seed Summary:");
  console.log("================");
  console.log("Admins: 3 (superadmin, admin, manager)");
  console.log("Users: 2 (EMP001, EMP002)");
  console.log("Welfare Types: 5");
  console.log("  - สงเคราะห์ศพ: 3 sub-types (สมาชิก 10,000 / ครอบครัว 10,000 / บิดามารดา 5,000)");
  console.log("  - รักษาพยาบาล: 1 sub-type (500/คืน, max 5,000/ครั้ง, max 10,000/ปี)");
  console.log("  - มงคลสมรส: 1 sub-type (2,000, ครั้งเดียวตลอดสมาชิก)");
  console.log("  - รับขวัญทายาท: 1 sub-type (2,000)");
  console.log("  - ประสบภัยพิบัติ: 1 sub-type (2,000/ครั้ง, max 20,000 ตลอดสมาชิก)");
  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });