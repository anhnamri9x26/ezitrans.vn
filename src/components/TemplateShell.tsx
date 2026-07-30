import React from 'react';
import { resolveTemplates, ResolveContext } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import WpAdminBar from './WpAdminBar';
import CraftScriptsInitializer from './CraftScriptsInitializer';

interface TemplateShellProps {
  context: ResolveContext;
  settings: Record<string, string>;
  activeTheme: string;
  children: React.ReactNode;
}

/**
 * Server component wrapper that handles Header and Footer overrides.
 * If custom Header or Footer templates are active, they are rendered at this layout level,
 * and the child page component is instructed to skip rendering its default static header/footer.
 */
export default async function TemplateShell({
  context,
  settings,
  activeTheme,
  children,
}: TemplateShellProps) {
  // 1. Resolve header and footer overrides
  const resolved = await resolveTemplates(context);

  // 2. Load custom Header component if a custom template exists
  const HeaderComponent = resolved.header
    ? await loadTemplateComponent(resolved.header, activeTheme, 'Header')
    : null;

  // 3. Load custom Footer component if a custom template exists
  const FooterComponent = resolved.footer
    ? await loadTemplateComponent(resolved.footer, activeTheme, 'Footer')
    : null;

  // 4. Inject skipHeader and skipFooter flags into the page component props
  const modifiedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        skipHeader: !!resolved.header,
        skipFooter: !!resolved.footer,
      })
    : children;

  return (
    <>
      <CraftScriptsInitializer />
      <WpAdminBar context={context} />
      {HeaderComponent && <HeaderComponent settings={settings} />}
      {modifiedChildren}
      {FooterComponent && <FooterComponent settings={settings} />}
    </>
  );
}
