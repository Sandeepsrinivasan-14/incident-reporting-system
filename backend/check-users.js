const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking users...");
    const users = await prisma.user.findMany();
    console.log("Current users:", users);
    
    console.log("\nUpdating resolver password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    
    const updated = await prisma.user.update({
      where: { email: "resolver@test.com" },
      data: { password: hashedPassword }
    });
    
    console.log("Resolver password updated successfully");
    console.log("Updated user:", updated);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
