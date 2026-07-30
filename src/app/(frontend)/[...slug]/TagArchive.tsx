import React from 'react';
import NotFoundContent from './NotFoundContent';
import { prisma } from '@/lib/prisma';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';

interface TagArchiveProps {
  slug: string;
  settings: Record<string, string>;
  activeTheme: string;
}

export default async function TagArchive({ slug, settings, activeTheme }: TagArchiveProps) {
  // Retrieve tag and all associated published posts
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: {
          status: 'PUBLISHED',
          type: 'POST',
          publishedAt: {
            lte: new Date()
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        include: {
          author: true,
          categories: true,
          featuredImage: true
        }
      }
    }
  });

  if (!tag) {
    return <NotFoundContent />;
  }

  const posts = tag.posts || [];
  
  let templateName = 'TagPage';

  let defaultTemplate;
  if (activeTheme === 'ezitrans') {
    defaultTemplate = (await import('@/themes/ezitrans/TagPage')).default;
  } else {
    try {
      const module = await import(`@/themes/${activeTheme}/${templateName}`);
      defaultTemplate = module.default;
    } catch(e) {
      const module = await import(`@/themes/default/${templateName}`);
      defaultTemplate = module.default;
    }
  }
  let TagPageTemplate = defaultTemplate;

  // --- Template System Override Layer ---
  const resolveContext = {
    pageType: 'ARCHIVE' as const,
    tagIds: [tag.id],
  };

  const resolvedTemplates = await resolveTemplates(resolveContext);
  if (resolvedTemplates.body) {
    TagPageTemplate = await loadTemplateComponent(
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
      <TagPageTemplate 
        tag={tag} 
        posts={posts} 
        settings={settings} 
      />
    </TemplateShell>
  );
}

