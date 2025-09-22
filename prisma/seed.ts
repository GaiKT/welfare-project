import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

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
      role: "SUPER_ADMIN",
      isActive: true,
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
    },
  });

  console.log("✅ Created admin:", admin.username);

  // Create sample welfare programs
  const medicalWelfare = await prisma.welfare.upsert({
    where: { id: "medical-welfare-id" },
    update: {},
    create: {
      id: "medical-welfare-id",
      name: "Medical Welfare",
      description: "Medical expenses reimbursement up to $5000 per year",
      budget: 50000,
      maxUsed: 5000,
      duration: 365, // days
    },
  });

  const educationWelfare = await prisma.welfare.upsert({
    where: { id: "education-welfare-id" },
    update: {},
    create: {
      id: "education-welfare-id",
      name: "Education Welfare",
      description: "Training and education support up to $3000 per year",
      budget: 30000,
      maxUsed: 3000,
      duration: 365,
    },
  });

  console.log("✅ Created welfare programs:", [medicalWelfare.name, educationWelfare.name]);

  // Create sample users
  const userPassword = await bcrypt.hash("user123", 12);
  
  const user1 = await prisma.user.upsert({
    where: { identity: "EMP001" },
    update: {},
    create: {
      identity: "EMP001",
      firstName: "John",
      lastName: "Doe",
      title: "Software Engineer",
      email: "john.doe@company.com",
      phone: "+1234567890",
      password: userPassword,
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { identity: "EMP002" },
    update: {},
    create: {
      identity: "EMP002",
      firstName: "Jane",
      lastName: "Smith",
      title: "Product Manager",
      email: "jane.smith@company.com",
      phone: "+1234567891",
      password: userPassword,
      isActive: true,
    },
  });

  console.log("✅ Created users:", [user1.identity, user2.identity]);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });