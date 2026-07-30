import { prisma } from '@/lib/prisma';
import { 
  Template, 
  TemplateCondition, 
  TemplateType, 
  ConditionType, 
  TargetType 
} from '@prisma/client';

export interface ResolveContext {
  pageType: 'HOMEPAGE' | 'SINGLE_POST' | 'SINGLE_PAGE' | 'SINGLE_PRODUCT' | 'ARCHIVE' | 'TAG_ARCHIVE' | 'SEARCH' | 'FOUR_O_FOUR' | 'LANDING_PAGE';
  postId?: number;
  postType?: string;       // POST, PAGE, SERVICE, PRODUCT
  categoryIds?: number[];
  tagIds?: number[];
  authorId?: number;
}

export interface ResolvedTemplates {
  header: Template | null;
  footer: Template | null;
  body: Template | null;
}

type TemplateWithConditions = Template & {
  conditions: TemplateCondition[];
};

// Map Condition target types to specificity scores
const SPECIFICITY_SCORES: Record<TargetType, number> = {
  SPECIFIC_POST: 100,
  SPECIFIC_PAGE: 100,
  SPECIFIC_PRODUCT: 100,
  CATEGORY: 50,
  TAG: 50,
  AUTHOR: 50,
  CATEGORY_ARCHIVE: 45,
  TAG_ARCHIVE: 45,
  AUTHOR_ARCHIVE: 40,
  SEARCH_PAGE: 30,
  FOUR_O_FOUR_PAGE: 30,
  POST_TYPE: 30,
  ALL_POSTS: 20,
  ALL_PAGES: 20,
  ALL_PRODUCTS: 20,
  ENTIRE_SITE: 10,
};

/**
 * Checks if a specific template condition matches the current context
 */
function matchesCondition(cond: TemplateCondition, context: ResolveContext): boolean {
  switch (cond.targetType) {
    case 'ENTIRE_SITE':
      return true;

    case 'ALL_POSTS':
      return context.pageType === 'SINGLE_POST' || context.postType === 'POST';

    case 'ALL_PAGES':
      return context.pageType === 'SINGLE_PAGE' || context.postType === 'PAGE';

    case 'SPECIFIC_POST':
      return (context.pageType === 'SINGLE_POST' || context.postType === 'POST') &&
             context.postId !== undefined &&
             cond.targetId === context.postId;

    case 'SPECIFIC_PAGE':
      return (context.pageType === 'SINGLE_PAGE' || context.postType === 'PAGE') &&
             context.postId !== undefined &&
             cond.targetId === context.postId;

    case 'CATEGORY':
      // Matches single posts in category
      return (context.pageType === 'SINGLE_POST' || context.postType === 'POST') &&
             context.categoryIds !== undefined &&
             context.categoryIds.includes(cond.targetId!);

    case 'TAG':
      // Matches single posts in tag
      return (context.pageType === 'SINGLE_POST' || context.postType === 'POST') &&
             context.tagIds !== undefined &&
             context.tagIds.includes(cond.targetId!);

    case 'AUTHOR':
      // Matches single posts by author
      return (context.pageType === 'SINGLE_POST' || context.postType === 'POST') &&
             context.authorId !== undefined &&
             cond.targetId === context.authorId;

    case 'CATEGORY_ARCHIVE':
      // Matches category archive page itself (if cond.targetId is null, matches all category archives)
      return context.pageType === 'ARCHIVE' &&
             context.categoryIds !== undefined &&
             (cond.targetId === null || context.categoryIds.includes(cond.targetId!));

    case 'TAG_ARCHIVE':
      // Matches tag archive page itself (if cond.targetId is null, matches all tag archives)
      return context.pageType === 'TAG_ARCHIVE' &&
             context.tagIds !== undefined &&
             (cond.targetId === null || context.tagIds.includes(cond.targetId!));

    case 'AUTHOR_ARCHIVE':
      // Matches author archive page itself (if cond.targetId is null, matches all author archives)
      return (context.pageType === 'ARCHIVE' || (context as any).pageType === 'AUTHOR_ARCHIVE') &&
             context.authorId !== undefined &&
             (cond.targetId === null || cond.targetId === context.authorId);

    case 'SEARCH_PAGE':
      return context.pageType === 'SEARCH';

    case 'FOUR_O_FOUR_PAGE':
      return context.pageType === 'FOUR_O_FOUR';

    case 'POST_TYPE':
      return context.postType !== undefined && cond.targetSlug === context.postType;

    case 'ALL_PRODUCTS':
      return context.pageType === 'SINGLE_PRODUCT' || context.postType === 'PRODUCT';

    case 'SPECIFIC_PRODUCT':
      return context.postType === 'PRODUCT' &&
             context.postId !== undefined &&
             cond.targetId === context.postId;

    default:
      return false;
  }
}

