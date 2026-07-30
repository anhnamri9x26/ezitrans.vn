import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveHtmlDynamicPlaceholders } from '@/components/craft/utils/dynamicResolver';
import WpAdminBar from '@/components/WpAdminBar';
import CraftScriptsInitializer from '@/components/CraftScriptsInitializer';

// Prevent Next.js from caching this page — always fetch fresh data from DB
export const dynamic = 'force-dynamic';

interface TemplatePreviewPageProps {
  params: Promise<{ id: string }>;
}

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Merriweather',
  'Playfair Display',
  'Nunito',
  'Source Sans 3',
  'Noto Sans',
  'Be Vietnam Pro',
  'Roboto Slab',
  'Raleway',
];

const googleFontsHref = (() => {
  const families = GOOGLE_FONTS.map(
    (font) => `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800`
  ).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
})();

export default async function TemplatePreviewPage({ params }: TemplatePreviewPageProps) {
  const { id } = await params;
  const templateId = Number(id);

  if (!Number.isFinite(templateId)) {
    notFound();
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    notFound();
  }

  const isThemePart = template.type === 'HEADER' || template.type === 'FOOTER';

  const [activeHeader, activeFooter] = isThemePart
    ? [null, null]
    : await Promise.all([
        prisma.template.findFirst({
          where: { type: 'HEADER', status: 'ACTIVE' },
          orderBy: [{ priority: 'asc' }, { id: 'asc' }],
        }),
        prisma.template.findFirst({
          where: { type: 'FOOTER', status: 'ACTIVE' },
          orderBy: [{ priority: 'asc' }, { id: 'asc' }],
        }),
      ]);

  const html = resolveHtmlDynamicPlaceholders(template.htmlContent || '<main style="padding:48px;font-family:Inter,Arial,sans-serif;color:#334155"><h1>Template chưa có nội dung</h1><p>Hãy quay lại builder để thiết kế template này.</p></main>');
  const headerHtml = activeHeader ? resolveHtmlDynamicPlaceholders(activeHeader.htmlContent || '') : '';
  const footerHtml = activeFooter ? resolveHtmlDynamicPlaceholders(activeFooter.htmlContent || '') : '';
  const combinedCss = [activeHeader?.cssContent, template.cssContent, activeFooter?.cssContent]
    .filter(Boolean)
    .join('\n');

  const pagePreviewStyle = isThemePart
    ? undefined
    : { width: '100%' };

  return (
    <main className="min-h-screen bg-white overflow-x-hidden" suppressHydrationWarning>
      <CraftScriptsInitializer />
      <div className="sr-only">Xem trước template: {template.name}</div>
      <WpAdminBar isPreview={true} previewTemplateId={template.id} />

      {/* Google Fonts — same set as editor */}
      <link rel="stylesheet" href={googleFontsHref} />
      {combinedCss && <style dangerouslySetInnerHTML={{ __html: combinedCss }} />}
      {headerHtml && <div data-template-part="header" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: headerHtml }} />}
      <div
        data-template-part="content"
        style={pagePreviewStyle}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {footerHtml && <div data-template-part="footer" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: footerHtml }} />}
    </main>
  );
}
