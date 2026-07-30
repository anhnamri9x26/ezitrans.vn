const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.post.findMany({
    where: { type: 'PRODUCT' },
    select: { slug: true }
  });
  console.log("Products:", products);
}

main().catch(console.error).finally(() => prisma.$disconnect());
