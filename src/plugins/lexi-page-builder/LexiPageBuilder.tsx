"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { getDOMInfo } from '@craftjs/utils';
import { EditorLiveStyles } from './components/EditorLiveStyles';
import { generatePageCss } from './utils/customCssEngine';
import { Container } from './components/Container';
import { GridContainer } from './components/GridContainer';
import { TextBlock } from './components/TextBlock';
import { HeadingBlock } from './components/HeadingBlock';
import { ImageBlock } from './components/ImageBlock';
import { ButtonBlock } from './components/ButtonBlock';
import { DividerBlock } from './components/DividerBlock';
import { VideoBlock } from './components/VideoBlock';
import { SpacerBlock } from './components/SpacerBlock';
import { IconBlock } from './components/IconBlock';
import { IconListBlock } from './components/IconListBlock';
import { AccordionBlock } from './components/AccordionBlock';
import { HtmlBlock } from './components/HtmlBlock';
import { TabsBlock } from './components/TabsBlock';
import { IconBoxBlock } from './components/IconBoxBlock';
import { ImageBoxBlock } from './components/ImageBoxBlock';
import { CarouselBlock } from './components/CarouselBlock';
import { CounterBlock } from './components/CounterBlock';
import { ProgressBarBlock } from './components/ProgressBarBlock';
import { SocialIconsBlock } from './components/SocialIconsBlock';
import { FormBlock } from './components/FormBlock';
import { MenuBlock } from './components/MenuBlock';
import { PostGridBlock } from './components/PostGridBlock';
import Toolbar from './panels/Toolbar';
import LeftSidebar from './panels/LeftSidebar';
import RightSidebar from './panels/RightSidebar';
import Navigator from './panels/Navigator';
import MediaModal from '@/components/MediaModal';
import IconModal from './components/IconModal';
import { renderCraftToHtml } from './utils/renderer';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { PageSettingsProvider, defaultPageSettings } from './PageSettingsContext';
import type { PageLayoutType, ContentWidthType, PageSettings } from './PageSettingsContext';
import { WebsiteSettings, defaultWebsiteSettings, generateWebsiteSettingsCss } from './utils/websiteSettingsHelper';
import HistoryPanel, { Revision } from './panels/HistoryPanel';
import RecoveryModal from './components/RecoveryModal';
import { ChevronLeft, ChevronRight, Plus, Sliders, Layers, MessageSquare, HelpCircle, X, Pencil, History, Star, Clock, Check, Sparkles, Mail, Phone, Search, Factory } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  memoryNodeTreeClipboard,
  setMemoryNodeTreeClipboard,
  readClipboard,
  writeClipboard,
  cloneNodeTreeWithFreshIds,
  extractStyleProps,
  type CraftNodeTree,
} from './components/FloatingToolbar';

