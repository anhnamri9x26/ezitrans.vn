import { prisma } from '../src/lib/prisma';
async function run() {
  const cats = await prisma.category.findMany();
  console.log('--- ALL CATEGORIES ---');
  console.log(JSON.stringify(cats, null, 2));
}
run();