/**
 * Resolves a single template type based on the loaded list of active templates and conditions
 */
export function resolveSingleTemplateType(
  type: TemplateType,
  context: ResolveContext,
  templates: TemplateWithConditions[]
): Template | null {
  // 1. Filter templates by type
  const typeTemplates = templates.filter(t => t.type === type);
  if (typeTemplates.length === 0) return null;

  const candidates: Array<{ template: TemplateWithConditions; specificity: number }> = [];

  for (const template of typeTemplates) {
    const includes = template.conditions.filter(c => c.conditionType === 'INCLUDE');
    const excludes = template.conditions.filter(c => c.conditionType === 'EXCLUDE');

    // Check for any matching EXCLUDE condition. If matched, template is rejected immediately.
    const isExcluded = excludes.some(cond => matchesCondition(cond, context));
    if (isExcluded) continue;

    // Check matching INCLUDES
    const matchingIncludes = includes.filter(cond => matchesCondition(cond, context));

    if (matchingIncludes.length > 0) {
      // Find highest specificity among matching includes
      const maxSpecificity = Math.max(...matchingIncludes.map(c => SPECIFICITY_SCORES[c.targetType] || 0));
      candidates.push({ template, specificity: maxSpecificity });
    }
  }

  if (candidates.length === 0) return null;

  // Sort candidates by:
  // 1. Specificity (highest first)
  // 2. ID (highest first / created later - newest overrides oldest)
  candidates.sort((a, b) => {
    if (b.specificity !== a.specificity) {
      return b.specificity - a.specificity;
    }
    return b.template.id - a.template.id;
  });

  return candidates[0].template;
}

/**
 * Maps page type from context to database TemplateType enum
 */
function getTemplateTypeFromPageType(pageType: ResolveContext['pageType']): TemplateType | null {
  switch (pageType) {
    case 'HOMEPAGE':
      return TemplateType.HOMEPAGE;
    case 'SINGLE_POST':
      return TemplateType.SINGLE_POST;
    case 'SINGLE_PAGE':
      return TemplateType.SINGLE_PAGE;
    case 'ARCHIVE':
      return TemplateType.ARCHIVE;
    case 'TAG_ARCHIVE':
      return TemplateType.TAG_ARCHIVE;
    case 'SEARCH':
      return TemplateType.SEARCH;
    case 'FOUR_O_FOUR':
      return TemplateType.FOUR_O_FOUR;
    case 'LANDING_PAGE':
      return TemplateType.LANDING_PAGE;
    default:
      return null;
  }
}

/**
 * Resolves header, footer, and body templates for the given context
 */
export async function resolveTemplates(context: ResolveContext): Promise<ResolvedTemplates> {
  try {
    // Load all ACTIVE templates with their conditions
    const activeTemplates = await prisma.template.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        conditions: true,
      },
    });

    // Resolve header
    const header = resolveSingleTemplateType(TemplateType.HEADER, context, activeTemplates);

    // Resolve footer
    const footer = resolveSingleTemplateType(TemplateType.FOOTER, context, activeTemplates);

    // Resolve body (specific type depending on pageType)
    let body: Template | null = null;
    const bodyType = getTemplateTypeFromPageType(context.pageType);
    if (bodyType) {
      body = resolveSingleTemplateType(bodyType, context, activeTemplates);
    }

    return { header, footer, body };
  } catch (error) {
    console.error('Error resolving templates:', error);
    return { header: null, footer: null, body: null };
  }
}
