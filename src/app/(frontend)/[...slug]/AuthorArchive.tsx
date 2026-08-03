import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';
import type { Prisma } from '@prisma/client';
import type { ElementType } from 'react';

interface AuthorArchiveProps {
  username: string;
  settings: Record<string, string>;
  activeTheme: string;
  currentPage?: number;
}

export default async function AuthorArchive({ username, settings, activeTheme, currentPage = 1 }: AuthorArchiveProps) {
  const author = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, createdAt: true }
  });
  if (!author) notFound();

  const perPage = 12;
  const safeCurrentPage = Math.max(1, currentPage);
  const skip = (safeCurrentPage - 1) * perPage;
  const where: Prisma.PostWhereInput = {
    authorId: author.id,
    status: 'PUBLISHED',
    type: { in: ['POST', 'SERVICE'] },
    publishedAt: { lte: new Date() }
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
  if (safeCurrentPage > totalPages) notFound();
  const pagination = {
    currentPage: safeCurrentPage, perPage, totalItems, totalPages,
    startItem: totalItems === 0 ? 0 : skip + 1,
    endItem: Math.min(skip + posts.length, totalItems)
  };

  const templateName = 'AuthorPage';
  const DefaultTemplate = activeTheme === 'ezitrans'
    ? (await import('@/themes/ezitrans/AuthorPage')).default
    : (await import('@/themes/default/AuthorPage')).default;
  const context = { pageType: 'ARCHIVE' as const, authorId: author.id };
  const resolved = await resolveTemplates(context);
  const AuthorTemplate: ElementType = resolved.body
    ? await loadTemplateComponent(resolved.body, activeTheme, templateName)
    : DefaultTemplate;

  return (
    <TemplateShell context={context} settings={settings} activeTheme={activeTheme}>
      <AuthorTemplate author={author} posts={posts} settings={settings} pagination={pagination} />
    </TemplateShell>
  );
}
