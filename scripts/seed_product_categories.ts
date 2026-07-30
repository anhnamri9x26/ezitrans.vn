import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Thép Không Gỉ',
    slug: 'thep-khong-gi',
    description: 'Inox 304, 316, 430 dạng tấm, cuộn, ống.',
    type: 'PRODUCT'
  },
  {
    name: 'Thép Hợp Kim',
    slug: 'thep-hop-kim',
    description: 'Sử dụng trong chế tạo cơ khí, chịu mài mòn cao.',
    type: 'PRODUCT'
  },
  {
    name: 'Thép Làm Khuôn',
    slug: 'thep-lam-khuon',
    description: 'Khuôn dập nóng, dập nguội, khuôn nhựa.',
    type: 'PRODUCT'
  },
  {
    name: 'Thép Rèn',
    slug: 'thep-ren',
    description: 'Đảm bảo độ cứng, chịu lực cực tốt.',
    type: 'PRODUCT'
  }
];

async function seedCategories() {
  try {
    for (const cat of categories) {
      const existing = await prisma.category.findUnique({
        where: { slug: cat.slug }
      });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            type: cat.type as any
          }
        });
        console.log(`Created category: ${cat.name}`);
      } else {
        await prisma.category.update({
          where: { slug: cat.slug },
          data: {
            name: cat.name,
            description: cat.description,
            type: cat.type as any
          }
        });
        console.log(`Updated category: ${cat.name}`);
      }
    }
    console.log('Product categories seeded successfully.');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
