const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const reporter = await prisma.user.upsert({
    where: { email: "reporter@test.com" },
    update: {},
    create: {
      email: "reporter@test.com",
      password: await bcrypt.hash("password", 10),
      role: "REPORTER",
    },
  });

  const resolver = await prisma.user.upsert({
    where: { email: "resolver@test.com" },
    update: {},
    create: {
      email: "resolver@test.com",
      password: await bcrypt.hash("password", 10),
      role: "RESOLVER",
    },
  });

  await prisma.incident.create({
    data: {
      title: "Server Down",
      description: "Database server is not responding",
      priority: "CRITICAL",
      status: "OPEN",
      reporterId: reporter.id,
    },
  });

  console.log("Seed data created");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