async function safeJson(res: Response) {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Phản hồi không phải JSON hợp lệ (Mã HTTP: ${res.status}). Bắt đầu bằng: ${text.substring(0, 200)}...`);
  }
  return res.json();
}

interface CraftEditorProps {
  initialContent?: string;
  initialData?: string;
  pageTitle: string;
  postId?: number;
  templateId?: number;
  onSave: (compiledHtml: string, projectDataJson: string, pageSettings?: PageSettings, commitMessage?: string, revisionName?: string, isStarred?: boolean) => void | Promise<void>;
  onClose: () => void;
  onAutoSave?: (compiledHtml: string, projectDataJson: string, pageSettings?: PageSettings) => Promise<boolean>;
  onSaveDraft?: (compiledHtml: string, projectDataJson: string, pageSettings?: PageSettings, commitMessage?: string, revisionName?: string, isStarred?: boolean) => void | Promise<void>;
  onPreview?: (compiledHtml: string, projectDataJson: string) => void | Promise<void>;
  initialPageLayout?: PageLayoutType;
  initialContentWidth?: ContentWidthType;
  initialContentMaxWidth?: string;
  templateType?: string;
  backLabel?: string;
}

interface ThemeTemplatePreview {
  id: number;
  name: string;
  htmlContent?: string | null;
  cssContent?: string | null;
}

function TemplatePartFrame({
  type,
  template,
  isLoading,
  returnTo,
  disabled,
}: {
  type: 'header' | 'footer';
  template: ThemeTemplatePreview | null;
  isLoading: boolean;
  returnTo: string;
  disabled?: boolean;
}) {
  const label = type === 'header' ? 'Header' : 'Footer';
  const editLabel = type === 'header' ? 'Chỉnh sửa Header' : 'Chỉnh sửa Footer';

  if (isLoading) {
    return (
      <div className="relative border-y border-slate-200 bg-slate-50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Đang tải {label} template...
      </div>
    );
  }

  if (!template) {
    return null;
  }

  if (!template.htmlContent) {
    return (
      <div className="relative border-y border-amber-200 bg-amber-50/70 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-amber-600">
        {label} active nhưng chưa có nội dung đã lưu
      </div>
    );
  }

  const editUrl = `/admin/templates/builder/${template.id}?returnTo=${encodeURIComponent(returnTo || window.location.pathname)}`;

  return (
    <section
      onClick={() => {
        if (!disabled) {
          window.location.href = editUrl;
        }
      }}
      className={`relative select-none ${
        disabled
          ? ''
          : 'group/template-part border-2 border-transparent bg-white transition-all hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer'
      }`}
      data-template-part={type}
    >
      {!disabled && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = editUrl;
          }}
          className="absolute top-3 left-3 z-[70] hidden group-hover/template-part:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold shadow-md rounded-lg transition-all"
          title={editLabel}
        >
          <Pencil size={10} strokeWidth={2.5} className="mr-0.5" />
          Sửa {label}
        </button>
      )}
      {template.cssContent && <style dangerouslySetInnerHTML={{ __html: template.cssContent }} />}
      <div className="pointer-events-none" dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
    </section>
  );
}

// Map of dynamic theme components for preview in Canvas
const ThemeHeaders: Record<string, React.ComponentType<any>> = {
  ezitrans: dynamic(() => import('@/themes/ezitrans/Header').catch(() => () => null), { ssr: false }),
  default: dynamic(() => import('@/themes/default/Header').catch(() => () => null), { ssr: false }),
};

const ThemeFooters: Record<string, React.ComponentType<any>> = {
  ezitrans: dynamic(() => import('@/themes/ezitrans/Footer').catch(() => () => null), { ssr: false }),
  default: dynamic(() => import('@/themes/default/Footer').catch(() => () => null), { ssr: false }),
};

function ThemeDefaultHeaderPreview({ settings, device }: { settings: Record<string, string>, device: string }) {
  const activeTheme = settings.active_theme || 'ezitrans';
  const HeaderComponent = ThemeHeaders[activeTheme] || ThemeHeaders['default'];
  
  if (!HeaderComponent) return null;
  
  return (
    <div
      className="pointer-events-none w-full bg-white shadow-md font-sans text-slate-800 [&_header]:!static [&_header]:!z-auto"
      style={{ fontSize: '16px', lineHeight: '1.5' }}
    >
      <HeaderComponent settings={settings} previewDevice={device} />
    </div>
  );
}

function ThemeDefaultFooterPreview({ settings }: { settings: Record<string, string> }) {
  const activeTheme = settings.active_theme || 'ezitrans';
  const FooterComponent = ThemeFooters[activeTheme] || ThemeFooters['default'];
  
  if (!FooterComponent) return null;
  
  return (
    <div
      className="pointer-events-none w-full mt-auto font-sans text-slate-800"
      style={{ fontSize: '16px', lineHeight: '1.5' }}
    >
      <FooterComponent settings={settings} />
    </div>
  );
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeCraftData(data: any) {
  if (!data) return data;
  
  // Make a copy of the data
  const sanitized = { ...data };
  
  // Keep track of all IDs in the tree to detect if a child's parent reference needs correction
  const allIds = new Set(Object.keys(sanitized));
  
  Object.keys(sanitized).forEach((nodeId) => {
    const node = sanitized[nodeId];
    if (node && node.data && Array.isArray(node.data.nodes)) {
      const seen = new Set<string>();
      const uniqueNodes: string[] = [];
      
      node.data.nodes.forEach((childId: string) => {
        // If we haven't seen this child ID yet, and it actually exists in the data, keep it!
        if (!seen.has(childId) && allIds.has(childId)) {
          seen.add(childId);
          uniqueNodes.push(childId);
        } else if (seen.has(childId)) {
          console.warn(`Sanitized duplicate child key ${childId} from parent ${nodeId}`);
        } else {
          console.warn(`Sanitized non-existent child key ${childId} from parent ${nodeId}`);
        }
      });
      
      node.data.nodes = uniqueNodes;
    }
    
    // Also sanitize linkedNodes
    if (node && node.data && node.data.linkedNodes) {
      const sanitizedLinkedNodes: Record<string, string> = {};
      Object.keys(node.data.linkedNodes).forEach((key) => {
        const linkedId = node.data.linkedNodes[key];
        if (allIds.has(linkedId)) {
          sanitizedLinkedNodes[key] = linkedId;
        } else {
          console.warn(`Sanitized non-existent linked node ${linkedId} under key ${key} from parent ${nodeId}`);
        }
      });
      node.data.linkedNodes = sanitizedLinkedNodes;
    }
  });
  
  return sanitized;
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
] as const;

const getFontCssName = (font: string) => font.replace(/ /g, '+');

const buildGoogleFontsHref = () => {
  const families = GOOGLE_FONTS.map((font) => `family=${getFontCssName(font)}:wght@300;400;500;600;700;800`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

function getActionDescription(oldJsonStr: string, newJsonStr: string): string {
  try {
    const oldObj = JSON.parse(oldJsonStr);
    const newObj = JSON.parse(newJsonStr);

    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);

    // 1. Check added nodes
    const addedKeys = newKeys.filter((k) => !oldKeys.includes(k));
    if (addedKeys.length > 0) {
      const addedKey = addedKeys.find(k => k !== 'ROOT') || addedKeys[0];
      const componentName = newObj[addedKey]?.displayName || newObj[addedKey]?.type?.resolvedName || "thành phần";
      return `Thêm ${componentName}`;
    }

    // 2. Check deleted nodes
    const deletedKeys = oldKeys.filter((k) => !newKeys.includes(k));
    if (deletedKeys.length > 0) {
      const deletedKey = deletedKeys.find(k => k !== 'ROOT') || deletedKeys[0];
      const componentName = oldObj[deletedKey]?.displayName || oldObj[deletedKey]?.type?.resolvedName || "thành phần";
      return `Xóa ${componentName}`;
    }

    // 3. Check moves
    for (const key of newKeys) {
      const oldNode = oldObj[key];
      const newNode = newObj[key];
      if (!oldNode || !newNode) continue;

      if (oldNode.parent !== newNode.parent) {
        const componentName = newNode.displayName || newNode.type?.resolvedName || "thành phần";
        return `Di chuyển ${componentName}`;
      }

      const oldNodes = oldNode.nodes || [];
      const newNodes = newNode.nodes || [];
      if (oldNodes.length === newNodes.length && JSON.stringify(oldNodes) !== JSON.stringify(newNodes)) {
        const componentName = newNode.displayName || newNode.type?.resolvedName || "thành phần";
        return `Sắp xếp trong ${componentName}`;
      }
    }

    // 4. Check prop changes
    for (const key of newKeys) {
      const oldNode = oldObj[key];
      const newNode = newObj[key];
      if (!oldNode || !newNode) continue;

      if (JSON.stringify(oldNode.props) !== JSON.stringify(newNode.props)) {
        const componentName = newNode.displayName || newNode.type?.resolvedName || "thành phần";
        const oldProps = oldNode.props || {};
        const newProps = newNode.props || {};
        if (oldProps.text !== newProps.text) {
          return `Sửa chữ ${componentName}`;
        }
        return `Sửa định dạng ${componentName}`;
      }
    }

    return "Cập nhật thiết kế";
  } catch {
    return "Cập nhật thiết kế";
  }
}

function EditorInner({
  initialData,
  pageTitle,
  postId,
  templateId,
  onSave,
  onClose,
  onAutoSave,
  onSaveDraft,
  onPreview,
  initialPageLayout,
  initialContentWidth,
  initialContentMaxWidth,
  templateType,
  backLabel,
}: CraftEditorProps) {
  const { actions, query, state, selectedId, store } = useEditor((state) => {
    const [selectedId] = state.events.selected;
    return {
      state,
      selectedId,
    };
  });

  // Page Settings state
  const [pageLayout, setPageLayout] = useState<PageLayoutType>(initialPageLayout || defaultPageSettings.pageLayout);
  const [contentWidth, setContentWidth] = useState<ContentWidthType>(initialContentWidth || defaultPageSettings.contentWidth);
  const [contentMaxWidth, setContentMaxWidth] = useState(initialContentMaxWidth || defaultPageSettings.contentMaxWidth);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(defaultWebsiteSettings);
  const [themeSettings, setThemeSettings] = useState<Record<string, string>>({});
  const [headerTemplate, setHeaderTemplate] = useState<ThemeTemplatePreview | null>(null);
  const [footerTemplate, setFooterTemplate] = useState<ThemeTemplatePreview | null>(null);
  const [isLoadingThemeTemplates, setIsLoadingThemeTemplates] = useState(false);
  const [currentBuilderPath, setCurrentBuilderPath] = useState('');
  const shouldShowThemeTemplates = pageLayout !== 'CANVAS';

  const builderPageScopeId = `builder-${postId || templateId || 'draft'}`;
  const builderGeneratedCss = useMemo(() => {
    const widgets = Object.entries(state.nodes || {})
      .map(([id, node]: [string, any]) => ({ id, customCss: node?.data?.props?.customCss }))
      .filter((widget) => widget.customCss && String(widget.customCss).trim());
    return generatePageCss(widgets, builderPageScopeId);
  }, [state.nodes, builderPageScopeId]);

  useEffect(() => {
    setTimeout(() => {
      setCurrentBuilderPath(`${window.location.pathname}${window.location.search}`);
    }, 0);
  }, []);

  // Load Google Fonts globally on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('lexi-google-fonts');
    if (existing) return;

    const link = document.createElement('link');
    link.id = 'lexi-google-fonts';
    link.rel = 'stylesheet';
    link.href = buildGoogleFontsHref();
    document.head.appendChild(link);
  }, []);

  // Load active theme Header/Footer templates for page layout preview
  useEffect(() => {
    let cancelled = false;

    async function loadThemeTemplates() {
      setIsLoadingThemeTemplates(true);
      try {
        const res = await fetch('/api/templates', { cache: 'no-store' });
        const data = await safeJson(res);

        if (cancelled) return;

        interface ThemeTemplate {
          id?: number;
          type?: string;
          status?: string;
          priority?: number;
        }

        const pickTemplate = (templateType: 'HEADER' | 'FOOTER'): ThemeTemplatePreview | null => {
          if (!data?.success || !Array.isArray(data.templates)) return null;

          return (data.templates as ThemeTemplate[])
            .filter((template) =>
              String(template.type || '').toUpperCase() === templateType &&
              String(template.status || '').toUpperCase() === 'ACTIVE'
            )
            .slice()
            .sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10) || (a.id ?? 0) - (b.id ?? 0))[0] as unknown as ThemeTemplatePreview | null;
        };

        setHeaderTemplate(pickTemplate('HEADER'));
        setFooterTemplate(pickTemplate('FOOTER'));
      } catch (error) {
        console.error('Failed to load theme templates:', error);
        if (!cancelled) {
          setHeaderTemplate(null);
          setFooterTemplate(null);
        }
      } finally {
        if (!cancelled) setIsLoadingThemeTemplates(false);
      }
    }

    loadThemeTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load website settings
  useEffect(() => {
    let cancelled = false;

    async function loadWebsiteSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await safeJson(res);
        if (cancelled) return;
        if (data.success && data.settings) {
          setThemeSettings(data.settings);
        }
        if (data.success && data.settings?.website_settings) {
          const parsed = JSON.parse(data.settings.website_settings);
          setWebsiteSettings(prev => ({
            ...prev,
            ...parsed,
            colors: { ...prev.colors, ...parsed.colors },
            typography: { ...prev.typography, ...parsed.typography },
            buttons: { ...prev.buttons, ...parsed.buttons },
            layout: { ...prev.layout, ...parsed.layout },
          }));
        }
      } catch (err) {
        console.error("Failed to load website settings in CraftEditor:", err);
      }
    }

    loadWebsiteSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Global drag-and-drop UX enhancements
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    if (typeof window === 'undefined' || !store) return;

    // 1. Wrap store actions to intercept insertion when drag is cancelled
    //    AND auto-wrap non-Container elements dropped on ROOT into a new Container
    interface CraftDragWindow extends Window {
      craftDragCancelled?: boolean;
      isDraggingCraft?: boolean;
      isOverCanvas?: boolean;
    }

    const originalAddNodeTree = store.actions.addNodeTree;
    const originalMove = store.actions.move;
    let isAutoWrapping = false;

    // Helper to get nodes from store (CraftJS store shape varies by version)
    const getStoreNodes = (): Record<string, unknown> | null => {
      try {
        const raw = store.getState() as unknown as Record<string, Record<string, unknown>>;
        // Try various CraftJS store shapes
        if (raw?.nodes) return raw.nodes;
        if (raw?.current?.nodes) return raw.current.nodes as unknown as Record<string, unknown>;
        return null;
      } catch { return null; }
    };

    const getResolver = (): Record<string, unknown> | null => {
      try {
        const raw = store.getState() as unknown as Record<string, unknown>;
        if (raw?.options && typeof raw.options === 'object') {
          const options = raw.options as Record<string, unknown>;
          if (options.resolver) return options.resolver as Record<string, unknown>;
        }
        if (raw?.current && typeof raw.current === 'object') {
          const current = raw.current as Record<string, unknown>;
          if (current.options && typeof current.options === 'object') {
            const options = current.options as Record<string, unknown>;
            if (options.resolver) return options.resolver as Record<string, unknown>;
          }
        }
        return null;
      } catch { return null; }
    };

    // Helper: after any node insertion/move, check if ROOT has non-Container children and wrap them
    const autoWrapRootChildren = () => {
      if (isAutoWrapping) return; // guard against recursion
      try {
        const nodes = getStoreNodes();
        if (!nodes) return;
        const rootNode = nodes['ROOT'] as { data?: { nodes?: string[] } } | undefined;
        if (!rootNode?.data?.nodes) return;

        const childIds = [...rootNode.data.nodes];
        const nonContainerIds: string[] = [];

        for (const childId of childIds) {
          const childNode = nodes[childId] as unknown as { data?: { type?: { resolvedName?: string } | string; name?: string } };
          if (!childNode?.data) continue;
          const resolvedName = (typeof childNode.data.type === 'object' && childNode.data.type !== null ? (childNode.data.type as { resolvedName?: string }).resolvedName : undefined) || childNode.data.name;
          if (resolvedName !== 'Container') {
            nonContainerIds.push(childId);
          }
        }

        if (nonContainerIds.length === 0) return;

        // Use setTimeout to defer the wrapping to avoid conflicts with the current action
        setTimeout(() => {
          if (isAutoWrapping) return;
          isAutoWrapping = true;
          try {
            const resolver = getResolver();
            const ResolvedContainer = resolver?.Container;
            if (!ResolvedContainer) return;

            for (const nodeId of nonContainerIds) {
              const currentNodes = getStoreNodes();
              if (!currentNodes) continue;
              const node = currentNodes[nodeId] as unknown as { data?: { parent?: string } };
              if (!node || node.data?.parent !== 'ROOT') continue; // already moved

              // Find the index of this node in ROOT
              const currentRoot = currentNodes['ROOT'] as unknown as { data?: { nodes?: string[] } };
              const idx = currentRoot?.data?.nodes?.indexOf(nodeId) ?? -1;
              if (idx === -1) continue;

              // Create a Container using React element + parseReactElement
              const containerElement = React.createElement(Element, {
                is: ResolvedContainer,
                canvas: true,
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
                flexDirection: 'column',
                backgroundColor: 'transparent',
                contentWidth: 'inherit',
              } as unknown as React.ComponentProps<typeof Element>);

              const containerTree = store.query.parseReactElement(containerElement).toNodeTree();
              // Use ORIGINAL actions to avoid recursion
              (originalAddNodeTree as unknown as (tree: unknown, parentId: string, index?: number) => void)(containerTree, 'ROOT', idx);
              (originalMove as unknown as (nodeId: string, targetParentId: string, index: number) => void)(nodeId, containerTree.rootNodeId, 0);
            }
          } catch (err) {
            console.warn('Auto-wrap ROOT children failed:', err);
          } finally {
            isAutoWrapping = false;
          }
        }, 0);
      } catch (err) {
        console.warn('autoWrapRootChildren check failed:', err);
      }
    };

    store.actions.addNodeTree = (...args) => {
      const win = window as unknown as CraftDragWindow;
      if (win.isDraggingCraft && win.craftDragCancelled) {
        console.log("Drag cancelled: blocked addNodeTree");
        return;
      }
      const result = originalAddNodeTree(...args);
      autoWrapRootChildren();

      // Automatically select the newly added node tree root on drag drop
      const tree = args[0];
      if (win.isDraggingCraft && !win.craftDragCancelled && tree && tree.rootNodeId) {
        setTimeout(() => {
          try {
            store.actions.selectNode(tree.rootNodeId);
          } catch (e) {
            console.warn('Auto-select on drop failed:', e);
          }
        }, 50);
      }

      return result;
    };

    store.actions.move = (...args) => {
      const win = window as unknown as CraftDragWindow;
      if (win.isDraggingCraft && win.craftDragCancelled) {
        console.log("Drag cancelled: blocked move");
        return;
      }
      const result = originalMove(...args);
      autoWrapRootChildren();
      return result;
    };

    // Also wrap history.ignore
    const originalIgnore = store.actions.history.ignore;
    store.actions.history.ignore = () => {
      const actions = originalIgnore();
      const originalAdd = actions.addNodeTree;
      const originalMv = actions.move;
      actions.addNodeTree = (...args) => {
        const win = window as unknown as CraftDragWindow;
        if (win.isDraggingCraft && win.craftDragCancelled) return;
        return originalAdd(...args);
      };
      actions.move = (...args) => {
        const win = window as unknown as CraftDragWindow;
        if (win.isDraggingCraft && win.craftDragCancelled) return;
        return originalMv(...args);
      };
      return actions;
    };

    // Also wrap history.throttle
    const originalThrottle = store.actions.history.throttle;
    store.actions.history.throttle = (rate?: number) => {
      const actions = originalThrottle(rate);
      const originalAdd = actions.addNodeTree;
      const originalMv = actions.move;
      actions.addNodeTree = (...args) => {
        const win = window as unknown as CraftDragWindow;
        if (win.isDraggingCraft && win.craftDragCancelled) return;
        return originalAdd(...args);
      };
      actions.move = (...args) => {
        const win = window as unknown as CraftDragWindow;
        if (win.isDraggingCraft && win.craftDragCancelled) return;
        return originalMv(...args);
      };
      return actions;
    };

    // 2. Track global drag state and handle cancel conditions
    const handleDragStart = () => {
      const win = window as unknown as CraftDragWindow;
      win.craftDragCancelled = false;
      win.isDraggingCraft = true;
      win.isOverCanvas = false;
    };

    const handleDragOver = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      // Check if mouse is inside the canvas viewport container or a container element
      const isOverCanvas = !!target.closest('[data-drop-zone="true"]');
      const win = window as unknown as CraftDragWindow;
      win.isOverCanvas = isOverCanvas;

      // If we drag outside the canvas, clear active drop indicator in store
      if (!isOverCanvas) {
        store.actions.setIndicator(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const win = window as unknown as CraftDragWindow;
      if (e.key === 'Escape' && win.isDraggingCraft) {
        win.craftDragCancelled = true;
        store.actions.setIndicator(null);
        console.log("ESC pressed: cancelling drag operation");
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const win = window as unknown as CraftDragWindow;
      if (!win.isDraggingCraft) return;
      const target = e.target as HTMLElement;
      if (!target.closest('[data-drop-zone="true"]')) {
        win.craftDragCancelled = true;
        store.actions.setIndicator(null);
      }
    };

    const handleDragEnd = () => {
      const win = window as unknown as CraftDragWindow;
      // If dropped outside canvas or ESC was pressed, flag as cancelled
      if (!win.isOverCanvas || win.craftDragCancelled) {
        win.craftDragCancelled = true;
        store.actions.setIndicator(null);
      }

      // Reset drag flags after a short delay so drop action can be intercepted and blocked
      setTimeout(() => {
        const w = window as unknown as CraftDragWindow;
        w.isDraggingCraft = false;
        w.craftDragCancelled = false;
        w.isOverCanvas = false;
      }, 50);
    };

    window.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mouseup', handleMouseUp, true);
    window.addEventListener('dragend', handleDragEnd, true);

    return () => {
      // Restore original action wrappers
      store.actions.addNodeTree = originalAddNodeTree;
      store.actions.move = originalMove;
      store.actions.history.ignore = originalIgnore;
      store.actions.history.throttle = originalThrottle;

      window.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      window.removeEventListener('dragend', handleDragEnd, true);
    };
  }, [store]);
  /* eslint-enable react-hooks/immutability */

  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isDeviceSwitching, setIsDeviceSwitching] = useState(false);
  const deviceSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeviceChange = useCallback((nextDevice: 'desktop' | 'tablet' | 'mobile') => {
    if (nextDevice === device) return;
    if (deviceSwitchTimerRef.current) clearTimeout(deviceSwitchTimerRef.current);
    setIsDeviceSwitching(true);
    setDevice(nextDevice);
    deviceSwitchTimerRef.current = setTimeout(() => {
      setIsDeviceSwitching(false);
      deviceSwitchTimerRef.current = null;
    }, 450);
  }, [device]);

  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-device', device);
    }
  }, [device]);

  useEffect(() => {
    return () => {
      if (deviceSwitchTimerRef.current) clearTimeout(deviceSwitchTimerRef.current);
    };
  }, []);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [sidebarMode, setSidebarMode] = useState<'widgets' | 'edit' | 'history'>('widgets');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNavigator, setShowNavigator] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Save version modal states
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'save' | 'draft'>('save');
  const [saveRevisionName, setSaveRevisionName] = useState('');
  const [saveCommitMessage, setSaveCommitMessage] = useState('');
  const [saveIsStarred, setSaveIsStarred] = useState(false);

  // RAM actions history stack state
  const [ramHistory, setRamHistory] = useState<{ json: string; description: string; timestamp: Date }[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const isDeserializingRef = useRef(false);
  const prevJsonRef = useRef<string>('');

  // Autosave tracking change count
  const [autosaveChangeCount, setAutosaveChangeCount] = useState(0);

  // Autosave recovery check state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ builderData: string; createdAt: string } | null>(null);

  // Previewing revision on direct canvas state
  const [previewingRevision, setPreviewingRevision] = useState<Revision | null>(null);
  const [originalCanvasData, setOriginalCanvasData] = useState<string | null>(null);
  const historyRestoreRef = useRef<((revision: Revision) => Promise<void>) | null>(null);

  // AI Design Engine Preview States
  const [aiPreviewActive, setAiPreviewActive] = useState(false);
  const [aiOriginalData, setAiOriginalData] = useState<string | null>(null);
  const [aiPreviewActionType, setAiPreviewActionType] = useState<'Generate' | 'Improve' | 'Rewrite' | null>(null);

  // Helper to get current page settings object
  const getCurrentPageSettings = useCallback((): PageSettings => ({
    pageLayout,
    contentWidth,
    contentMaxWidth,
  }), [pageLayout, contentWidth, contentMaxWidth]);

  // Toggle Craft.js preview mode when sidebar is collapsed or we are previewing a revision or in AI Preview Mode
  useEffect(() => {
    actions.setOptions((options) => {
      options.enabled = !sidebarCollapsed && !previewingRevision && !aiPreviewActive;
    });
    if (sidebarCollapsed || previewingRevision || aiPreviewActive) {
      actions.selectNode(undefined);
    }
  }, [sidebarCollapsed, previewingRevision, aiPreviewActive, actions]);

  // Listen for custom AI Preview event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleAiPreview = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: 'Generate' | 'Improve' | 'Rewrite';
        builderData?: string;
        rootNodeId?: string;
        text?: string;
      }>;
      
      const { action, builderData, rootNodeId, text } = customEvent.detail;
      
      // Save original state before applying AI changes if not already previewing
      let originalStateStr = aiOriginalData;
      if (!aiPreviewActive) {
        originalStateStr = query.serialize();
        setAiOriginalData(originalStateStr);
        setAiPreviewActive(true);
        setAiPreviewActionType(action);
      }
      
      try {
        const originalState = JSON.parse(originalStateStr!);
        
        if (action === 'Generate') {
          if (!builderData || !rootNodeId) return;
          const newNodes = JSON.parse(builderData);
          
          // Determine parent container to append to: selected Container, or "ROOT"
          const targetParentId = selectedId || "ROOT";
          const parentNode = originalState[targetParentId];
          
          if (parentNode && parentNode.nodes) {
            const mergedState = { ...originalState, ...newNodes };
            
            // Append generated section rootNodeId to target container
            if (!mergedState[targetParentId].nodes.includes(rootNodeId)) {
              mergedState[targetParentId].nodes.push(rootNodeId);
            }
            // Point the new node's parent to target parent
            if (mergedState[rootNodeId]) {
              mergedState[rootNodeId].parent = targetParentId;
            }
            
            // Apply layout to editor
            actions.deserialize(mergedState);
            // Select the newly generated root node so the user sees it
            setTimeout(() => {
              actions.selectNode(rootNodeId);
            }, 50);
          } else {
            // Fallback: append to ROOT
            const mergedState = { ...originalState, ...newNodes };
            if (!mergedState["ROOT"].nodes.includes(rootNodeId)) {
              mergedState["ROOT"].nodes.push(rootNodeId);
            }
            if (mergedState[rootNodeId]) {
              mergedState[rootNodeId].parent = "ROOT";
            }
            actions.deserialize(mergedState);
            setTimeout(() => {
              actions.selectNode(rootNodeId);
            }, 50);
          }
        } 
        else if (action === 'Improve') {
          if (!builderData || !rootNodeId || !selectedId) return;
          const newNodes = JSON.parse(builderData);
          
          const parentId = originalState[selectedId]?.parent || "ROOT";
          const parentNode = originalState[parentId];
          
          if (parentNode && parentNode.nodes) {
            // Remove all old selected container descendants from state
            const cleanState = { ...originalState };
            const deleteDescendants = (id: string) => {
              const n = cleanState[id];
              if (!n) return;
              if (n.nodes) n.nodes.forEach(deleteDescendants);
              if (n.linkedNodes) Object.values(n.linkedNodes).forEach((cid: any) => deleteDescendants(cid));
              delete cleanState[id];
            };
            deleteDescendants(selectedId);
            
            // Merge improved nodes
            const mergedState = { ...cleanState, ...newNodes };
            
            // Replace reference in parent node: swap selectedId with rootNodeId
            const childIdx = parentNode.nodes.indexOf(selectedId);
            if (childIdx !== -1) {
              mergedState[parentId].nodes[childIdx] = rootNodeId;
            } else {
              mergedState[parentId].nodes.push(rootNodeId);
            }
            
            // Update the new root node parent reference
            if (mergedState[rootNodeId]) {
              mergedState[rootNodeId].parent = parentId;
            }
            
            // Deserialize and select
            actions.deserialize(mergedState);
            setTimeout(() => {
              actions.selectNode(rootNodeId);
            }, 50);
          }
        }
        else if (action === 'Rewrite') {
          if (text === undefined || !selectedId) return;
          
          // Apply rewriting change
          actions.setProp(selectedId, (props: any) => {
            props.text = text;
          });
        }
      } catch (err) {
        console.error("Failed to apply AI preview:", err);
        alert("Lỗi khi áp dụng bản xem trước của AI.");
      }
    };
    
    window.addEventListener('craft-apply-ai-preview', handleAiPreview);
    return () => {
      window.removeEventListener('craft-apply-ai-preview', handleAiPreview);
    };
  }, [aiPreviewActive, aiOriginalData, selectedId, actions, query]);

  const lastClickWasInNavigatorRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inNavigator = Boolean(
        target.closest('.craft-layers-wrapper') ||
        target.closest('[title="Cấu trúc nội dung"]') ||
        target.closest('[data-context-menu="true"]')
      );
      lastClickWasInNavigatorRef.current = inNavigator;

      if (!inNavigator) {
        const clickedEmptySpace = Boolean(
          target.getAttribute('data-is-container') === 'true' ||
          target.closest('[data-empty-container-placeholder="true"]')
        );
        if (clickedEmptySpace) {
          setSidebarMode('widgets');
        }
      }
    };
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => window.removeEventListener('mousedown', handleMouseDown, true);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyPointer > 0) {
      const prevIndex = historyPointer - 1;
      const targetState = ramHistory[prevIndex];
      if (targetState) {
        isDeserializingRef.current = true;
        setHistoryPointer(prevIndex);
        actions.deserialize(JSON.parse(targetState.json));
      }
    }
  }, [historyPointer, ramHistory, actions]);

  const handleRedo = useCallback(() => {
    if (historyPointer < ramHistory.length - 1) {
      const nextIndex = historyPointer + 1;
      const targetState = ramHistory[nextIndex];
      if (targetState) {
        isDeserializingRef.current = true;
        setHistoryPointer(nextIndex);
        actions.deserialize(JSON.parse(targetState.json));
      }
    }
  }, [historyPointer, ramHistory, actions]);

  const handleSelectRamHistory = useCallback((index: number) => {
    const targetState = ramHistory[index];
    if (targetState) {
      isDeserializingRef.current = true;
      setHistoryPointer(index);
      actions.deserialize(JSON.parse(targetState.json));
    }
  }, [ramHistory, actions]);

  // Global keyboard shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Still allow Escape in inputs
        if (e.key === 'Escape') {
          (target as HTMLElement).blur();
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Escape — deselect and switch to widgets
      if (e.key === 'Escape') {
        e.preventDefault();
        actions.selectNode(undefined);
        setSidebarMode('widgets');
        return;
      }

      // Ctrl+I — toggle navigator
      if (ctrl && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShowNavigator(prev => !prev);
        return;
      }

      // Ctrl+Z / Cmd+Z — undo, works even when no node is selected
      if (ctrl && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — redo, works even when no node is selected
      if (
        ctrl &&
        !e.altKey &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // All following shortcuts require a selected node
      if (!selectedId || selectedId === 'ROOT') return;

      const node = query.node(selectedId).get();
      if (!node) return;
      const parentId = node.data.parent;
      const parentNode = parentId ? query.node(parentId).get() : null;
      const nodeIndex = parentNode ? parentNode.data.nodes.indexOf(selectedId) : -1;
      const isLocked = Boolean(node.data.custom?.locked);
      const isContainer = (node.data.type as unknown as { resolvedName?: string })?.resolvedName === 'Container';
      const isLinkedNode = Boolean(parentNode && parentNode.data.linkedNodes && Object.values(parentNode.data.linkedNodes).includes(selectedId));

      // Ctrl+D — duplicate
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        if (isLocked || !parentId || isLinkedNode) return;
        try {
          console.log('[DEBUG Duplicate] selectedId:', selectedId, 'parentId:', parentId, 'nodeIndex:', nodeIndex);
          const nodeTree = query.node(selectedId).toNodeTree() as unknown as CraftNodeTree;
          console.log('[DEBUG Duplicate] nodeTree rootNodeId:', nodeTree.rootNodeId, 'nodeCount:', Object.keys(nodeTree.nodes).length);
          const cloned = cloneNodeTreeWithFreshIds(nodeTree);
          console.log('[DEBUG Duplicate] cloned rootNodeId:', cloned.rootNodeId, 'nodeCount:', Object.keys(cloned.nodes).length);
          actions.addNodeTree(cloned as unknown as Parameters<typeof actions.addNodeTree>[0], parentId, nodeIndex + 1);
          console.log('[DEBUG Duplicate] addNodeTree succeeded');
        } catch (err) {
          console.error('Shortcut: Failed to duplicate node:', err);
        }
        return;
      }

      // Ctrl+C — copy node
      if (ctrl && !e.shiftKey && e.key === 'c') {
        e.preventDefault();
        if (isLinkedNode) return;
        try {
          const nodeTree = query.node(selectedId).toNodeTree() as unknown as CraftNodeTree;
          console.log('[DEBUG Copy] nodeTree rootNodeId:', nodeTree.rootNodeId, 'nodeCount:', Object.keys(nodeTree.nodes).length);
          const styleProps = extractStyleProps(node.data.props || {});
          setMemoryNodeTreeClipboard(nodeTree);
          console.log('[DEBUG Copy] memoryNodeTreeClipboard set, rootNodeId:', memoryNodeTreeClipboard?.rootNodeId);
          const nextClipboard = { ...readClipboard(), styleProps };
          writeClipboard(nextClipboard);
          console.log('[DEBUG Copy] writeClipboard done');
        } catch (err) {
          console.error('Shortcut: Failed to copy node:', err);
        }
        return;
      }

      // Ctrl+V — paste node
      if (ctrl && !e.shiftKey && !e.altKey && e.key === 'v') {
        e.preventDefault();
        console.log('[DEBUG Paste] memoryNodeTreeClipboard:', memoryNodeTreeClipboard?.rootNodeId, 'isLocked:', isLocked);
        const copiedTree = memoryNodeTreeClipboard;
        if (!copiedTree || isLocked) {
          console.log('[DEBUG Paste] aborted - no copied tree or locked');
          return;
        }
        try {
          const clonedTree = cloneNodeTreeWithFreshIds(copiedTree);
          const targetParent = isContainer ? selectedId : parentId;
          const siblingCount = isContainer ? (node.data.nodes?.length || 0) : (parentNode?.data.nodes?.length || 0);
          const targetIndex = isContainer ? siblingCount : nodeIndex + 1;
          console.log('[DEBUG Paste] targetParent:', targetParent, 'targetIndex:', targetIndex);
          if (!targetParent) return;
          actions.addNodeTree(clonedTree as unknown as Parameters<typeof actions.addNodeTree>[0], targetParent, targetIndex);
          console.log('[DEBUG Paste] addNodeTree succeeded');
        } catch (err) {
          console.error('Shortcut: Failed to paste node:', err);
        }
        return;
      }

      // Alt+Shift+V — paste style
      if (e.altKey && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const styleProps = readClipboard().styleProps;
        if (!styleProps || isLocked) return;
        try {
          actions.setProp(selectedId, (props: Record<string, unknown>) => {
            Object.entries(styleProps).forEach(([key, value]) => {
              props[key] = value;
            });
          });
        } catch (err) {
          console.error('Shortcut: Failed to paste style:', err);
        }
        return;
      }

      // Delete / Backspace — delete node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (isLocked || selectedId === 'ROOT' || isLinkedNode) return;
        actions.selectNode(undefined);
        setTimeout(() => {
          try {
            actions.delete(selectedId);
          } catch (err) {
            console.error('Shortcut: Failed to delete node:', err);
          }
        }, 0);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, query, selectedId, handleUndo, handleRedo]);

  // Listen for "+" button clicks inside empty containers to switch to widgets mode
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      const tab = customEvent.detail;
      console.log('[DEBUG] handleSwitchTab received event:', tab);
      if (tab === 'edit' || tab === 'properties' || tab === 'style') {
        setSidebarMode('edit');
        setSidebarCollapsed(false);
      } else {
        setSidebarMode('widgets');
      }
    };
    window.addEventListener('craft-switch-sidebar-tab', handleSwitchTab);
    return () => window.removeEventListener('craft-switch-sidebar-tab', handleSwitchTab);
  }, []);

  // Sync sidebar mode to selected element changes
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    console.log('[DEBUG] selectedId observer. current selectedId:', selectedId, 'prevSelectedId:', prevSelectedIdRef.current);
    if (selectedId === prevSelectedIdRef.current) {
      return;
    }
    prevSelectedIdRef.current = selectedId || null;

    if (selectedId && selectedId !== 'ROOT') {
      const timer = setTimeout(() => {
        console.log('[DEBUG] setting sidebarMode: edit for selectedId:', selectedId);
        setSidebarMode('edit');
        setSidebarCollapsed(false);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        console.log('[DEBUG] setting sidebarMode: widgets since selectedId is empty or ROOT');
        setSidebarMode('widgets');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  // Media Library integration states
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaSelectCallback, setMediaSelectCallback] = useState<((url: string) => void) | null>(null);

  // Icon Library integration states
  const [isIconOpen, setIsIconOpen] = useState(false);
  const [iconSelectCallback, setIconSelectCallback] = useState<((iconName: string, iconStyle: 'outline' | 'solid' | 'brands' | 'custom') => void) | null>(null);
  const [selectedIconName, setSelectedIconName] = useState<string>('Star');
  const [selectedIconStyle, setSelectedIconStyle] = useState<'outline' | 'solid' | 'brands' | 'custom'>('outline');

  const initialLoadedRef = useRef(false);

  // Navigation guard for unsaved changes
  useNavigationGuard(hasUnsavedChanges);

  // Autosave recovery check on mount
  useEffect(() => {
    async function checkRecovery() {
      if (!postId && !templateId) return;
      try {
        const queryParams = new URLSearchParams();
        if (postId) queryParams.set('postId', postId.toString());
        if (templateId) queryParams.set('templateId', templateId.toString());

        const res = await fetch(`/api/autosave?${queryParams.toString()}`);
        const data = await safeJson(res);
        
        if (data.success && data.hasAutosave && data.autosave) {
          setRecoveryData({
            builderData: data.autosave.builderData,
            createdAt: data.autosave.createdAt,
          });
          setShowRecoveryModal(true);
        }
      } catch (err) {
        console.error("Failed to check autosave recovery:", err);
      }
    }
    checkRecovery();
  }, [postId, templateId]);

  // 1. Deserialize initial data on mount and initialize RAM History
  useEffect(() => {
    if (initialLoadedRef.current) return;
    
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed && parsed["ROOT"]) {
          const sanitized = sanitizeCraftData(parsed);
          actions.deserialize(sanitized);
          
          const jsonStr = JSON.stringify(sanitized);
          setTimeout(() => {
            setRamHistory([{ json: jsonStr, description: "Khởi tạo thiết kế", timestamp: new Date() }]);
            setHistoryPointer(0);
            prevJsonRef.current = jsonStr;
          }, 0);
        } else {
          console.warn("Detected GrapesJS data or invalid Craft.js JSON. Starting with clean canvas.");
        }
      } catch (error) {
        console.error("Failed to parse initialData JSON:", error);
      }
    } else {
      // Start empty canvas
      setTimeout(() => {
        const currentJson = query.serialize();
        setRamHistory([{ json: currentJson, description: "Khởi tạo thiết kế", timestamp: new Date() }]);
        setHistoryPointer(0);
        prevJsonRef.current = currentJson;
      }, 50);
    }
    
    initialLoadedRef.current = true;
  }, [initialData, actions, query]);

  // 2. Track changes, add to local RAM History, update unsaved flag
  useEffect(() => {
    if (!initialLoadedRef.current) return;

    const timer = setTimeout(() => {
      if (isDeserializingRef.current) {
        isDeserializingRef.current = false;
        prevJsonRef.current = query.serialize();
        return;
      }

      const currentJson = query.serialize();
      if (currentJson === prevJsonRef.current) return;

      const description = getActionDescription(prevJsonRef.current, currentJson);
      
      setRamHistory((prev) => {
        const truncated = prev.slice(0, historyPointer + 1);
        const newHistory = [...truncated, { json: currentJson, description, timestamp: new Date() }];
        if (newHistory.length > 100) {
          newHistory.shift();
        }
        return newHistory;
      });

      setHistoryPointer((prev) => {
        const nextPtr = prev + 1;
        return nextPtr >= 100 ? 99 : nextPtr;
      });

      prevJsonRef.current = currentJson;
      setHasUnsavedChanges(true);
      setAutosaveChangeCount((count) => count + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [state, query, historyPointer]);

  // 3. Auto-save handler (triggered by 30 seconds timer OR 10 unsaved changes)
  useEffect(() => {
    if (!hasUnsavedChanges || !onAutoSave) return;

    const triggerAutosave = async () => {
      setIsAutoSaving(true);
      try {
        const json = query.serialize();
        const html = renderCraftToHtml(json, { templateType, pageId: postId || templateId || 'draft' });
        const success = await onAutoSave(html, json, getCurrentPageSettings());
        if (success) {
          setAutosaveChangeCount(0);
          setLastSavedAt(new Date());
        }
      } catch (err) {
        console.error("Autosave failed:", err);
      } finally {
        setIsAutoSaving(false);
      }
    };

    if (autosaveChangeCount >= 10) {
      triggerAutosave();
      return;
    }

    const timer = setTimeout(() => {
      triggerAutosave();
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, autosaveChangeCount, query, onAutoSave, templateType, getCurrentPageSettings]);

  const handleRestoreAutosave = () => {
    if (recoveryData) {
      try {
        const parsed = JSON.parse(recoveryData.builderData);
        const sanitized = sanitizeCraftData(parsed);
        isDeserializingRef.current = true;
        actions.deserialize(sanitized);
        
        const jsonStr = JSON.stringify(sanitized);
        setRamHistory([{ json: jsonStr, description: "Khôi phục từ bản lưu tự động", timestamp: new Date() }]);
        setHistoryPointer(0);
        prevJsonRef.current = jsonStr;
        setHasUnsavedChanges(true);
        setAutosaveChangeCount(0);
      } catch (error) {
        console.error("Failed to parse recovery data:", error);
      }
    }
    setShowRecoveryModal(false);
  };

  const handleDiscardAutosave = async () => {
    if (postId || templateId) {
      try {
        const queryParams = new URLSearchParams();
        if (postId) queryParams.set('postId', postId.toString());
        if (templateId) queryParams.set('templateId', templateId.toString());

        await fetch(`/api/autosave?${queryParams.toString()}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error("Failed to delete autosave:", err);
      }
    }
    setShowRecoveryModal(false);
  };

  const handlePreviewRevision = (revision: Revision | null) => {
    if (!revision) {
      // Clear preview and revert canvas back to original unsaved data
      if (originalCanvasData) {
        try {
          const parsed = JSON.parse(originalCanvasData);
          const sanitized = sanitizeCraftData(parsed);
          isDeserializingRef.current = true;
          actions.deserialize(sanitized);
        } catch (err) {
          console.error("Failed to restore original canvas:", err);
        }
      }
      setPreviewingRevision(null);
      setOriginalCanvasData(null);
    } else {
      // Save current state as originalCanvasData (if we are not already in a preview session)
      if (!previewingRevision) {
        const currentJson = query.serialize();
        setOriginalCanvasData(currentJson);
      }
      
      // Load selected revision data into editor
      try {
        const parsed = JSON.parse(revision.builderData);
        const sanitized = sanitizeCraftData(parsed);
        isDeserializingRef.current = true;
        actions.deserialize(sanitized);
        setPreviewingRevision(revision);
      } catch (err) {
        console.error("Failed to preview revision data:", err);
      }
    }
  };

  const handleRestoreRevision = (builderDataStr: string) => {
    try {
      const parsed = JSON.parse(builderDataStr);
      const sanitized = sanitizeCraftData(parsed);
      isDeserializingRef.current = true;
      actions.deserialize(sanitized);

      const jsonStr = JSON.stringify(sanitized);
      setRamHistory([{ json: jsonStr, description: "Khôi phục từ bản lưu lịch sử", timestamp: new Date() }]);
      setHistoryPointer(0);
      prevJsonRef.current = jsonStr;
      setHasUnsavedChanges(false);
      setAutosaveChangeCount(0);

      // Clear previewing state upon successful restore
      setPreviewingRevision(null);
      setOriginalCanvasData(null);
    } catch (error) {
      console.error("Failed to parse restored data:", error);
    }
  };

  const handleRevertAiPreview = () => {
    if (!aiOriginalData) return;
    try {
      actions.deserialize(JSON.parse(aiOriginalData));
    } catch (err) {
      console.error("Failed to revert AI preview:", err);
    } finally {
      setAiPreviewActive(false);
      setAiOriginalData(null);
      setAiPreviewActionType(null);
    }
  };

  const handleApplyAiPreview = async () => {
    if (!aiOriginalData || !aiPreviewActionType) return;
    
    setIsSaving(true);
    try {
      // 1. Create automatic backup revision of the pre-AI state
      const backupName = `Backup Before AI ${aiPreviewActionType}`;
      const preAiHtml = renderCraftToHtml(aiOriginalData, { templateType, pageId: postId || templateId || 'draft' });
      
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: postId || undefined,
          templateId: templateId || undefined,
          revisionName: backupName,
          builderData: aiOriginalData,
          htmlContent: preAiHtml,
          commitMessage: `Backup tự động trước khi áp dụng AI (${aiPreviewActionType})`,
        }),
      });
      
      const data = await safeJson(res);
      if (!data.success) {
        console.warn("Autobackup creation failed, but continuing apply:", data.error);
      }
      
      // 2. Save the current canvas state to the server
      const currentJson = query.serialize();
      const currentHtml = renderCraftToHtml(currentJson, { templateType, pageId: postId || templateId || 'draft' });
      await onSave(currentHtml, currentJson, getCurrentPageSettings(), `Áp dụng AI ${aiPreviewActionType}`);
      
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      
      // 3. Clear preview state
      setAiPreviewActive(false);
      setAiOriginalData(null);
      setAiPreviewActionType(null);
    } catch (error) {
      alert("Lỗi khi áp dụng thiết kế AI và lưu vào máy chủ!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Version modal is only for named milestone versions, not normal Save.
  const triggerSaveFlow = (type: 'save' | 'draft') => {
    setSaveModalType(type);
    setSaveRevisionName('');
    setSaveCommitMessage('');
    setSaveIsStarred(false);
    setSaveModalOpen(true);
  };

  const executeSave = async () => {
    setSaveModalOpen(false);
    const revName = saveRevisionName.trim() || undefined;
    const commitMsg = saveCommitMessage.trim() || undefined;

    if (saveModalType === 'save') {
      await handleSave(commitMsg, revName, saveIsStarred);
    } else {
      await handleSaveDraft(commitMsg, revName, saveIsStarred);
    }
  };

  // Save changes manually
  const handleSave = async (commitMessage?: string, revisionName?: string, isStarred?: boolean) => {
    setIsSaving(true);
    try {
      const json = query.serialize();
      const html = renderCraftToHtml(json, { templateType, pageId: postId || templateId || 'draft' });
      await onSave(html, json, getCurrentPageSettings(), commitMessage, revisionName, isStarred);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
    } catch (error) {
      alert("Lỗi khi lưu dữ liệu thiết kế!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleSaveDraft = async (commitMessage?: string, revisionName?: string, isStarred?: boolean) => {
    if (!onSaveDraft) return;
    setIsSavingDraft(true);
    try {
      const json = query.serialize();
      const html = renderCraftToHtml(json, { templateType, pageId: postId || templateId || 'draft' });
      await onSaveDraft(html, json, getCurrentPageSettings(), commitMessage, revisionName, isStarred);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
    } catch (error) {
      alert("Lỗi khi lưu nháp thiết kế!");
      console.error(error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePreview = async () => {
    if (!onPreview) return;
    setIsPreviewing(true);
    try {
      const json = query.serialize();
      const html = renderCraftToHtml(json, { templateType, pageId: postId || templateId || 'draft' });
      await onPreview(html, json);
    } catch (error) {
      alert("Lỗi khi mở xem trước thiết kế!");
      console.error(error);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Open Media Modal from settings panel
  const handleOpenMedia = (onSelect: (url: string) => void) => {
    setMediaSelectCallback(() => onSelect);
    setIsMediaOpen(true);
  };

  // Open Icon Modal from settings panel
  const handleOpenIcon = (
    currentIcon: string, 
    onSelect: (iconName: string, iconStyle: 'outline' | 'solid' | 'brands' | 'custom') => void,
    currentStyle?: 'outline' | 'solid' | 'brands' | 'custom'
  ) => {
    setSelectedIconName(currentIcon || 'Star');
    setSelectedIconStyle(currentStyle || 'outline');
    setIconSelectCallback(() => onSelect);
    setIsIconOpen(true);
  };

  const handleSelectIcon = (iconName: string, iconStyle: 'outline' | 'solid' | 'brands' | 'custom') => {
    if (iconSelectCallback) {
      iconSelectCallback(iconName, iconStyle);
    }
    setIsIconOpen(false);
    setIconSelectCallback(null);
  };

  const handleSelectMedia = (image: { id: number; url: string }) => {
    if (mediaSelectCallback) {
      mediaSelectCallback(image.url);
    }
    setIsMediaOpen(false);
    setMediaSelectCallback(null);
  };

  return (
    <PageSettingsProvider value={{
      pageLayout,
      contentWidth,
      contentMaxWidth,
      websiteSettings,
      device,
      setPageLayout: (v) => { setPageLayout(v); setHasUnsavedChanges(true); },
      setContentWidth: (v) => { setContentWidth(v); setHasUnsavedChanges(true); },
      setContentMaxWidth: (v) => { setContentMaxWidth(v); setHasUnsavedChanges(true); },
      setWebsiteSettings: (v) => { setWebsiteSettings(v); setHasUnsavedChanges(true); },
      setDevice: handleDeviceChange,
    }}>
    <style
      id="lexi-website-settings-live"
      dangerouslySetInnerHTML={{
        __html: generateWebsiteSettingsCss(websiteSettings)
      }}
    />
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen overflow-hidden font-sans lexi-builder-canvas">
      
      {/* Top Toolbar */}
      <Toolbar
        pageTitle={pageTitle}
        device={device}
        setDevice={handleDeviceChange}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
        onSave={() => handleSave()}
        onSaveVersion={() => triggerSaveFlow('save')}
        onClose={onClose}
        isSaving={isSaving}
        onSaveDraft={onSaveDraft ? () => handleSaveDraft() : undefined}
        onPreview={onPreview ? handlePreview : undefined}
        isSavingDraft={isSavingDraft}
        isPreviewing={isPreviewing}
        showNavigator={showNavigator}
        setShowNavigator={setShowNavigator}
        websiteSettings={websiteSettings}
        setWebsiteSettings={setWebsiteSettings}
        backLabel={backLabel}
      />

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Unified Left Sidebar Drawer */}
        <div className="relative h-full flex shrink-0 z-50">
          <div 
            className={`transition-all duration-300 ease-in-out flex flex-col bg-white h-full overflow-hidden ${sidebarCollapsed ? 'w-0' : 'w-80'}`}
            style={{
              borderRight: sidebarCollapsed ? 'none' : '1px solid #cbd5e1'
            }}
          >
            <div className="w-80 shrink-0 h-full flex flex-col">
              
              {/* Unified Sidebar Navigation Toolbar */}
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0 select-none">
                <div className="flex items-center gap-1">
                  {/* Button 1: Add Component (Plus) */}
                  <button
                    onClick={() => {
                      setSidebarMode('widgets');
                      window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'blocks' }));
                    }}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      sidebarMode === 'widgets' 
                        ? 'text-slate-800 bg-slate-200' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                    }`}
                    title="Thêm thành phần"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>

                  {/* Button 3: Style Settings (Sliders) */}
                  <button
                    disabled={!selectedId || selectedId === 'ROOT'}
                    onClick={() => {
                      if (selectedId && selectedId !== 'ROOT') {
                        setSidebarMode('edit');
                      }
                    }}
                    className={`p-1.5 rounded transition-all ${
                      !selectedId || selectedId === 'ROOT'
                        ? 'opacity-25 cursor-not-allowed text-slate-400'
                        : sidebarMode === 'edit'
                          ? 'text-slate-800 bg-slate-200 cursor-pointer'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer'
                    }`}
                    title="Thiết lập thành phần"
                  >
                    <Sliders size={14} />
                  </button>

                  {/* Button 3.5: Version Control History (History) */}
                  <button
                    onClick={() => {
                      setSidebarMode('history');
                      setSidebarCollapsed(false);
                    }}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      sidebarMode === 'history'
                        ? 'text-slate-800 bg-slate-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                    }`}
                    title="Lịch sử & Phiên bản"
                  >
                    <History size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Button 4: Layers Navigator (Layers) */}
                  <button
                    onClick={() => setShowNavigator(!showNavigator)}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      showNavigator 
                        ? 'text-slate-800 bg-slate-200' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                    }`}
                    title="Cấu trúc nội dung"
                  >
                    <Layers size={14} />
                  </button>

                  {/* Button 5: Info/Help (MessageSquare) */}
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="p-1.5 rounded transition-all cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                    title="Hướng dẫn & Phím tắt"
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>

              {/* Sidebar Content Area */}
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                {sidebarMode === 'widgets' ? (
                  <LeftSidebar />
                ) : sidebarMode === 'edit' ? (
                  <RightSidebar
                    device={device}
                    setDevice={handleDeviceChange}
                    onOpenMedia={handleOpenMedia}
                    onOpenIcon={handleOpenIcon}
                    onBackToWidgets={() => setSidebarMode('widgets')}
                  />
                ) : (
                  <HistoryPanel
                    postId={postId}
                    templateId={templateId}
                    ramHistory={ramHistory}
                    historyPointer={historyPointer}
                    onSelectRamHistory={handleSelectRamHistory}
                    currentJson={query.serialize()}
                    onRestoreRevision={handleRestoreRevision}
                    lastSavedAt={lastSavedAt}
                    onPreviewRevision={handlePreviewRevision}
                    previewingRevisionId={previewingRevision?.id || null}
                    restoreRef={historyRestoreRef}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Collapse handle button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              left: sidebarCollapsed ? '0px' : '320px',
              transition: 'left 300ms ease-in-out',
            }}
            className={`absolute top-1/2 -translate-y-1/2 z-[80] h-12 w-4 rounded-r-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-md shadow-slate-200/30 text-slate-400 hover:text-slate-600 transition-colors ${
              sidebarCollapsed ? '' : 'border-l-0'
            }`}
          >
            {sidebarCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
          </button>
        </div>

        {/* Center: Canvas Area with Sticky Preview Banner */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative z-30">
          {previewingRevision && (
            <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-5 py-2.5 z-40 sticky top-0 flex items-center justify-between shadow-lg font-sans animate-fade-in shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 -ml-3.5 inline-block" />
                <span className="font-bold text-slate-200 ml-1">
                  Bạn đang xem trước phiên bản #{previewingRevision.version}
                </span>
                <span className="text-slate-400">
                  ({previewingRevision.revisionName || 'Không tên'} - Tạo bởi {previewingRevision.createdBy?.name || 'lexi'} {new Date(previewingRevision.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreviewRevision(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-[0.98]"
                >
                  <X size={12} />
                  Quay lại bản hiện tại
                </button>
                
                <button
                  onClick={() => {
                    if (historyRestoreRef.current) {
                      historyRestoreRef.current(previewingRevision);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-[10px] shadow-md shadow-brand-500/20 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border-none active:scale-[0.98]"
                >
                  <Star size={12} fill="currentColor" />
                  Khôi phục phiên bản này
                </button>
              </div>
            </div>
          )}

          {aiPreviewActive && (
            <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-5 py-2.5 z-40 sticky top-0 flex items-center justify-between shadow-lg font-sans animate-fade-in shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles size={14} className="text-purple-400 animate-pulse shrink-0" />
                <span className="font-bold text-slate-200">
                  Bạn đang xem trước kết quả do AI thiết kế ({aiPreviewActionType === 'Generate' ? 'Tạo Section' : aiPreviewActionType === 'Improve' ? 'Cải tiến Layout' : 'Viết lại nội dung'})
                </span>
                <span className="text-slate-400 hidden lg:inline-block">
                  — Nhấp "Áp dụng" để lưu bản thiết kế này (hệ thống sẽ tự động tạo một bản sao lưu để khôi phục khi cần).
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRevertAiPreview}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-[0.98]"
                >
                  <X size={12} />
                  Hủy bỏ (Revert)
                </button>
                
                <button
                  onClick={handleApplyAiPreview}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg text-[10px] shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border-none active:scale-[0.98] disabled:opacity-50"
                >
                  <Check size={12} />
                  {isSaving ? 'Đang lưu...' : 'Áp dụng (Apply)'}
                </button>
              </div>
            </div>
          )}

          {/* Center: Canvas Viewport */}
          <div
            id="canvas-viewport"
            data-drop-zone="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                actions.selectNode(undefined);
                setSidebarMode('widgets');
              }
            }}
            data-device={device}
            className={`flex-1 bg-slate-100 overflow-y-auto flex justify-center items-start transition-all duration-300 custom-scrollbar ${
              device === 'desktop' ? 'p-0' : 'p-8'
            }`}
            style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* Outer wrapper for header + content + footer — keeps them stacked vertically */}
            <div
              style={{
                width: device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%',
                maxWidth: device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : 'none',
              }}
              className={`flex flex-col bg-white transition-all duration-300 ${
                device === 'desktop'
                  ? 'w-full min-h-full border-none shadow-none rounded-none'
                  : 'my-4 rounded-2xl overflow-hidden ring-[12px] ring-slate-200/50 ring-offset-2 border border-slate-200 shadow-xl min-h-[600px]'
              }`}
            >
              {/* Header Preview — OUTSIDE page-builder-content to avoid CSS resets */}
              {shouldShowThemeTemplates && (
                headerTemplate || isLoadingThemeTemplates ? (
                  <TemplatePartFrame
                    type="header"
                    template={headerTemplate}
                    isLoading={isLoadingThemeTemplates}
                    returnTo={currentBuilderPath}
                    disabled={sidebarCollapsed}
                  />
                ) : (
                  <ThemeDefaultHeaderPreview settings={themeSettings} device={device} />
                )
              )}

              <div
                id="canvas-content-sheet"
                data-device={device}
                data-lexi-page-id={builderPageScopeId}
                className="page-builder-content bg-white flex flex-col relative flex-1 overflow-y-auto"
              >
                <style id="lexi-builder-generated-css">{builderGeneratedCss}</style>
                {isDeviceSwitching && (
                  <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-white/85 backdrop-blur-[2px] transition-opacity duration-150">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
                      <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
                      <div className="text-center">
                        <div className="text-[11px] font-bold text-slate-700">Đang chuyển chế độ hiển thị</div>
                        <div className="text-[10px] text-slate-400">Đợi canvas cập nhật responsive...</div>
                      </div>
                    </div>
                  </div>
                )}

                <Frame>
                  <Element is={Container} canvas>
                    {/* Welcome section - elements wrapped in a Container (not directly on ROOT) */}
                    <Element is={Container} paddingTop="40px" paddingBottom="40px" paddingLeft="20px" paddingRight="20px" canvas>
                      <HeadingBlock
                        text="Chào mừng tới Trình thiết kế mới!"
                        level="h2"
                        fontSize="28px"
                        fontWeight="800"
                        textAlign="center"
                        textColor="#1e293b"
                        marginBottom="8px"
                      />
                      <TextBlock
                        text="Kéo và thả các khối từ bảng bên trái vào đây để xây dựng trang tĩnh của bạn."
                        textAlign="center"
                        fontSize="14px"
                        textColor="#64748b"
                        marginBottom="24px"
                      />
                    <Element is={Container} backgroundColor="#f8fafc" borderRadius="8px" paddingLeft="20px" paddingRight="20px" paddingTop="20px" paddingBottom="20px" canvas>
                      <HeadingBlock text="⚡ Hướng dẫn nhanh" level="h4" fontSize="16px" fontWeight="700" textColor="#0f172a" />
                      <TextBlock text="1. Kéo <b>Khung chứa</b> hoặc các khối <b>2 Cột / 3 Cột</b> vào màn hình trước để tạo lưới bố cục." fontSize="13px" textColor="#475569" />
                      <TextBlock text="2. Thả các thành phần chi tiết (Tiêu đề, Văn bản, Ảnh, Nút) vào trong khung chứa đó." fontSize="13px" textColor="#475569" />
                      <TextBlock text="3. Click chọn bất kỳ thành phần nào để mở bảng chỉnh sửa khoảng cách, màu sắc, font chữ bên phải." fontSize="13px" textColor="#475569" />
                    </Element>
                  </Element>
                </Element>
              </Frame>

              <EditorLiveStyles />
              <CustomDragIndicator />
            </div>

            {/* Footer Preview — OUTSIDE page-builder-content to avoid CSS resets */}
            {shouldShowThemeTemplates && (
              footerTemplate || isLoadingThemeTemplates ? (
                <TemplatePartFrame
                  type="footer"
                  template={footerTemplate}
                  isLoading={isLoadingThemeTemplates}
                  returnTo={currentBuilderPath}
                  disabled={sidebarCollapsed}
                />
              ) : (
                <ThemeDefaultFooterPreview settings={themeSettings} />
              )
            )}
          </div>
          </div>
        </div>

        {/* Right Sidebar: Navigator Settings */}
        <div className={`transition-all duration-300 ease-in-out relative flex flex-col shrink-0 border-l border-slate-200 bg-white h-full z-50 ${showNavigator && !sidebarCollapsed ? 'w-72' : 'w-0 border-l-0 overflow-hidden'}`}>
          <div className="w-72 shrink-0 h-full flex flex-col overflow-hidden">
            <Navigator onClose={() => setShowNavigator(false)} selectedId={selectedId} />
          </div>
        </div>

      </div>

      {/* Shared Media Modal Portal */}
      <MediaModal
        isOpen={isMediaOpen}
        onClose={() => {
          setIsMediaOpen(false);
          setMediaSelectCallback(null);
        }}
        onSelect={handleSelectMedia}
      />

      {/* Shared Icon Modal Portal */}
      <IconModal
        isOpen={isIconOpen}
        selectedIcon={selectedIconName}
        selectedIconStyle={selectedIconStyle}
        onClose={() => {
          setIsIconOpen(false);
          setIconSelectCallback(null);
        }}
        onSelect={handleSelectIcon}
      />

      {/* Save Version Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div 
            className="fixed inset-0 cursor-default" 
            onClick={() => setSaveModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 z-10 mx-4 overflow-hidden">
            <button
              onClick={() => setSaveModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  {saveModalType === 'save' ? 'Lưu phiên bản mới' : 'Lưu bản nháp mới'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Lưu vào lịch sử bản sửa đổi của hệ thống
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tên phiên bản
                </label>
                <input
                  type="text"
                  value={saveRevisionName}
                  onChange={(e) => setSaveRevisionName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
                  placeholder="ví dụ: Sửa Hero Banner, Landing IELTS v3..."
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ghi chú thay đổi (không bắt buộc)
                </label>
                <textarea
                  value={saveCommitMessage}
                  onChange={(e) => setSaveCommitMessage(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white h-20 resize-none transition-all"
                  placeholder="ví dụ: Cập nhật responsive và đổi màu CTA..."
                />
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="save-is-starred"
                  checked={saveIsStarred}
                  onChange={(e) => setSaveIsStarred(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="save-is-starred" className="text-[11px] font-bold text-slate-600 cursor-pointer flex items-center gap-1">
                  <Star size={11} fill={saveIsStarred ? 'currentColor' : 'none'} className="text-amber-500" />
                  Đánh dấu là phiên bản Stable (Bản ghim cố định)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    executeSave();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
                >
                  {saveModalType === 'save' ? 'Lưu phiên bản' : 'Lưu bản nháp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Shortcuts Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div 
            className="fixed inset-0 cursor-default" 
            onClick={() => setShowHelpModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full p-6 z-10 mx-4">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Trợ giúp & Phím tắt</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Craft Builder Shortcuts</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Context menu note */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                💡 <span className="font-bold text-slate-700">Mẹo nhanh:</span> Bạn có thể <b>Click chuột phải</b> vào bất kỳ thành phần nào trên màn hình Canvas hoặc trong bảng <b>Cấu trúc nội dung (Navigator)</b> để mở menu thao tác nhanh (Sao chép, Dán, Khóa, Nhân bản, Xóa).
              </div>

              {/* Shortcuts Table */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phím tắt nhanh</h4>
                <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 text-[11px]">
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Bảng thành phần (Widgets)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Tạo bản sao (Duplicate)</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">D</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Sao chép (Copy)</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">C</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Dán (Paste Node)</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">V</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Dán định dạng (Paste Style)</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Alt</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Shift</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">V</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-slate-600 font-medium">Mở cấu trúc Navigator</span>
                    <div className="flex gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold shadow-sm">I</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      <RecoveryModal
        isOpen={showRecoveryModal}
        onRestore={handleRestoreAutosave}
        onDiscard={handleDiscardAutosave}
        autosaveDate={recoveryData?.createdAt || ''}
      />
    </div>
    </PageSettingsProvider>
  );
}

function CustomDragIndicator() {
  const { indicator, enabled, query } = useEditor((state) => ({
    indicator: state.indicator,
    enabled: state.options.enabled,
  }));

  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!enabled || !indicator) {
      setTimeout(() => setStyle(null), 0);
      return;
    }

    const { placement, error } = indicator;
    const parentNode = placement.parent;
    const where = placement.where;
    const index = placement.index;

    if (!parentNode || !parentNode.dom) {
      setTimeout(() => setStyle(null), 0);
      return;
    }

    const parentDom = parentNode.dom;
    const parentRect = parentDom.getBoundingClientRect();
    const parentStyle = window.getComputedStyle(parentDom);
    const pt = parseFloat(parentStyle.paddingTop) || 0;
    const pb = parseFloat(parentStyle.paddingBottom) || 0;
    const pl = parseFloat(parentStyle.paddingLeft) || 0;
    const pr = parseFloat(parentStyle.paddingRight) || 0;

    let top = 0;
    let left = 0;
    let width = 0;
    let height = 0;
    const thickness = 4; // Thickness of the indicator line

    // Decide the insertion guide direction from the parent canvas layout
    const parentFlexDirection = parentStyle.flexDirection;
    const isGrid = parentStyle.display === 'grid';
    const inFlow = !isGrid && parentFlexDirection !== 'row' && parentFlexDirection !== 'row-reverse';

    // Safely get sibling DOMs
    let siblingBeforeDom: HTMLElement | null = null;
    let siblingAfterDom: HTMLElement | null = null;

    const childIds = parentNode.data.nodes || [];
    let idBefore: string | null = null;
    let idAfter: string | null = null;

    if (where === 'before') {
      idAfter = childIds[index] || null;
      idBefore = index > 0 ? (childIds[index - 1] || null) : null;
    } else {
      idBefore = childIds[index] || null;
      idAfter = index < childIds.length - 1 ? (childIds[index + 1] || null) : null;
    }

    if (idBefore) siblingBeforeDom = query.node(idBefore).get()?.dom || null;
    if (idAfter) siblingAfterDom = query.node(idAfter).get()?.dom || null;

    if (siblingBeforeDom && !siblingBeforeDom.isConnected) siblingBeforeDom = null;
    if (siblingAfterDom && !siblingAfterDom.isConnected) siblingAfterDom = null;

    let targetCellRect: DOMRect | null = null;
    let isGridBox = false;

    if (isGrid && parentDom.children) {
      const childElements = Array.from(parentDom.children);
      const targetElement = childElements[index] || childElements[childElements.length - 1];
      if (targetElement) {
        targetCellRect = targetElement.getBoundingClientRect();
        isGridBox = true;
      }
    }

    if (isGridBox && targetCellRect) {
      top = targetCellRect.top;
      left = targetCellRect.left;
      width = targetCellRect.width;
      height = targetCellRect.height;
    } else if (inFlow) {
      // Vertical flow: we want a horizontal line
      height = thickness;

      // Span the full inner width of the parent container
      left = parentRect.left + pl;
      width = Math.max(0, parentRect.width - pl - pr);

      if (where === 'before') {
        if (siblingAfterDom) {
          const afterRect = siblingAfterDom.getBoundingClientRect();
          top = afterRect.top - thickness / 2;
        } else {
          top = parentRect.top + pt - thickness / 2;
        }
      } else {
        if (siblingBeforeDom) {
          const beforeRect = siblingBeforeDom.getBoundingClientRect();
          top = beforeRect.bottom - thickness / 2;
        } else if (siblingAfterDom) {
          const afterRect = siblingAfterDom.getBoundingClientRect();
          top = afterRect.top - thickness / 2;
        } else {
          top = parentRect.top + pt + Math.max(0, parentRect.height - pt - pb) / 2 - thickness / 2;
        }
      }
    } else {
      // Horizontal flow: we want a vertical line
      width = thickness;

      // Span the full inner height of the parent container
      top = parentRect.top + pt;
      height = Math.max(0, parentRect.height - pt - pb);

      if (where === 'before') {
        if (siblingAfterDom) {
          const afterRect = siblingAfterDom.getBoundingClientRect();
          left = afterRect.left - thickness / 2;
          if (isGrid) {
            top = afterRect.top;
            height = afterRect.height;
          }
        } else {
          left = parentRect.left + pl - thickness / 2;
        }
      } else {
        if (siblingBeforeDom) {
          const beforeRect = siblingBeforeDom.getBoundingClientRect();
          left = beforeRect.right - thickness / 2;
          if (isGrid) {
            top = beforeRect.top;
            height = beforeRect.height;
          }
        } else if (siblingAfterDom) {
          const afterRect = siblingAfterDom.getBoundingClientRect();
          left = afterRect.left - thickness / 2;
          if (isGrid) {
            top = afterRect.top;
            height = afterRect.height;
          }
        } else {
          left = parentRect.left + pl + Math.max(0, parentRect.width - pl - pr) / 2 - thickness / 2;
        }
      }
    }

    const color = error ? '#ef4444' : '#ec4899';

    // Clip indicator to canvas viewport bounds
    const viewport = document.getElementById('canvas-viewport');
    if (viewport) {
      const vpRect = viewport.getBoundingClientRect();
      
      const indicatorRight = left + width;
      const clippedLeft = Math.max(left, vpRect.left);
      const clippedRight = Math.min(indicatorRight, vpRect.right);
      left = clippedLeft;
      width = Math.max(0, clippedRight - clippedLeft);

      // Clip vertically
      const indicatorBottom = top + height;
      const clippedTop = Math.max(top, vpRect.top);
      const clippedBottom = Math.min(indicatorBottom, vpRect.bottom);
      top = clippedTop;
      height = Math.max(0, clippedBottom - clippedTop);
    }

    // Convert to relative coordinates inside the relative canvas-content-sheet
    const sheet = document.getElementById('canvas-content-sheet');
    if (sheet) {
      const sheetRect = sheet.getBoundingClientRect();
      top = top - sheetRect.top;
      left = left - sheetRect.left;
    }

    setTimeout(() => {
      setStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: isGridBox ? 'rgba(236, 72, 153, 0.2)' : color,
        border: isGridBox ? `2px dashed ${color}` : 'none',
        zIndex: 99999,
        pointerEvents: 'none',
        borderRadius: isGridBox ? '4px' : '2px',
        transition: 'all 0.15s ease',
      });
    }, 0);
  }, [indicator, enabled, query]);

  if (!style || !indicator) return null;

  const { placement, error } = indicator;
  const currentDom = placement?.currentNode?.dom;
  const inFlow = currentDom ? getDOMInfo(currentDom).inFlow : true;

  return (
    <div className="editor-drag-indicator" style={style}>
      {error && (
        <div 
          style={{
            position: 'absolute',
            top: inFlow ? '-10px' : '50%',
            left: inFlow ? '50%' : '-10px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        >
          Không thể thả ở đây
        </div>
      )}
    </div>
  );
}

export default function CraftEditor(props: CraftEditorProps) {
  return (
    <Editor 
      resolver={{ Container, GridContainer, TextBlock, HeadingBlock, ImageBlock, ButtonBlock, DividerBlock, VideoBlock, SpacerBlock, IconBlock, IconListBlock, AccordionBlock, HtmlBlock, TabsBlock, IconBoxBlock, ImageBoxBlock, CarouselBlock, CounterBlock, ProgressBarBlock, SocialIconsBlock, FormBlock, MenuBlock, PostGridBlock }}
      indicator={{
        style: { display: 'none' }
      }}
    >
      <EditorInner {...props} />
    </Editor>
  );
}

