import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';

interface CategoryArchiveProps {
  slug: string;
  type: 'POST' | 'PRODUCT';
  settings: Record<string, string>;
  activeTheme: string;
  currentPage?: number;
}

export default async function CategoryArchive({ slug, type, settings, activeTheme, currentPage = 1 }: CategoryArchiveProps) {
  let category: any = null;
  let posts: any[] = [];

  const perPage = type === 'PRODUCT' ? 12 : 12;
  const safeCurrentPage = Math.max(1, currentPage);
  const skip = (safeCurrentPage - 1) * perPage;
  const basePostWhere = {
    status: 'PUBLISHED' as const,
    type,
    publishedAt: { lte: new Date() }
  };

  if (slug === 'all') {
    // Special case for root archive (e.g., /san-pham or /tin-tuc)
    category = {
      id: 0,
      slug: 'all',
      name: type === 'PRODUCT' ? 'Tất cả sản phẩm' : 'Tất cả bài viết',
      description: '',
      type
    };

    const [totalItems, paginatedPosts] = await Promise.all([
      prisma.post.count({ where: basePostWhere }),
      prisma.post.findMany({
        where: basePostWhere,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: perPage,
        include: {
          author: true,
          categories: true,
          featuredImage: true
        }
      })
    ]);

    posts = paginatedPosts;
    category.posts = posts;
    category.totalItems = totalItems;
  } else {
    category = await prisma.category.findUnique({
      where: { slug }
    });

    if (category) {
      const where = {
        ...basePostWhere,
        categories: {
          some: { id: category.id }
        }
      };

      const [totalItems, paginatedPosts] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: perPage,
          include: {
            author: true,
            categories: true,
            featuredImage: true
          }
        })
      ]);

      posts = paginatedPosts;
      category.posts = posts;
      category.totalItems = totalItems;
    }
  }

  if (!category) notFound();

  posts = category.posts || [];
  const totalItems = category.totalItems || posts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (safeCurrentPage > totalPages) notFound();
  const pagination = {
    currentPage: safeCurrentPage,
    perPage,
    totalItems,
    totalPages,
    startItem: totalItems === 0 ? 0 : skip + 1,
    endItem: Math.min(skip + posts.length, totalItems)
  };
  
  const fs = require('fs');
  const path = require('path');
  
  const hasProducts = type === 'PRODUCT';

  const themeDir = path.join(process.cwd(), 'src', 'themes', activeTheme);
  const hasProductCategoryTemplate = fs.existsSync(path.join(themeDir, 'ProductCategoryPage.tsx'));

  let templateName = 'CategoryPage';
  if (hasProducts && hasProductCategoryTemplate) {
    templateName = 'ProductCategoryPage';
  }

  // Tải động (Dynamic Import) template tương ứng của Theme đang kích hoạt
  let defaultTemplate;
  if (activeTheme === 'ezitrans' && templateName === 'CategoryPage') {
    defaultTemplate = (await import('@/themes/ezitrans/CategoryPage')).default;
  } else {
    try {
      const module = await import(`@/themes/${activeTheme}/${templateName}`);
      defaultTemplate = module.default;
    } catch(e) {
      const module = await import(`@/themes/default/${templateName}`);
      defaultTemplate = module.default;
    }
  }
  let CategoryPageTemplate = defaultTemplate;

  // --- Template System Override Layer ---
  const resolveContext = {
    pageType: 'ARCHIVE' as const,
    categoryIds: [category.id],
  };

  const resolvedTemplates = await resolveTemplates(resolveContext);
  if (resolvedTemplates.body) {
    CategoryPageTemplate = await loadTemplateComponent(
      resolvedTemplates.body,
      activeTheme,
      templateName
    );
  }

  return (
    <TemplateShell
      context={resolveContext}
      settings={settings}
      activeTheme={activeTheme}
    >
      <CategoryPageTemplate 
        category={category} 
        posts={posts} 
        settings={settings}
        pagination={pagination}
      />
    </TemplateShell>
  );
}

