import {
  PrismaClient,
  UserRole,
  UserStatus,
} from "../src/generated/prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Create SuperAdmin
    const superAdminEmail =
      process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
    const superAdminPhone = process.env.SUPERADMIN_PHONE || "+8801700000000";
    const superAdminPassword =
      process.env.SUPERADMIN_PASSWORD || "securePassword123";

    console.log("📝 Creating SuperAdmin...");
    const passwordHash = await bcrypt.hash(superAdminPassword, SALT_ROUNDS);

    const superAdminUser = await prisma.user.upsert({
      where: { phone: superAdminPhone },
      update: {
        email: superAdminEmail,
        name: "Super Admin",
        phone: superAdminPhone,
        address: ["Admin Office"],
        passwordHash: passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: superAdminEmail,
        name: "Super Admin",
        phone: superAdminPhone,
        address: ["Admin Office"],
        passwordHash: passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("✅ SuperAdmin User created:", superAdminUser.userId);

    await prisma.admin.upsert({
      where: { userId: superAdminUser.userId },
      update: { userId: superAdminUser.userId },
      create: {
        userId: superAdminUser.userId,
      },
    });

    console.log("✅ SuperAdmin Admin record created\n");

    // Seed a regular Admin
    console.log("📝 Creating Admin...");
    const adminEmail = "admin@example.com";
    const adminPhone = "+8801800000000";
    const adminPassword = "adminPassword123";
    const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const adminUser = await prisma.user.upsert({
      where: { phone: adminPhone },
      update: {
        email: adminEmail,
        name: "Admin User",
        phone: adminPhone,
        address: ["Admin Office"],
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: adminEmail,
        name: "Admin User",
        phone: adminPhone,
        address: ["Admin Office"],
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("✅ Admin User created:", adminUser.userId);

    await prisma.admin.upsert({
      where: { userId: adminUser.userId },
      update: { userId: adminUser.userId },
      create: {
        userId: adminUser.userId,
      },
    });

    console.log("✅ Admin Admin record created\n");

    // Seed a Customer with a Wallet
    console.log("📝 Creating Customer...");
    const customerEmail = "customer@example.com";
    const customerPhone = "+8801600000000";
    const customerPassword = "customerPassword123";
    const customerPasswordHash = await bcrypt.hash(
      customerPassword,
      SALT_ROUNDS,
    );

    const customerUser = await prisma.user.upsert({
      where: { phone: customerPhone },
      update: {
        email: customerEmail,
        name: "Customer User",
        phone: customerPhone,
        address: ["Customer Address"],
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: customerEmail,
        name: "Customer User",
        phone: customerPhone,
        address: ["Customer Address"],
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });

    console.log("✅ Customer User created:", customerUser.userId);

    const customer = await prisma.customer.upsert({
      where: { userId: customerUser.userId },
      update: { userId: customerUser.userId },
      create: {
        userId: customerUser.userId,
      },
    });

    console.log("✅ Customer record created:", customer.customerId);

    await prisma.wallet.upsert({
      where: { customerId: customer.customerId },
      update: {},
      create: {
        customerId: customer.customerId,
        balance: 0.0,
      },
    });

    console.log("✅ Customer Wallet created\n");

    // Print summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ DATABASE SEEDED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📋 Created Accounts:\n");

    console.log("1️⃣  SUPER ADMIN");
    console.log(`   📧 Email:    ${superAdminEmail}`);
    console.log(`   📱 Phone:    ${superAdminPhone}`);
    console.log(`   🔑 Password: ${superAdminPassword}`);
    console.log(`   👤 Role:     SUPER_ADMIN\n`);

    console.log("2️⃣  ADMIN");
    console.log(`   📧 Email:    ${adminEmail}`);
    console.log(`   📱 Phone:    ${adminPhone}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👤 Role:     ADMIN\n`);

    console.log("3️⃣  CUSTOMER");
    console.log(`   📧 Email:    ${customerEmail}`);
    console.log(`   📱 Phone:    ${customerPhone}`);
    console.log(`   🔑 Password: ${customerPassword}`);
    console.log(`   👤 Role:     CUSTOMER\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error);
    process.exit(1);
  }
}

seed()
  .catch((e) => {
    console.error("❌ Fatal error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Prisma connection closed");
  });
