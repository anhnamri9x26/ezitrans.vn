import { prisma } from '../src/lib/prisma';

async function run() {
  const categories = await prisma.category.findMany();
  console.log(categories);
}
run();
