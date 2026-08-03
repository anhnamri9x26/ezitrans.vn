import React from 'react';
import { Template } from '@prisma/client';
import { resolveHtmlDynamicPlaceholders } from '../components/craft/utils/dynamicResolver';
import PublicCommentsSection from '@/components/PublicCommentsSection';
import DynamicPostGrid from '@/components/DynamicPostGrid';
import ManagedMenuView from '@/components/navigation/ManagedMenuView';

interface BuilderTemplateProps {
  post?: any;
  posts?: any[];
  category?: any;
  tag?: any;
  settings?: Record<string, string>;
  [key: string]: any;
}

/**
 * Creates a React component to render HTML/CSS template builder content,
 * replacing basic dynamic placeholders with data passed in props.
 */
export function createBuilderComponent(htmlContent: string, cssContent?: string | null): React.ComponentType<BuilderTemplateProps> {
  const BuilderComponent = (props: BuilderTemplateProps) => {
    let dynamicHtml = htmlContent;

    // Resolve dynamic JSON placeholders first
    const dynamicContext = {
      post: props.post,
      author: props.post?.author ? {
        name: props.post.author.name || props.post.author.username || '',
        displayName: props.post.author.name || props.post.author.username || '',
        email: props.post.author.email || '',
        bio: props.post.author.bio || '',
        avatar: props.post.author.avatar || '',
        url: `/author/${props.post.author.username || ''}`,
      } : (props.author || null),
      category: (props.post?.categories && props.post.categories.length > 0) ? props.post.categories[0] : (props.category || null),
      tag: (props.post?.tags && props.post.tags.length > 0) ? props.post.tags[0] : (props.tag || null),
      site: {
        title: props.settings?.site_name || props.settings?.site_title || props.site?.title || '',
        logo: props.settings?.site_logo || props.site?.logo || '',
        url: props.settings?.site_url || props.site?.url || '',
        tagline: props.settings?.site_tagline || props.site?.tagline || '',
      },
      user: props.user,
    };
    dynamicHtml = resolveHtmlDynamicPlaceholders(dynamicHtml, dynamicContext);

    // Standard field replacements if a single post/page is provided in props (keep for backward compatibility)
    if (props.post) {
      dynamicHtml = dynamicHtml
        .replace(/\{\{post\.title\}\}/g, props.post.title || '')
        .replace(/\{\{post\.content\}\}/g, props.post.content || '')
        .replace(/\{\{post\.excerpt\}\}/g, props.post.excerpt || '')
        .replace(/\{\{post\.slug\}\}/g, props.post.slug || '');
    }

    // Site settings replacement (e.g. {{settings.site_name}})
    if (props.settings) {
      const settingsRegex = /\{\{settings\.([a-zA-Z0-9_-]+)\}\}/g;
      dynamicHtml = dynamicHtml.replace(settingsRegex, (match, key) => {
        return props.settings?.[key] || '';
      });
    }

    // Split HTML by dynamic post grids and managed menu references.
    const componentRegex = /\{\{(post_grid|post_grid_config|managed_menu):([^}]+)\}\}/g;
    if (componentRegex.test(dynamicHtml)) {
      const segments = dynamicHtml.split(componentRegex);
      const elements: React.ReactNode[] = [];

      for (let i = 0; i < segments.length; i += 3) {
        const htmlSegment = segments[i];
        const type = segments[i + 1];
        const content = segments[i + 2];
        const commentParts = htmlSegment.split('{{comments_section}}');
        commentParts.forEach((part, cIndex) => {
          if (part.trim() || cIndex > 0) elements.push(React.createElement('div', { key: `html-${i}-${cIndex}`, dangerouslySetInnerHTML: { __html: part }, suppressHydrationWarning: true }));
          if (cIndex < commentParts.length - 1 && props.post?.type === 'POST' && props.post?.status === 'PUBLISHED') {
            elements.push(React.createElement(PublicCommentsSection, { key: `comments-${i}`, postId: props.post.id }));
          }
        });

        if (type === 'managed_menu' && content) {
          try {
            const config = JSON.parse(decodeURIComponent(content));
            const menus = JSON.parse(props.settings?.navigation_menus || '[]');
            const menu = Array.isArray(menus) ? menus.find((entry: any) => entry.id === Number(config.menuId)) : null;
            elements.push(React.createElement(ManagedMenuView, { key: `managed-menu-${i}`, items: menu?.items || [], config }));
          } catch (error) {
            console.error('[TemplateLoader] Failed to resolve managed menu:', error);
          }
        } else if (type && content) {
          let args: any = {};
          if (type === 'post_grid_config') {
            try {
              const jsonString = Buffer.from(content, 'base64').toString('utf-8');
              args = JSON.parse(jsonString);
            } catch (e) {
              console.error('[TemplateLoader] Failed to parse post_grid_config base64:', e);
            }
          } else {
            args = content.split(':').reduce((acc: Record<string, string>, curr) => {
              const [k, v] = curr.split('=');
              if (k && v !== undefined) acc[k] = v;
              return acc;
            }, {});
          }
          elements.push(React.createElement(DynamicPostGrid as any, { key: `postgrid-${i}`, ...args }));
        }
      }

      return React.createElement(
        'div',
        { className: 'template-builder-content w-full' },
        cssContent ? React.createElement('style', { dangerouslySetInnerHTML: { __html: cssContent } }) : null,
        ...elements
      );
    }

    // Split HTML by comments section placeholder (fallback if no post grid)
    const parts = dynamicHtml.split('{{comments_section}}');

    if (parts.length > 1) {
      return React.createElement(
        'div',
        { className: 'template-builder-content w-full' },
        cssContent ? React.createElement('style', { dangerouslySetInnerHTML: { __html: cssContent } }) : null,
        React.createElement('div', { 
          dangerouslySetInnerHTML: { __html: parts[0] },
          suppressHydrationWarning: true
        }),
        props.post?.type === 'POST' && props.post?.status === 'PUBLISHED' ? React.createElement(PublicCommentsSection, { postId: props.post.id }) : null,
        React.createElement('div', { 
          dangerouslySetInnerHTML: { __html: parts[1] },
          suppressHydrationWarning: true
        })
      );
    }

    return React.createElement(
      'div',
      { className: 'template-builder-content w-full' },
      cssContent ? React.createElement('style', { dangerouslySetInnerHTML: { __html: cssContent } }) : null,
      React.createElement('div', { 
        dangerouslySetInnerHTML: { __html: dynamicHtml },
        suppressHydrationWarning: true
      })
    );
  };

  BuilderComponent.displayName = 'BuilderTemplate';
  return BuilderComponent;
}

