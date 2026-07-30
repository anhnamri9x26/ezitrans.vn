"use client";

import React, { useState, useEffect } from 'react';
import { useEditor } from '@craftjs/core';
import { Layers as LayersTree, useLayer } from '@craftjs/layers';
import FloatingToolbar from '../components/FloatingToolbar';
import {
  Type,
  Image as ImageIcon,
  Play,
  ChevronDown,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Heading,
  StretchHorizontal,
  Search,
  X,
  CreditCard,
  Minus,
  LayoutGrid,
  Columns,
  Newspaper,
  Star,
  MousePointerClick,
  Timer,
  FormInput,
  Code,
  Box,
  List,
  Menu as MenuIcon,
  Activity,
  Share2,
  Folder,
  GalleryHorizontalEnd,
} from 'lucide-react';

const repairMojibakeText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  if (!/[ÃÄÂÆáºá»]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

const NavigatorContext = React.createContext<{
  searchTerm: string;
  selectedId: string | null;
}>({
  searchTerm: '',
  selectedId: null,
});

const CustomLayer = ({ children }: { children?: React.ReactNode }) => {
  try {
    const context = React.useContext(NavigatorContext);
    const searchTerm = context?.searchTerm || '';
    const activeSelectedId = context?.selectedId || null;

    const {
      id,
      depth,
      expanded,
      children: childIds,
      connectors: { layer, layerHeader },
      actions: { toggleLayer, setExpandedState },
    } = useLayer((layer) => ({
      expanded: layer.expanded,
    }));

    const { nodeExists, isSelected, isHidden, displayName, nodes, resolvedName, parentId } = useEditor((state) => {
      const node = state.nodes[id];
      const isSelected = state.events.selected.has(id);
      const isHidden = node?.data.hidden || false;
      
      const rawDisplayName = node && node.data.custom?.displayName 
        ? node.data.custom.displayName 
        : node?.data.displayName || node?.data.name || 'Thành phần';
      const displayName = repairMojibakeText(rawDisplayName);

      const resolvedName = (node?.data.type as any)?.resolvedName || node?.data.name || '';
      const parentId = node?.data.parent || null;

      return {
        nodeExists: Boolean(node),
        isSelected,
        isHidden,
        displayName,
        nodes: state.nodes,
        resolvedName,
        parentId,
      };
    });

    const hasChildren = childIds && childIds.length > 0;

    // Compute matchesSearch dynamically
    const normalizedSearch = (searchTerm || '').trim().toLowerCase();
    const node = nodes?.[id];
    const nodeMatches = !normalizedSearch || (displayName && displayName.toLowerCase().includes(normalizedSearch));
    let descendantMatches = false;
    if (normalizedSearch && node && nodes) {
      const stack = [...(node.data.nodes || [])];
      while (stack.length > 0) {
        const childId = stack.pop();
        if (!childId) continue;
        const childNode = nodes[childId];
        if (!childNode) continue;
        const childName = repairMojibakeText(childNode.data.custom?.displayName || childNode.data.displayName || childNode.data.name || '').toLowerCase();
        if (childName.includes(normalizedSearch)) {
          descendantMatches = true;
          break;
        }
        stack.push(...(childNode.data.nodes || []));
      }
    }
    const matchesSearch = nodeExists && (nodeMatches || descendantMatches);

    // Compute hasSelectedDescendant dynamically using the parent-provided selected id.
    // The parent value changes by prop, so collapsed ancestor rows re-render reliably.
    let hasSelectedDescendant = false;
    if (activeSelectedId && activeSelectedId !== id && nodes) {
      let current = nodes[activeSelectedId];
      while (current && current.data.parent) {
        if (current.data.parent === id) {
          hasSelectedDescendant = true;
          break;
        }
        current = nodes[current.data.parent];
      }
    }

    useEffect(() => {
      if (hasSelectedDescendant && !expanded) {
        setExpandedState(true);
      }
    }, [hasSelectedDescendant, expanded, setExpandedState]);

    useEffect(() => {
      if (searchTerm.trim() && matchesSearch && hasChildren && !expanded) {
        setExpandedState(true);
      }
    }, [searchTerm, matchesSearch, hasChildren, expanded, setExpandedState]);

    // Force ROOT to always be expanded since its toggle button is hidden
    useEffect(() => {
      if (id === 'ROOT' && !expanded) {
        setExpandedState(true);
      }
    }, [id, expanded, setExpandedState]);

    const { actions: editorActions } = useEditor();

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const handleCloseContextMenus = (event: Event) => {
        const activeId = (event as CustomEvent<string>).detail;
        if (activeId !== id) setContextMenu(null);
      };

      window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
      return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
    }, [id]);

    if (!nodeExists || !matchesSearch) return null;

    // Determine container hierarchy level
    const isContainer = resolvedName === 'Container';
    const isSection = isContainer && parentId === 'ROOT'; // direct child of ROOT = Section
    const isInnerContainer = isContainer && parentId !== 'ROOT'; // nested = Inner Container

    // Compute contextual display label for containers
    const contextualDisplayName = (() => {
      if (!isContainer) return displayName;
      if (isSection) return 'Section';
      return 'Container';
    })();

    const getComponentIcon = (name: string) => {
      // For containers, use hierarchy-aware icons
      if (isSection) {
        const cls = isSelected ? 'text-indigo-600' : 'text-indigo-400';
        return <LayoutGrid size={14} className={cls} />;
      }
      if (isInnerContainer) {
        const cls = isSelected ? 'text-sky-600' : 'text-sky-400';
        return <Columns size={14} className={cls} />;
      }

      const iconClass = isSelected ? "text-brand-600" : "text-slate-400";
      switch (name) {
        case 'Khung bố cục':
        case 'Vùng chứa':
          return <CreditCard size={14} className={iconClass} />;
        case 'Tiêu đề':
          return <Heading size={14} className={iconClass} />;
        case 'Văn bản':
          return <Type size={14} className={iconClass} />;
        case 'Hình ảnh':
          return <ImageIcon size={14} className={iconClass} />;
        case 'Nút bấm':
          return <MousePointerClick size={14} className={iconClass} />;
        case 'Đường phân cách':
          return <StretchHorizontal size={14} className={iconClass} />;
        case 'Video':
          return <Play size={14} className={iconClass} />;
        case 'Danh sách bài viết':
          return <Newspaper size={14} className={iconClass} />;
        case 'Biểu tượng':
        case 'Hộp Icon':
        case 'Hộp hình ảnh':
          return <Box size={14} className={iconClass} />;
        case 'Băng chuyền hình ảnh':
          return <GalleryHorizontalEnd size={14} className={iconClass} />;
        case 'Sập mở (FAQ)':
        case 'Danh sách':
          return <List size={14} className={iconClass} />;
        case 'Bộ đếm':
          return <Timer size={14} className={iconClass} />;
        case 'Form':
          return <FormInput size={14} className={iconClass} />;
        case 'Mã HTML':
          return <Code size={14} className={iconClass} />;
        case 'Lưới':
          return <LayoutGrid size={14} className={iconClass} />;
        case 'Menu':
          return <MenuIcon size={14} className={iconClass} />;
        case 'Thanh tiến trình':
          return <Activity size={14} className={iconClass} />;
        case 'Icon Mạng Xã Hội':
          return <Share2 size={14} className={iconClass} />;
        case 'Tabs':
          return <Folder size={14} className={iconClass} />;
        case 'Khoảng trống':
          return <Minus size={14} className={iconClass} />;
        default:
      }
    };

    if (id === 'ROOT') {
      return (
        <div className="craft-layer-root w-full">
          {hasChildren && children && (
            <div className="flex flex-col craft-layer-children-container">
              {children}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        ref={(ref) => {
          if (ref) layer(ref);
        }}
        className={`craft-layer-node flex flex-col ${isHidden ? 'opacity-40' : ''}`}
      >
        <div
          ref={(ref) => {
            if (ref) layerHeader(ref);
          }}
          className={`craft-layer-row group/row flex w-full items-center gap-1.5 py-[5px] pr-2 cursor-pointer select-none transition-colors ${
            isSelected
              ? isSection
                ? 'bg-indigo-50 text-indigo-700'
                : isInnerContainer
                  ? 'bg-sky-50 text-sky-700'
                  : 'bg-brand-50 text-brand-700'
              : 'hover:bg-slate-50 text-slate-700'
          } ${
            isSection ? 'border-l-2 border-l-indigo-400' : isInnerContainer ? 'border-l-2 border-l-sky-300' : ''
          }`}
          style={{
            paddingLeft: `${Math.max(0, depth - 1) * 16 + 8}px`,
          }}
          onContextMenu={(e) => {
            if (id === 'ROOT') return;
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
            editorActions.selectNode(id);
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* Expand/Collapse toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayer();
              }}
              className="flex items-center justify-center w-4 h-4 rounded transition-colors text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
            >
              {expanded ? <ChevronDown size={12} strokeWidth={2.5} /> : <ChevronRight size={12} strokeWidth={2.5} />}
            </button>
          ) : (
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              <Minus size={8} className="text-slate-300" />
            </span>
          )}

          {/* Icon */}
          <span className="flex items-center justify-center shrink-0">
            {getComponentIcon(contextualDisplayName)}
          </span>

          {/* Name + Type Label */}
          <span className={`flex-1 truncate text-[12px] font-medium leading-tight ${
            isSelected
              ? isSection ? 'text-indigo-700 font-semibold' : isInnerContainer ? 'text-sky-700 font-semibold' : 'text-brand-700 font-semibold'
              : 'text-slate-600'
          }`}>
            {contextualDisplayName}
          </span>
          {/* Subtle type tag for containers */}
          {isSection && (
            <span className="shrink-0 text-[8px] font-black tracking-wider uppercase bg-indigo-100 text-indigo-500 px-1.5 py-0.5 rounded-full leading-none">SEC</span>
          )}
          {isInnerContainer && (
            <span className="shrink-0 text-[8px] font-black tracking-wider uppercase bg-sky-100 text-sky-500 px-1.5 py-0.5 rounded-full leading-none">IN</span>
          )}

          {/* Actions - visible on hover */}
          <div className="craft-layer-actions ml-auto flex shrink-0 items-center gap-0 opacity-0 transition-opacity group-hover/row:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!nodeExists) return;
                editorActions.setHidden(id, !isHidden);
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isHidden ? 'text-slate-500 opacity-100' : 'text-slate-300 hover:text-slate-500'
              }`}
              title={isHidden ? 'Hiện thành phần' : 'Ẩn thành phần'}
            >
              {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </div>

        {contextMenu && (
          <FloatingToolbar
            id={id}
            displayName={repairMojibakeText(displayName)}
            x={contextMenu.x}
            y={contextMenu.y}
            isOpen={Boolean(contextMenu)}
            onClose={() => setContextMenu(null)}
          />
        )}

        {hasChildren && children && (
          <div className={`flex flex-col craft-layer-children-container ${expanded ? '' : 'hidden'}`}>
            {children}
          </div>
        )}
      </div>
    );
  } catch (err: any) {
    console.error("CustomLayer rendering error:", err);
    return (
      <div className="p-2 text-red-500 bg-red-50 border border-red-200 text-[11px] rounded m-1">
        Lỗi: {err?.message || String(err)}
      </div>
    );
  }
};

interface NavigatorProps {
  onClose: () => void;
  selectedId?: string | null;
}

export default function Navigator({ onClose, selectedId }: NavigatorProps) {
  const [layerSearch, setLayerSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => {
          const input = document.getElementById('navigator-search-input');
          if (input) input.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <NavigatorContext.Provider value={{ searchTerm: layerSearch, selectedId: selectedId || null }}>
      <div className="w-full h-full flex flex-col bg-white font-sans overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-700">Cấu trúc nội dung</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setLayerSearch('');
              }}
              title="Tìm kiếm (Ctrl+/)"
              className={`p-1 rounded transition-colors cursor-pointer ${
                showSearch ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Search size={13} />
            </button>
            <button
              onClick={onClose}
              title="Đóng Navigator"
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Search (collapsible) */}
        {showSearch && (
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
              <Search size={12} className="shrink-0 text-slate-400" />
              <input
                id="navigator-search-input"
                autoFocus
                value={layerSearch}
                onChange={(e) => setLayerSearch(e.target.value)}
                placeholder="Tìm layer..."
                className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
              />
              {layerSearch && (
                <button
                  onClick={() => setLayerSearch('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Layer Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="py-1">
            <LayersTree
              key={`navigator-tree-${selectedId || 'none'}`}
              renderLayer={(props: { children?: React.ReactNode }) => (
                <CustomLayer {...props} />
              )}
              expandRootOnLoad
            />
          </div>
        </div>
      </div>
    </NavigatorContext.Provider>
  );
}
