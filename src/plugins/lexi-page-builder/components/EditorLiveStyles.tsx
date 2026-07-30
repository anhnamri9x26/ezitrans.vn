import React, { useEffect, useRef } from 'react';
import { useEditor } from '@craftjs/core';
import { generateDeviceStyles } from '../utils/renderer';

/**
 * EditorLiveStyles: injects <style> rules into the document so that
 * responsive overrides (tablet / mobile) are reflected in the editor canvas
 * immediately when the user switches device or edits a responsive property.
 *
 * Strategy:
 *  - We subscribe to Craft editor state via `useEditor`.
 *  - We debounce CSS regeneration to avoid perf issues.
 *  - We stamp `data-node-id` attributes onto each node's DOM element
 *    so CSS selectors can target them.
 *  - We generate CSS rules scoped by `body[data-device="..."]`.
 */
export function EditorLiveStyles() {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const rafRef = useRef<number>(0);

  // Use the collector form that returns a stable reference
  const { nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }));

  useEffect(() => {
    // Cancel any pending frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      if (!nodes) return;

      // 1. Stamp data-node-id on each node's DOM element
      const nodeEntries = Object.values(nodes);
      for (const node of nodeEntries) {
        const dom = node.dom as HTMLElement | null | undefined;
        if (dom && node.id && !dom.getAttribute('data-node-id')) {
          dom.setAttribute('data-node-id', node.id);
        }
      }

      // 2. Generate responsive CSS rules
      let rules = '';
      for (const node of nodeEntries) {
        const props = node.data?.props;
        if (!props) continue;

        const resolvedName =
          (node.data.type as any)?.resolvedName || node.data.name;

        const hasResponsiveOverrides = Object.keys(props).some(
          (k) =>
            k.endsWith('_tablet') ||
            k.endsWith('_mobile') ||
            k.endsWith('Tablet') ||
            k.endsWith('Mobile')
        );

        if (!hasResponsiveOverrides) continue;

        try {
          const tabletStyles = generateDeviceStyles(
            node.id,
            props,
            resolvedName,
            'tablet',
            { includeTypography: false }
          );
          const mobileStyles = generateDeviceStyles(
            node.id,
            props,
            resolvedName,
            'mobile',
            { includeTypography: false }
          );

          if (tabletStyles) {
            rules +=
              tabletStyles.replace(
                /\[data-node-id=/g,
                'body[data-device="tablet"] [data-node-id='
              ) + '\n';
          }
          if (mobileStyles) {
            rules +=
              mobileStyles.replace(
                /\[data-node-id=/g,
                'body[data-device="mobile"] [data-node-id='
              ) + '\n';
          }
        } catch {
          // silently skip nodes that fail
        }
      }

      // 3. Inject into a persistent <style> tag
      if (!styleRef.current) {
        styleRef.current = document.createElement('style');
        styleRef.current.id = 'lexi-editor-live-styles';
        document.head.appendChild(styleRef.current);
      }
      styleRef.current.textContent = rules;
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes]);

  // Don't render anything — we inject via document.head directly
  return null;
}
