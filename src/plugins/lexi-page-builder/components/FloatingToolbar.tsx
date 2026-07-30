"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, Element } from '@craftjs/core';
import {
  ArrowDown,
  ArrowUp,
  Clipboard,
  Copy,
  Layers,
  Lock,
  Paintbrush,
  Pencil,
  Plus,
  RotateCcw,
  ShieldOff,
  Trash2,
} from 'lucide-react';

interface FloatingToolbarProps {
  id: string;
  displayName: string;
  x?: number;
  y?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export type CraftNodeTree = {
  rootNodeId: string;
  nodes: Record<string, CraftNodeLike>;
};

type CraftNodeLike = {
  id?: string;
  data: {
    parent?: string;
    nodes?: string[];
    linkedNodes?: Record<string, string>;
    props?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type BuilderClipboard = {
  nodeTree?: CraftNodeTree;
  styleProps?: Record<string, unknown>;
};

const CLIPBOARD_KEY = 'lexi-craft-context-clipboard';
export let memoryNodeTreeClipboard: CraftNodeTree | undefined;
export function setMemoryNodeTreeClipboard(tree: CraftNodeTree | undefined) { memoryNodeTreeClipboard = tree; }
const NON_STYLE_KEYS = new Set(['text', 'src', 'alt', 'url', 'href', 'videoUrl', 'children', 'className']);
const STYLE_KEYS = new Set([
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'backgroundColor',
  'backgroundGradient',
  'backgroundImage',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'flexWrap',
  'gap',
  'width',
  'widthMode',
  'customWidth',
  'maxWidth',
  'height',
  'minHeight',
  'shadow',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'wordSpacing',
  'textAlign',
  'color',
  'background',
  'textColor',
  'buttonColor',
  'hoverColor',
  'objectFit',
  'align',
  'size',
  'alignment',
  'style',
  'thickness',
  'orderMode',
  'customOrder',
  'position',
  'zIndex',
  'top',
  'bottom',
  'left',
  'right',
  'horizontalAlign',
  'verticalAlign',
  'idCss',
  'classCss',
  'mixBlendMode',
  'textColorHover',
  'linkColor',
  'linkColorHover',
  'paragraphSpacing',
  'textShadowColor',
  'textShadowBlur',
  'textShadowHorizontal',
  'textShadowVertical',
  // Missing advanced layout props
  'elementDisplay',
  'advancedBgType',
  'advancedBgColor',
  'advancedBgImage',
  'advancedBgGradient',
  'bgGradientColor1',
  'bgGradientPos1',
  'bgGradientColor2',
  'bgGradientPos2',
  'bgGradientType',
  'bgGradientAngle',
  'advancedBgTypeHover',
  'advancedBgColorHover',
  'advancedBgImageHover',
  'advancedBgGradientHover',
  'bgGradientColor1Hover',
  'bgGradientPos1Hover',
  'bgGradientColor2Hover',
  'bgGradientPos2Hover',
  'bgGradientTypeHover',
  'bgGradientAngleHover',
  'borderType',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'boxShadow',
  'borderColorHover',
  'borderRadiusHover',
  'borderTopLeftRadiusHover',
  'borderTopRightRadiusHover',
  'borderBottomRightRadiusHover',
  'borderBottomLeftRadiusHover',
  'boxShadowHover',
  'animationName',
  'animationDuration',
  'animationDelay',
  'animationTrigger',
  'sticky',
  // Button-specific borders and radii
  'btnBorderTopWidth',
  'btnBorderRightWidth',
  'btnBorderBottomWidth',
  'btnBorderLeftWidth',
  'btnBorderWidth',
  'btnBorderColor',
  'btnBorderStyle',
  'btnBorderRadius',
  'btnBorderTopLeftRadius',
  'btnBorderTopRightRadius',
  'btnBorderBottomRightRadius',
  'btnBorderBottomLeftRadius',
  // Icon-specific styles
  'primaryColor',
  'secondaryColor',
  'primaryColorHover',
  'secondaryColorHover',
  'iconRotate',
  'paddingProp',
  'borderRadiusProp',
  'badgeBorderTopWidth',
  'badgeBorderRightWidth',
  'badgeBorderBottomWidth',
  'badgeBorderLeftWidth',
  'badgeBorderTopLeftRadius',
  'badgeBorderTopRightRadius',
  'badgeBorderBottomRightRadius',
  'badgeBorderBottomLeftRadius',
  // Image-specific styles
  'imageWidth',
  'imageMaxWidth',
  'imageHeight',
  'opacity',
  'opacityHover',
  'cssFilters',
  'cssFiltersHover',
  // IconList-specific styles
  'listLayout',
  'hasDivider',
  'dividerStyle',
  'dividerWeight',
  'dividerColor',
  'iconColorHover',
  'iconGap',
  'iconVerticalAlign',
  'iconOffsetY',
  // Accordion-specific display/style props
  'itemAlign',
  'iconPosition',
  'activeIconType',
  'activeIconSvg',
  'activeIconLucide',
  'inactiveIconType',
  'inactiveIconSvg',
  'inactiveIconLucide',
  'titleHtmlTag',
  'defaultState',
  'maxExpanded',
  'itemSpacing',
  'contentSpacing',
  'itemBgType',
  'itemBgColor',
  'itemBgColorHover',
  'itemBgColorActive',
  'itemBorderType',
  'itemBorderColor',
  'itemBorderWidth',
  'itemBorderRadius',
  'itemPadding',
  'titleFontFamily',
  'titleFontSize',
  'titleFontWeight',
  'titleFontStyle',
  'titleTextDecoration',
  'titleLineHeight',
  'titleLetterSpacing',
  'titleWordSpacing',
  'titleTextTransform',
  'titleColor',
  'titleColorHover',
  'titleColorActive',
  'titleTextShadow',
  'titleTextStroke',
  'iconSize',
  'iconSpacing',
  'iconColor',
  'iconColorHover',
  'iconColorActive',
  'contentBgType',
  'contentBgColor',
  'contentBorderType',
  'contentBorderColor',
  'contentBorderWidth',
  'contentBorderRadius',
  'contentPadding',
  'contentColor',
  'contentFontFamily',
  'contentFontSize',
  'contentFontWeight',
  'contentFontStyle',
  'contentTextDecoration',
  'contentLineHeight',
  'contentLetterSpacing',
  'contentWordSpacing',
  'contentTextTransform',
  // Counter-specific styles
  'numberColor',
  'numberFontSize',
  'numberFontWeight',
  'numberFontFamily',
  'numberFontStyle',
  'numberTextDecoration',
  'numberTextAlign',
  'numberTextShadowColor',
  'numberTextShadowBlur',
  'numberTextShadowHorizontal',
  'numberTextShadowVertical',
  'titleHAlign',
  'titleTextShadowColor',
  'titleTextShadowBlur',
  'titleTextShadowHorizontal',
  'titleTextShadowVertical',
  'titlePosition',
  'titleSpacing',
  // Carousel-specific styles
  'arrowsPosition',
  'arrowsSize',
  'arrowsColor',
  'dotsPosition',
  'dotsSpacing',
  'dotsSize',
  'dotsColor',
  'dotsActiveColor',
  'imageAlign',
  'imageSpacing',
  // SocialIconsBlock-specific styles
  'shape',
  'iconView',
  'columns',
  'iconPadding',
  'iconRowGap',
  'hoverAnimation',
  'hoverColorMode',
  'hoverCustomColor',
  'hoverCustomSecondaryColor',
  'customBorderRadius',
  'itemColorMode',
  'itemCustomColor',
  'itemCustomSecondaryColor',
  // FormBlock-specific styles
  'columnsGap',
  'rowsGap',
  'labelSpacing',
  'labelColor',
  'labelFontSize',
  'labelFontWeight',
  'labelFontFamily',
  'fieldSpacing',
  'fieldColor',
  'fieldFontSize',
  'fieldFontWeight',
  'fieldFontFamily',
  'fieldBgColor',
  'fieldTextColor',
  'fieldBorderColor',
  'fieldBorderWidth',
  'fieldBorderRadius',
  'fieldPadding',
  'btnPosition',
  'btnAlignment',
  'btnFontFamily',
  'btnFontSize',
  'btnFontWeight',
  'btnBorderType',
  'btnBorderRadius',
  'btnPadding',
  'btnNormalBgColor',
  'btnNormalTextColor',
  'btnHoverBgColor',
  'btnHoverTextColor',
  'btnPrevBgColor',
  'btnPrevTextColor',
  'msgFontFamily',
  'msgFontSize',
  'msgFontWeight',
  'msgSuccessColor',
  'msgErrorColor',
  'msgInlineColor',
  'stepFontFamily',
  'stepFontSize',
  'stepFontWeight',
  'stepSpacing',
  'stepPadding',
  'stepDividerWidth',
  'stepDividerGap',
  'stepInactivePrimaryColor',
  'stepInactiveSecondaryColor',
  'stepActivePrimaryColor',
  'stepActiveSecondaryColor',
  'stepCompletedPrimaryColor',
  'stepCompletedSecondaryColor',
  // Typography font style and spacing options for Form block
  'labelFontStyle',
  'labelLineHeight',
  'labelLetterSpacing',
  'labelWordSpacing',
  'fieldFontStyle',
  'fieldLineHeight',
  'fieldLetterSpacing',
  'fieldWordSpacing',
  'fieldBgColorFocus',
  'fieldBorderColorFocus',
  'btnFontStyle',
  'btnLineHeight',
  'btnLetterSpacing',
  'btnWordSpacing',
  'msgFontStyle',
  'msgLineHeight',
  'msgLetterSpacing',
  'msgWordSpacing',
  'stepFontStyle',
  'stepLineHeight',
  'stepLetterSpacing',
  'stepWordSpacing',
]);

const STANDARD_DEFAULTS: Record<string, any> = {
  paddingTop: '0px',
  paddingBottom: '0px',
  paddingLeft: '0px',
  paddingRight: '0px',
  marginTop: '0px',
  marginRight: '0px',
  marginBottom: '0px',
  marginLeft: '0px',
  backgroundColor: 'transparent',
  backgroundGradient: 'none',
  backgroundImage: 'none',
  borderRadius: '0px',
  borderWidth: '0px',
  borderColor: 'transparent',
  borderStyle: 'none',
  gap: '0px',
  width: '100%',
  height: 'auto',
  minHeight: 'auto',
  shadow: 'none',
  fontSize: 'inherit',
  fontWeight: 'normal',
  fontFamily: 'inherit',
  fontStyle: 'normal',
  lineHeight: 'normal',
  letterSpacing: '0px',
  wordSpacing: '0px',
  textAlign: 'left',
  color: 'inherit',
  background: 'transparent',
  textColor: 'inherit',
  // Form specific
  labelColor: 'inherit',
  labelFontSize: '14px',
  labelFontWeight: 'normal',
  labelFontFamily: 'inherit',
  labelFontStyle: 'normal',
  labelLineHeight: 'normal',
  labelLetterSpacing: '0px',
  labelWordSpacing: '0px',
  fieldColor: 'inherit',
  fieldFontSize: '14px',
  fieldFontWeight: 'normal',
  fieldFontFamily: 'inherit',
  fieldBgColor: 'transparent',
  fieldTextColor: 'inherit',
  fieldBorderColor: 'transparent',
  fieldBorderWidth: '0px',
  fieldBorderRadius: '0px',
  fieldPadding: '0px',
  fieldFontStyle: 'normal',
  fieldLineHeight: 'normal',
  fieldLetterSpacing: '0px',
  fieldWordSpacing: '0px',
  fieldBgColorFocus: 'transparent',
  fieldBorderColorFocus: 'transparent',
  btnPosition: 'left',
  btnAlignment: 'stretch',
  btnFontFamily: 'inherit',
  btnFontSize: '14px',
  btnFontWeight: 'normal',
  btnFontStyle: 'normal',
  btnLineHeight: 'normal',
  btnLetterSpacing: '0px',
  btnWordSpacing: '0px',
  btnBorderType: 'none',
  btnBorderRadius: '0px',
  btnPadding: '0px',
  btnNormalBgColor: 'transparent',
  btnNormalTextColor: 'inherit',
  btnHoverBgColor: 'transparent',
  btnHoverTextColor: 'inherit',
  btnPrevBgColor: 'transparent',
  btnPrevTextColor: 'inherit',
  msgFontFamily: 'inherit',
  msgFontSize: '14px',
  msgFontWeight: 'normal',
  msgFontStyle: 'normal',
  msgLineHeight: 'normal',
  msgLetterSpacing: '0px',
  msgWordSpacing: '0px',
  msgSuccessColor: 'inherit',
  msgErrorColor: 'inherit',
  msgInlineColor: 'inherit',
  stepFontFamily: 'inherit',
  stepFontSize: '14px',
  stepFontWeight: 'normal',
  stepFontStyle: 'normal',
  stepLineHeight: 'normal',
  stepLetterSpacing: '0px',
  stepWordSpacing: '0px',
  stepSpacing: '0px',
  stepPadding: '0px',
  stepDividerWidth: '0px',
  stepDividerGap: '0px',
  stepInactivePrimaryColor: 'transparent',
  stepInactiveSecondaryColor: 'inherit',
  stepActivePrimaryColor: 'transparent',
  stepActiveSecondaryColor: 'inherit',
  stepCompletedPrimaryColor: 'transparent',
  stepCompletedSecondaryColor: 'inherit',
};

const itemBase = 'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] font-medium transition-colors';
const itemEnabled = 'text-slate-700 hover:bg-slate-50 hover:text-slate-950';
const itemDisabled = 'cursor-not-allowed text-slate-300';

function MenuItem({ icon, label, shortcut, onClick, disabled = false }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      className={`${itemBase} ${disabled ? itemDisabled : itemEnabled}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {shortcut && <span className="shrink-0 text-[10px] font-semibold text-slate-400">{shortcut}</span>}
    </button>
  );
}

export function readClipboard(): BuilderClipboard {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLIPBOARD_KEY);
    return raw ? JSON.parse(raw) as BuilderClipboard : {};
  } catch {
    return {};
  }
}

export function writeClipboard(nextClipboard: BuilderClipboard) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CLIPBOARD_KEY, JSON.stringify({ styleProps: nextClipboard.styleProps }));
  window.dispatchEvent(new CustomEvent('craft-context-clipboard-updated'));
}

export function cloneNodeTreeWithFreshIds(nodeTree: CraftNodeTree): CraftNodeTree {
  const idMap: Record<string, string> = {};
  const generateNewId = () => Math.random().toString(36).substring(2, 12);

  Object.keys(nodeTree.nodes).forEach((oldId) => {
    idMap[oldId] = generateNewId();
  });

  const clonedNodes: Record<string, CraftNodeLike> = {};
  Object.keys(nodeTree.nodes || {}).forEach((oldId) => {
    const node = nodeTree.nodes[oldId];
    if (!node?.data) return;

    const newId = idMap[oldId];
    clonedNodes[newId] = {
      ...node,
      id: newId,
      data: {
        ...node.data,
        parent: oldId === nodeTree.rootNodeId
          ? node.data.parent
          : (node.data.parent ? idMap[node.data.parent] || node.data.parent : undefined),
        nodes: Array.isArray(node.data.nodes) ? node.data.nodes.map((childId) => idMap[childId] || childId) : [],
        linkedNodes: node.data.linkedNodes
          ? Object.keys(node.data.linkedNodes).reduce<Record<string, string>>((acc, key) => {
              const oldLinkedId = node.data.linkedNodes?.[key];
              if (oldLinkedId) acc[key] = idMap[oldLinkedId] || oldLinkedId;
              return acc;
            }, {})
          : {},
      },
    };
  });

  if (!clonedNodes[idMap[nodeTree.rootNodeId]]) {
    throw new Error('Clipboard node tree is invalid');
  }

  return {
    rootNodeId: idMap[nodeTree.rootNodeId],
    nodes: clonedNodes,
  };
}

export function extractStyleProps(props?: Record<string, unknown>) {
  if (!props) return {};
  return Object.entries(props).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (STYLE_KEYS.has(key) && !NON_STYLE_KEYS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}


export default function FloatingToolbar({
  id,
  displayName,
  x = 0,
  y = 0,
  isOpen = false,
  onClose,
}: FloatingToolbarProps) {
  const [clipboard, setClipboard] = useState<BuilderClipboard>(() => readClipboard());

  const {
    actions,
    query,
    resolver,
    resolvedName,
    nodeName,
    selected,
    isDeletable,
    parentId,
    nodeIndex,
    siblingCount,
    isLocked,
    nodeExists,
    canMoveIn,
    currentProps,
    defaultProps,
    isLinkedNode,
  } = useEditor((state) => {
    const [selectedId] = state.events.selected;
    const isSelected = selectedId === id;
    const node = state.nodes[id];
    const parentId = node?.data.parent;
    const parentNode = parentId ? state.nodes[parentId] : null;
    const nodeIndex = parentNode ? parentNode.data.nodes.indexOf(id) : -1;
    const siblingCount = parentNode ? parentNode.data.nodes.length : 0;
    const isLocked = Boolean(node?.data.custom?.locked);
    const resolvedName = (node?.data.type as any)?.resolvedName || node?.data.name;
    const linkedComponent = resolvedName
      ? state.options.resolver[resolvedName]
      : undefined;
    const craftConfig = linkedComponent && 'craft' in (linkedComponent as any)
      ? (linkedComponent as { craft?: { props?: Record<string, unknown> } }).craft
      : undefined;
    const isLinkedNode = Boolean(parentNode && parentNode.data.linkedNodes && Object.values(parentNode.data.linkedNodes).includes(id));

    return {
      selected: isSelected,
      isDeletable: id !== 'ROOT' && !isLocked && !isLinkedNode,
      parentId,
      nodeIndex,
      siblingCount,
      isLocked,
      nodeExists: Boolean(node),
      canMoveIn: id === 'ROOT' || (node?.data.type as any)?.resolvedName === 'Container' || node?.data.name === 'Container',
      currentProps: node?.data.props || {},
      defaultProps: craftConfig?.props || {},
      resolvedName,
      resolver: state.options.resolver,
      nodeName: node?.data.name,
      isLinkedNode,
    };
  });

  const hasCopiedNode = Boolean(memoryNodeTreeClipboard?.rootNodeId);
  const hasCopiedStyle = Boolean(clipboard.styleProps && Object.keys(clipboard.styleProps).length > 0);

  const position = useMemo(() => {
    if (typeof window === 'undefined') return { left: x, top: y };
    const menuWidth = 226;
    const menuHeight = 486;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    return {
      left: Math.max(12, Math.min(x, viewportWidth - menuWidth - 12)),
      top: Math.max(12, Math.min(y, viewportHeight - menuHeight - 12)),
    };
  }, [x, y]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    const handleClipboardUpdate = () => setClipboard(readClipboard());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('craft-context-clipboard-updated', handleClipboardUpdate);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('craft-context-clipboard-updated', handleClipboardUpdate);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !selected || !nodeExists) return null;

  const closeMenu = () => onClose?.();

  const duplicateNode = () => {
    if (isLocked || !parentId || !nodeExists || isLinkedNode) return;

    try {
      console.log('[DEBUG Toolbar Duplicate] id:', id, 'parentId:', parentId, 'nodeIndex:', nodeIndex);
      const nodeTree = query.node(id).toNodeTree() as any;
      console.log('[DEBUG Toolbar Duplicate] nodeTree:', nodeTree.rootNodeId, 'nodes:', Object.keys(nodeTree.nodes));
      const cloned = cloneNodeTreeWithFreshIds(nodeTree) as any;
      console.log('[DEBUG Toolbar Duplicate] cloned:', cloned.rootNodeId, 'nodes:', Object.keys(cloned.nodes));
      actions.addNodeTree(cloned, parentId, nodeIndex + 1);
      console.log('[DEBUG Toolbar Duplicate] SUCCESS');
      closeMenu();
    } catch (err) {
      console.error('Failed to duplicate node:', err);
    }
  };

  const copyNode = () => {
    if (!nodeExists || isLinkedNode) return;
    try {
      const nodeTree = query.node(id).toNodeTree() as any;
      console.log('[DEBUG Toolbar Copy] nodeTree:', nodeTree.rootNodeId, 'nodes:', Object.keys(nodeTree.nodes));
      const styleProps = extractStyleProps(currentProps);
      memoryNodeTreeClipboard = nodeTree;
      const nextClipboard = { ...readClipboard(), styleProps };
      writeClipboard(nextClipboard);
      setClipboard(nextClipboard);
      console.log('[DEBUG Toolbar Copy] SUCCESS');
      closeMenu();
    } catch (err) {
      console.error('Failed to copy node:', err);
    }
  };

  const pasteNode = () => {
    console.log('[DEBUG Toolbar Paste] memoryNodeTreeClipboard:', memoryNodeTreeClipboard?.rootNodeId);
    const copiedTree = memoryNodeTreeClipboard;
    if (!copiedTree || !nodeExists || isLocked) {
      console.log('[DEBUG Toolbar Paste] aborted', { copiedTree: !!copiedTree, nodeExists, isLocked });
      return;
    }

    try {
      const clonedTree = cloneNodeTreeWithFreshIds(copiedTree) as any;
      const targetParent = canMoveIn ? id : parentId;
      const targetIndex = canMoveIn ? siblingCount : nodeIndex + 1;
      console.log('[DEBUG Toolbar Paste] targetParent:', targetParent, 'targetIndex:', targetIndex);
      if (!targetParent) return;
      actions.addNodeTree(clonedTree, targetParent, targetIndex);
      console.log('[DEBUG Toolbar Paste] SUCCESS');
      closeMenu();
    } catch (err) {
      console.error('Failed to paste node:', err);
    }
  };

  const pasteStyle = () => {
    const styleProps = readClipboard().styleProps;
    if (!styleProps || !nodeExists || isLocked) return;

    try {
      actions.setProp(id, (props: Record<string, unknown>) => {
        Object.entries(styleProps).forEach(([key, value]) => {
          props[key] = value;
        });
      });
      closeMenu();
    } catch (err) {
      console.error('Failed to paste style:', err);
    }
  };

  const resetStyle = () => {
    if (!nodeExists || isLocked) return;
    const resetProps = extractStyleProps(defaultProps);
    const currentStyleKeys = Object.keys(extractStyleProps(currentProps));
    const keysToReset = Array.from(new Set([...currentStyleKeys, ...Object.keys(resetProps)]));

    try {
      actions.setProp(id, (props: Record<string, unknown>) => {
        keysToReset.forEach((key) => {
          if (key in resetProps) {
            props[key] = resetProps[key];
          } else if (key in STANDARD_DEFAULTS) {
            props[key] = STANDARD_DEFAULTS[key];
          } else {
            delete props[key];
          }
        });
      });
      closeMenu();
    } catch (err) {
      console.error('Failed to reset style:', err);
    }
  };

  const deleteNode = () => {
    if (!isDeletable || isLocked || !nodeExists) return;
    actions.selectNode(undefined);
    closeMenu();
    setTimeout(() => {
      try {
        actions.delete(id);
      } catch (err) {
        console.error('Failed to delete node:', err);
      }
    }, 0);
  };

  const moveNode = (direction: 'up' | 'down') => {
    if (isLocked || !parentId || !nodeExists || isLinkedNode) return;
    const targetIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 2;
    if (direction === 'up' && nodeIndex <= 0) return;
    if (direction === 'down' && nodeIndex >= siblingCount - 1) return;

    try {
      actions.move(id, parentId, targetIndex);
      closeMenu();
    } catch (err) {
      console.error(`Failed to move node ${direction}:`, err);
    }
  };

  const toggleLock = () => {
    if (!nodeExists) return;
    actions.setCustom(id, (custom) => {
      custom.locked = !isLocked;
    });
    closeMenu();
  };

  const openLayers = () => {
    if (nodeExists) actions.selectNode(id);
    window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'layers' }));
    closeMenu();
  };

  const selectForEdit = () => {
    if (!nodeExists) return;
    actions.selectNode(id);
    closeMenu();
  };

  const redistributeColumnWidths = (rowId: string) => {
    try {
      const rowNode = query.node(rowId).get();
      const childIds = rowNode.data.nodes || [];
      const columns = childIds.filter((childId) => {
        const childNode = query.node(childId).get();
        const childName = (childNode.data.type as any)?.resolvedName || childNode.data.name;
        return childName === 'Container';
      });

      if (columns.length > 0) {
        const equalPercentage = (100 / columns.length).toFixed(1) + '%';
        columns.forEach((colId) => {
          actions.setProp(colId, (props: any) => {
            props.widthMode = 'custom';
            props.customWidth = equalPercentage;
            props.width = equalPercentage;
          });
        });
      }
    } catch (err) {
      console.error('Failed to redistribute column widths:', err);
    }
  };

  const addContainer = () => {
    if (isLocked || !nodeExists) return;

    try {
      const ResolvedContainer = resolver.Container || resolver['Container'];
      if (!ResolvedContainer) return;

      // Add a new Container child nested inside the current container, keeping layout direction.
      const newContainerNode = React.createElement(Element, { 
        is: ResolvedContainer, 
        canvas: true,
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        paddingRight: '10px',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        contentWidth: 'inherit',
      } as any);
      
      const newContainerTree = query.parseReactElement(newContainerNode).toNodeTree();
      actions.addNodeTree(newContainerTree, id);
      
      closeMenu();
    } catch (err) {
      console.error('Failed to add container:', err);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Đóng menu ngữ cảnh"
        className="fixed inset-0 z-[2147483646] cursor-default bg-transparent"
        onClick={closeMenu}
        onContextMenu={(event) => {
          event.preventDefault();
          closeMenu();
        }}
      />
      <div
        data-context-menu="true"
        className="fixed z-[2147483647] w-[226px] overflow-hidden rounded-md border border-slate-200 bg-white py-1.5 font-sans shadow-2xl animate-fade-in"
        style={{ left: position.left, top: position.top }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <MenuItem icon={<Pencil size={13} />} label={`Sửa ${displayName}`} onClick={selectForEdit} disabled={isLocked} />
        {(resolvedName === 'Container' || nodeName === 'Container') && (
          <MenuItem icon={<Plus size={13} />} label="Thêm vùng chứa mới" onClick={addContainer} disabled={isLocked} />
        )}
        <MenuItem icon={<Copy size={13} />} label="Tạo bản sao" shortcut="⌘+D" onClick={duplicateNode} disabled={isLocked || !parentId || isLinkedNode} />
        <div className="my-1 border-t border-slate-100" />
        <MenuItem icon={<ArrowUp size={13} />} label="Di chuyển lên" onClick={() => moveNode('up')} disabled={isLocked || nodeIndex <= 0 || isLinkedNode} />
        <MenuItem icon={<ArrowDown size={13} />} label="Di chuyển xuống" onClick={() => moveNode('down')} disabled={isLocked || nodeIndex >= siblingCount - 1 || isLinkedNode} />
        <div className="my-1 border-t border-slate-100" />
        <MenuItem icon={<Clipboard size={13} />} label="Sao chép" shortcut="⌘+C" onClick={copyNode} disabled={isLinkedNode} />
        <MenuItem label="Dán" shortcut="⌘+V" onClick={pasteNode} disabled={isLocked || !hasCopiedNode} />
        <MenuItem icon={<Paintbrush size={13} />} label="Dán kiểu hiển thị" shortcut="⌥⇧V" onClick={pasteStyle} disabled={isLocked || !hasCopiedStyle} />
        <MenuItem icon={<RotateCcw size={13} />} label="Đặt lại kiểu hiển thị" onClick={resetStyle} disabled={isLocked} />
        <div className="my-1 border-t border-slate-100" />
        <MenuItem icon={isLocked ? <ShieldOff size={13} /> : <Lock size={13} />} label={isLocked ? 'Mở khóa' : 'Khóa'} onClick={toggleLock} />
        <MenuItem icon={<Layers size={13} />} label="Cấu trúc nội dung" shortcut="⌘+I" onClick={openLayers} />
        <div className="my-1 border-t border-slate-100" />
        <MenuItem icon={<Trash2 size={13} />} label="Xóa" shortcut="⌫" onClick={deleteNode} disabled={!isDeletable || isLocked} />
      </div>
    </>,
    document.body
  );
}
