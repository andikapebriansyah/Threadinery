const { prisma } = require("./src/lib/prisma");

async function check() {
  const projects = await prisma.project.findMany({
    include: {
      entities: { include: { type: true } },
      entityTypes: true,
      _count: { select: { entities: true } }
    }
  });

  console.log("PROJECTS IN DB:", JSON.stringify(projects, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
