import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';
import type { Prisma } from '@prisma/client';
import type { ElementType } from 'react';

interface SearchArchiveProps {
  query: string;
  settings: Record<string, string>;
  activeTheme: string;
  currentPage?: number;
}

export default async function SearchArchive({ query, settings, activeTheme, currentPage = 1 }: SearchArchiveProps) {
  const searchQuery = query.trim().replace(/\s+/g, ' ').slice(0, 120);
  const perPage = 12;
  const safeCurrentPage = Math.max(1, currentPage);
  const skip = (safeCurrentPage - 1) * perPage;
  const where: Prisma.PostWhereInput = {
    status: 'PUBLISHED',
    type: { in: ['POST', 'SERVICE'] },
    publishedAt: { lte: new Date() },
    ...(searchQuery ? {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' as const } },
        { excerpt: { contains: searchQuery, mode: 'insensitive' as const } },
        { content: { contains: searchQuery, mode: 'insensitive' as const } },
      ]
    } : {})
  };

  const [totalItems, posts] = searchQuery
    ? await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: perPage,
          include: { author: true, categories: true, featuredImage: true }
        })
      ])
    : [0, []];

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

  const templateName = 'SearchPage';
  const DefaultTemplate = activeTheme === 'ezitrans'
    ? (await import('@/themes/ezitrans/SearchPage')).default
    : (await import('@/themes/default/SearchPage')).default;
  const context = { pageType: 'SEARCH' as const };
  const resolved = await resolveTemplates(context);
  const SearchTemplate: ElementType = resolved.body
    ? await loadTemplateComponent(resolved.body, activeTheme, templateName)
    : DefaultTemplate;

  return (
    <TemplateShell context={context} settings={settings} activeTheme={activeTheme}>
      <SearchTemplate query={searchQuery} posts={posts} settings={settings} pagination={pagination} />
    </TemplateShell>
  );
}
