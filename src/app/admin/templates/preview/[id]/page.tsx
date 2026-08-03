import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WpAdminBar from '@/components/WpAdminBar';
import { createBuilderComponent } from '@/lib/templateLoader';
import { loadHydratedSettings } from '@/lib/navigation/settings';

interface TemplatePreviewPageProps {
  params: Promise<{ id: string }>;
}

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

  const settings = await loadHydratedSettings();

  const html = template.htmlContent || '<main style="padding:48px;font-family:Inter,Arial,sans-serif;color:#334155"><h1>Template chưa có nội dung</h1><p>Hãy quay lại builder để thiết kế template này.</p></main>';
  const TemplateComponent = createBuilderComponent(html, template.cssContent);

  return (
    <main className="min-h-screen bg-white" suppressHydrationWarning>
      <WpAdminBar isPreview={true} previewTemplateId={template.id} />
      <TemplateComponent settings={settings} />
    </main>
  );
}
