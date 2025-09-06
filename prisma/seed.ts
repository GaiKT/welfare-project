import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create a default super admin
  const defaultAdminExists = await prisma.admin.findFirst({
    where: { username: "superadmin" }
  });

  if (!defaultAdminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    const superAdmin = await prisma.admin.create({
      data: {
        username: "superadmin",
        email: "admin@welfare.com",
        password: hashedPassword,
        name: "Super Administrator",
        role: "SUPER_ADMIN",
        isActive: true
      }
    });

    console.log("✅ Created super admin:", {
      id: superAdmin.id,
      username: superAdmin.username,
      email: superAdmin.email,
      role: superAdmin.role
    });

    // Create initial audit log
    await prisma.auditLog.create({
      data: {
        action: "INITIAL_SETUP",
        entity: "Admin",
        entityId: superAdmin.id,
        adminId: superAdmin.id
      }
    });

    console.log("📝 Created initial audit log");
  } else {
    console.log("ℹ️ Super admin already exists, skipping creation");
  }

  // Create sample welfare programs
  const existingWelfare = await prisma.welfare.findFirst();
  
  if (!existingWelfare) {
    const welfarePrograms = [
      {
        name: "Health Insurance",
        description: "Comprehensive health insurance coverage for employees",
        budget: 50000.00,
        maxUsed: 5000.00,
        duration: 365 // days
      },
      {
        name: "Education Allowance",
        description: "Financial support for continuing education and training",
        budget: 30000.00,
        maxUsed: 2000.00,
        duration: 365
      },
      {
        name: "Emergency Fund",
        description: "Emergency financial assistance for unexpected situations",
        budget: 20000.00,
        maxUsed: 1500.00,
        duration: 365
      },
      {
        name: "Fitness Program",
        description: "Gym membership and fitness-related expenses",
        budget: 15000.00,
        maxUsed: 1000.00,
        duration: 365
      }
    ];

    for (const welfare of welfarePrograms) {
      const created = await prisma.welfare.create({
        data: welfare
      });
      console.log(`✅ Created welfare program: ${created.name}`);
    }
  } else {
    console.log("ℹ️ Welfare programs already exist, skipping creation");
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
