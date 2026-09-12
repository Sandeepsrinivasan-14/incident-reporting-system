const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const accounts = [
    { email: "reporter@test.com", password: "password", role: "REPORTER" },
    { email: "resolver@test.com", password: "password", role: "RESOLVER" },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 12);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: { email: acc.email, password: hash, role: acc.role },
    });
    console.log(`Seeded: ${acc.email} (${acc.role})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
