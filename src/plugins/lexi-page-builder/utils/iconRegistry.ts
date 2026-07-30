import { icons } from 'lucide';
import * as ReactLucideIcons from 'lucide-react';

/**
 * Validates if an icon exists in the unified registry.
 */
export const isValidIcon = (iconName: string): boolean => {
  if (!iconName) return false;
  return Boolean((icons as any)[iconName]);
};

/**
 * Returns the exact SVG string from the Lucide core package, identical to the React component output.
 * Used exclusively by renderer.ts for static HTML compilation.
 * 
 * Zero-fallback policy: Returns empty string if iconName is missing or invalid.
 */
export const getLucideSvgString = (iconName: string, size: number | string = '1em', color: string = 'currentColor', fill: boolean = false): string => {
  if (!iconName) return '';
  
  const iconNode = (icons as any)[iconName];
  if (!iconNode) {
    console.warn(`[IconRegistry] Static Render Warning: Icon "${iconName}" not found. Rendered empty.`);
    return ''; // Zero-fallback policy
  }

  const fillAttr = fill ? color : 'none';
  const sizeStr = typeof size === 'number' ? `${size}px` : size;

  const childrenHtml = iconNode.map(([tag, attrs]: [string, any]) => {
    const attrsHtml = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<${tag} ${attrsHtml} />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizeStr}" height="${sizeStr}" viewBox="0 0 24 24" fill="${fillAttr}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${iconName.toLowerCase()}">${childrenHtml}</svg>`;
};

/**
 * Returns the exact React component from lucide-react.
 * Used exclusively by visual Editor components to ensure parity with renderer.ts.
 * 
 * Zero-fallback policy: Returns null if iconName is missing or invalid.
 */
export const getLucideReactComponent = (iconName: string): React.ElementType | null => {
  if (!iconName) return null;
  
  const Component = (ReactLucideIcons as any)[iconName];
  if (!Component) {
    console.warn(`[IconRegistry] React Render Warning: Icon "${iconName}" not found. Rendered null.`);
    return null; // Zero-fallback policy
  }
  
  return Component;
};
