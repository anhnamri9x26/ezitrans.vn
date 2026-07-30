export interface WebsiteSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    smallFont: string;
    buttonFont: string;
  };
  buttons: {
    primaryBg: string;
    primaryHoverBg: string;
    primaryColor: string;
    primaryRadius: string;
    primaryPaddingY: string;
    primaryPaddingX: string;
    secondaryBg: string;
    secondaryHoverBg: string;
    secondaryColor: string;
    secondaryRadius: string;
    secondaryPaddingY: string;
    secondaryPaddingX: string;
  };
  layout: {
    contentWidth: string;
    containerGap: string;
    sectionSpacing: string;
  };
}

export const defaultWebsiteSettings: WebsiteSettings = {
  colors: {
    primary: '#2563eb', // blue-600
    secondary: '#475569', // slate-600
    accent: '#3b82f6', // blue-500
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    background: '#ffffff',
    text: '#0f172a', // slate-900
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Roboto',
    smallFont: 'Nunito',
    buttonFont: 'Poppins',
  },
  buttons: {
    primaryBg: '#2563eb',
    primaryHoverBg: '#1d4ed8',
    primaryColor: '#ffffff',
    primaryRadius: '8px',
    primaryPaddingY: '12px',
    primaryPaddingX: '24px',
    secondaryBg: '#475569',
    secondaryHoverBg: '#334155',
    secondaryColor: '#ffffff',
    secondaryRadius: '8px',
    secondaryPaddingY: '12px',
    secondaryPaddingX: '24px',
  },
  layout: {
    contentWidth: '1200px',
    containerGap: '5px',
    sectionSpacing: '80px',
  },
};

export function generateWebsiteSettingsCss(settings: WebsiteSettings): string {
  const s = {
    colors: { ...defaultWebsiteSettings.colors, ...settings?.colors },
    typography: { ...defaultWebsiteSettings.typography, ...settings?.typography },
    buttons: { ...defaultWebsiteSettings.buttons, ...settings?.buttons },
    layout: { ...defaultWebsiteSettings.layout, ...settings?.layout },
  };

  return `
    :root, .lexi-builder-canvas {
      --site-color-primary: ${s.colors.primary};
      --site-color-secondary: ${s.colors.secondary};
      --site-color-accent: ${s.colors.accent};
      --site-color-success: ${s.colors.success};
      --site-color-warning: ${s.colors.warning};
      --site-color-danger: ${s.colors.danger};
      --site-color-background: ${s.colors.background};
      --site-color-text: ${s.colors.text};

      --site-font-family-heading: "${s.typography.headingFont}", sans-serif;
      --site-font-family-body: "${s.typography.bodyFont}", sans-serif;
      --site-font-family-small: "${s.typography.smallFont}", sans-serif;
      --site-font-family-button: "${s.typography.buttonFont}", sans-serif;

      --site-btn-primary-bg: ${s.buttons.primaryBg};
      --site-btn-primary-hover-bg: ${s.buttons.primaryHoverBg};
      --site-btn-primary-color: ${s.buttons.primaryColor};
      --site-btn-primary-radius: ${s.buttons.primaryRadius};
      --site-btn-primary-padding-y: ${s.buttons.primaryPaddingY};
      --site-btn-primary-padding-x: ${s.buttons.primaryPaddingX};

      --site-btn-secondary-bg: ${s.buttons.secondaryBg};
      --site-btn-secondary-hover-bg: ${s.buttons.secondaryHoverBg};
      --site-btn-secondary-color: ${s.buttons.secondaryColor};
      --site-btn-secondary-radius: ${s.buttons.secondaryRadius};
      --site-btn-secondary-padding-y: ${s.buttons.secondaryPaddingY};
      --site-btn-secondary-padding-x: ${s.buttons.secondaryPaddingX};

      --site-layout-content-width: ${s.layout.contentWidth};
      --site-layout-container-gap: ${s.layout.containerGap};
      --site-layout-section-spacing: ${s.layout.sectionSpacing};
    }

    /* Section defaults */
    .lexi-section {
    }
    .lexi-container {
      gap: var(--site-layout-container-gap);
    }

    /* Base Typography overrides in editor/preview */
    .lexi-builder-canvas h1, 
    .lexi-builder-canvas h2, 
    .lexi-builder-canvas h3, 
    .lexi-builder-canvas h4, 
    .lexi-builder-canvas h5, 
    .lexi-builder-canvas h6 {
      font-family: var(--site-font-family-heading);
    }
    .lexi-builder-canvas p, 
    .lexi-builder-canvas li, 
    .lexi-builder-canvas a:not([class*="btn"]) {
      font-family: var(--site-font-family-body);
    }

    /* Preset Button Hover Styling */
    .btn-preset-primary:hover {
      background-color: var(--site-btn-primary-hover-bg) !important;
    }
    .btn-preset-secondary:hover {
      background-color: var(--site-btn-secondary-hover-bg) !important;
    }
  `;
}
