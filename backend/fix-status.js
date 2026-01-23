const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.incident.updateMany({
    data: { status: "open" },
    where: { status: "OPEN" },
  });

  console.log(`Fixed ${updated.count} incidents with uppercase status`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