/**
 * Loads the default theme component dynamically
 */
async function loadDefaultThemeComponent(activeTheme: string, componentName: string): Promise<React.ComponentType<any>> {
  try {
    const module = await import(`@/themes/${activeTheme}/${componentName}.tsx`);
    return module.default || module;
  } catch (error) {
    if (activeTheme !== 'default') {
      try {
        console.warn(`[TemplateLoader] Component "${componentName}" not found in "${activeTheme}". Falling back to "default" theme.`);
        const defaultModule = await import(`@/themes/default/${componentName}.tsx`);
        return defaultModule.default || defaultModule;
      } catch (fallbackError) {
        console.error(`[TemplateLoader] Fallback to default theme component "${componentName}" failed.`, fallbackError);
      }
    } else {
      console.error(`[TemplateLoader] Failed to load default theme component "${componentName}" from theme "${activeTheme}".`, error);
    }

    const FallbackComponent = () =>
      React.createElement(
        'div',
        { className: 'p-8 text-center border-2 border-dashed border-slate-300 rounded-lg text-slate-500 m-4' },
        `Theme component "${componentName}" not found in active theme "${activeTheme}" or fallback "default".`
      );
    FallbackComponent.displayName = `MissingComponent_${componentName}`;
    return FallbackComponent;
  }
}

/**
 * Main Template Loader function that handles the hybrid (TSX/HTML) rendering.
 * Falls back to default component if resolving to null or if custom file import fails.
 */
export async function loadTemplateComponent(
  template: Template | null,
  activeTheme: string,
  defaultComponentName: string
): Promise<React.ComponentType<any>> {
  // 1. Fallback to default theme component if no custom template was resolved
  if (!template) {
    return await loadDefaultThemeComponent(activeTheme, defaultComponentName);
  }

  // 2. Load file-based template (componentFile)
  if (template.componentFile) {
    try {
      // Remove any file extensions like .tsx, .ts, .js, .jsx
      const cleanFileName = template.componentFile.replace(/\.(tsx|ts|js|jsx)$/, '');
      const module = await import(`@/themes/${activeTheme}/${cleanFileName}.tsx`);
      return module.default || module;
    } catch (error) {
      console.warn(
        `Failed to dynamically import custom template file "${template.componentFile}" from theme "${activeTheme}". Falling back to default "${defaultComponentName}".`,
        error
      );
      return await loadDefaultThemeComponent(activeTheme, defaultComponentName);
    }
  }

  // 3. Load builder-based template (htmlContent)
  if (template.htmlContent) {
    return createBuilderComponent(template.htmlContent, template.cssContent);
  }

  // 4. Default fallback if template object matches but has neither componentFile nor htmlContent
  return await loadDefaultThemeComponent(activeTheme, defaultComponentName);
}
