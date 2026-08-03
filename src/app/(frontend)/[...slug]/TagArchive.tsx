import React from 'react';
import NotFoundContent from './NotFoundContent';
import { prisma } from '@/lib/prisma';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';
import type { ElementType } from 'react';

interface TagArchiveProps {
  slug: string;
  settings: Record<string, string>;
  activeTheme: string;
  currentPage?: number;
}

export default async function TagArchive({ slug, settings, activeTheme, currentPage = 1 }: TagArchiveProps) {
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return <NotFoundContent settings={settings} />;

  const perPage = 12;
  const safeCurrentPage = Math.max(1, currentPage);
  const skip = (safeCurrentPage - 1) * perPage;
  const where = {
    status: 'PUBLISHED' as const,
    type: 'POST' as const,
    publishedAt: { lte: new Date() },
    tags: { some: { id: tag.id } }
  };
  const [totalItems, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: perPage,
      include: { author: true, categories: true, featuredImage: true }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  if (safeCurrentPage > totalPages) return <NotFoundContent settings={settings} />;
  const pagination = {
    currentPage: safeCurrentPage,
    perPage,
    totalItems,
    totalPages,
    startItem: totalItems === 0 ? 0 : skip + 1,
    endItem: Math.min(skip + posts.length, totalItems)
  };

  const templateName = 'TagPage';
  const defaultTemplate = activeTheme === 'ezitrans'
    ? (await import('@/themes/ezitrans/TagPage')).default
    : (await import('@/themes/default/TagPage')).default;
  let TagPageTemplate: ElementType = defaultTemplate;
  const resolveContext = { pageType: 'TAG_ARCHIVE' as const, tagIds: [tag.id] };
  const resolvedTemplates = await resolveTemplates(resolveContext);
  if (resolvedTemplates.body) {
    TagPageTemplate = await loadTemplateComponent(resolvedTemplates.body, activeTheme, templateName);
  }

  return (
    <TemplateShell context={resolveContext} settings={settings} activeTheme={activeTheme}>
      <TagPageTemplate tag={tag} posts={posts} settings={settings} pagination={pagination} />
    </TemplateShell>
  );
}

