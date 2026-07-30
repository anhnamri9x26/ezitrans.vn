"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useEditor } from '@craftjs/core';
import { Palette, Image as ImageIcon, Settings, Trash2, Link2, Unlink, Layout, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Monitor, Tablet, Smartphone, LayoutGrid, Globe, RotateCcw, Database, Wrench, X, ChevronDown, GripVertical } from 'lucide-react';
import { DynamicInput } from './shared/DynamicInput';
import type { RightSidebarProps } from './shared/types';
import { DYNAMIC_TAGS, GOOGLE_FONTS, SPECIAL_CHARS, SPACING_UNITS, TYPOGRAPHY_UNITS } from './shared/constants';
import { buildGoogleFontsHref, getDynamicFieldLabel, parseBoxShadow, parseCssFilters, parseSpacing, parseTextShadow, parseTextStroke, serializeBoxShadow, serializeCssFilters, splitSizeValue } from './shared/utils';
import * as Lucide from 'lucide-react';
import { usePageSettings } from '../../PageSettingsContext';
import dynamic from 'next/dynamic';
import { HexAlphaColorPicker, RgbaStringColorPicker, HslaStringColorPicker } from 'react-colorful';

const ColorPickerPopoverContent = ({ 
  currentValue, 
  fallback, 
  handleCommit, 
  onClose,
  websiteSettings
}: any) => {
  const [format, setFormat] = React.useState<'HEXA'|'RGBA'|'HSLA'>('HEXA');

  const openEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng lấy màu.');
      return;
    }
    const eyeDropper = new (window as any).EyeDropper();
    try {
      const result = await eyeDropper.open();
      handleCommit(result.sRGBHex);
    } catch (e) {
      // User canceled
    }
  };

  const getValidColor = (val: string) => {
    let resolved = val;
    if (val && val.startsWith('var(--site-color-')) {
      const token = val.replace(/var\(|\)/g, '');
      const colorMap: Record<string, string> = {
        '--site-color-primary': websiteSettings?.colors?.primary || '#3b82f6',
        '--site-color-secondary': websiteSettings?.colors?.secondary || '#6b7280',
        '--site-color-accent': websiteSettings?.colors?.accent || '#f59e0b',
        '--site-color-success': websiteSettings?.colors?.success || '#10b981',
        '--site-color-warning': websiteSettings?.colors?.warning || '#f59e0b',
        '--site-color-danger': websiteSettings?.colors?.danger || '#ef4444',
        '--site-color-background': websiteSettings?.colors?.background || '#ffffff',
        '--site-color-text': websiteSettings?.colors?.text || '#1f2937',
      };
      resolved = colorMap[token] || '#ffffff';
    }
    
    if (!resolved || resolved === 'transparent') {
      return format === 'HEXA' ? '#ffffff' : (format === 'RGBA' ? 'rgba(255,255,255,1)' : 'hsla(0,0%,100%,1)');
    }
    return resolved;
  };

  return (
    <div className="color-picker-popover-container absolute right-0 top-full mt-1 z-[9999] w-[240px] rounded border border-slate-200 bg-white shadow-xl animate-fade-in" onClick={e => e.stopPropagation()}>
      <style>{`
        .custom-color-picker .react-colorful { width: 100%; height: 160px; }
        .custom-color-picker .react-colorful__saturation { border-radius: 4px 4px 0 0; border-bottom: none; }
        .custom-color-picker .react-colorful__hue, .custom-color-picker .react-colorful__alpha { height: 10px; border-radius: 0; }
        .custom-color-picker .react-colorful__alpha { border-radius: 0 0 4px 4px; }
        .custom-color-picker .react-colorful__pointer { width: 14px; height: 14px; }
      `}</style>
      <div className="flex items-center justify-between p-2 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-700">Bộ chọn màu</span>
        <div className="flex items-center gap-1">
          <button title="Làm mới" onClick={() => handleCommit('')} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
            <Lucide.RotateCcw size={12} />
          </button>
          <button title="Tạo màu toàn trang mới" onClick={() => alert('Chức năng thêm màu đang phát triển')} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
            <Lucide.Plus size={14} />
          </button>
          <button title="Màu hệ thống" onClick={() => alert('Chức năng quản lý màu hệ thống đang phát triển')} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
            <Lucide.Database size={12} />
          </button>
          <button title="Bộ lấy mẫu màu" onClick={openEyeDropper} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
            <Lucide.Pipette size={12} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="mb-3 custom-color-picker rounded-md overflow-hidden border border-slate-200/50 shadow-sm">
          {format === 'HEXA' && <HexAlphaColorPicker color={getValidColor(currentValue)} onChange={handleCommit} />}
          {format === 'RGBA' && <RgbaStringColorPicker color={getValidColor(currentValue)} onChange={handleCommit} />}
          {format === 'HSLA' && <HslaStringColorPicker color={getValidColor(currentValue)} onChange={handleCommit} />}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input 
            type="text" 
            value={currentValue} 
            onChange={e => handleCommit(e.target.value)} 
            placeholder={fallback}
            className="flex-1 h-7 border border-slate-200 rounded px-2 text-[10px] font-mono text-slate-700 outline-none focus:border-brand-500 w-0" 
          />
          <div className="flex gap-1 text-[9px] font-bold text-slate-400">
            <button className={format === 'HEXA' ? 'text-slate-800' : 'hover:text-slate-600'} onClick={() => setFormat('HEXA')}>HEXA</button>
            <button className={format === 'RGBA' ? 'text-slate-800' : 'hover:text-slate-600'} onClick={() => setFormat('RGBA')}>RGBA</button>
            <button className={format === 'HSLA' ? 'text-slate-800' : 'hover:text-slate-600'} onClick={() => setFormat('HSLA')}>HSLA</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const Component = React.forwardRef((props: any, ref) => <RQ ref={ref} {...props} />);
    Component.displayName = 'ReactQuill';
    return Component;
  },
  { ssr: false }
) as any;
import 'react-quill-new/dist/quill.snow.css';
import { getLucideReactComponent } from '../../utils/iconRegistry';
import { AdvancedPanel } from './panels/AdvancedPanel';
import { ContentPanel } from './panels/ContentPanel';
import { StylePanel } from './panels/StylePanel';
import { createResponsiveProps, isResponsiveProp, setResponsiveValue } from '../../utils/styleResolver';





export default function RightSidebar({ onOpenMedia, onOpenIcon, onBackToWidgets, device = 'desktop', setDevice }: RightSidebarProps) {
  const { selected, actions, query, node } = useEditor((state, query) => {
    const [selectedId] = state.events.selected;
    const node = selectedId ? state.nodes[selectedId] : null;
    let resolvedDisplayName = '';
    if (node && node.data.name) {
      const component = state.options.resolver[node.data.name];
      if (component && (component as any).craft?.displayName) {
        resolvedDisplayName = (component as any).craft.displayName;
      }
    }
    return {
      query,
      node,
      selected: {
        id: selectedId,
        name: resolvedDisplayName || node?.data.displayName || node?.data.name || '',
        props: node?.data.props || {},
        isDeletable: selectedId ? query.node(selectedId).isDeletable() : false,
      },
    };
  });

  const getDefaultProp = (key: string): string => {
    const name = node ? ((node.data.type as any).resolvedName || node.data.name) : '';
    if ((name === 'Container' || name === 'GridContainer') && key.startsWith('padding')) {
      const isTopLevel = node?.data.parent === 'ROOT';
      if (isTopLevel && (key === 'paddingTop' || key === 'paddingBottom')) {
        return '60px'; // Approximate section spacing placeholder
      }
      return '10px';
    }

    if (!node || !node.data.type) return '';
    const craft = (node.data.type as any).craft;
    if (craft && craft.props) {
      const val = craft.props[key];
      return val !== undefined && val !== null ? String(val) : '';
    }
    return '';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const stepperTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepperIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeStepIdRef = useRef<string | null>(null);
  const activeStepActionRef = useRef<(() => void) | null>(null);

  const registerStepper = (id: string, action: () => void) => {
    if (activeStepIdRef.current === id) {
      activeStepActionRef.current = action;
    }
    return null;
  };

  const startStepping = (id: string, action: () => void) => {
    stopStepping();
    activeStepIdRef.current = id;
    activeStepActionRef.current = action;
    action();
    stepperTimeoutRef.current = setTimeout(() => {
      stepperIntervalRef.current = setInterval(() => {
        if (activeStepActionRef.current) {
          activeStepActionRef.current();
        }
      }, 70);
    }, 400);
  };

  const stopStepping = () => {
    if (stepperTimeoutRef.current) clearTimeout(stepperTimeoutRef.current);
    if (stepperIntervalRef.current) clearInterval(stepperIntervalRef.current);
    stepperTimeoutRef.current = null;
    stepperIntervalRef.current = null;
    activeStepIdRef.current = null;
    activeStepActionRef.current = null;
  };

  useEffect(() => {
    return stopStepping;
  }, []);

  type SidebarTab = 'content' | 'style' | 'advanced';

  const [activeTabByNodeId, setActiveTabByNodeId] = useState<Record<string, SidebarTab>>({});
  const [linkedSpacing, setLinkedSpacing] = useState<{ [key: string]: boolean }>({
    margin: false,
    padding: true,
    border: true,
    gap: true,
    borderRadius: true,
    borderRadiusHover: true,
    badgeBorderWidth: true,
    badgeBorderRadius: true,
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    container: true,
    items: true,
    additional: false,
  });
  const [openStylePopover, setOpenStylePopover] = useState<string | null>(null);
  const [openSpacingUnitPopover, setOpenSpacingUnitPopover] = useState<string | null>(null);
  const [openUnitPopoverKey, setOpenUnitPopoverKey] = useState<string | null>(null);
  const [openDeviceDropdownKey, setOpenDeviceDropdownKey] = useState<string | null>(null);

  // Refs & coords for fixed-position popovers (escaping overflow:auto)
  const [colorPickerCoords, setColorPickerCoords] = useState<{top:number;left:number}>({top:0,left:0});
  const [deviceDropdownCoords, setDeviceDropdownCoords] = useState<{top:number;left:number}>({top:0,left:0});
  const [popoverPanelCoords, setPopoverPanelCoords] = useState<{top:number;left:number}>({top:0,left:0});

  const [textHoverTabByNodeId, setTextHoverTabByNodeId] = useState<Record<string, 'normal' | 'hover'>>({});
  const [activeBgTab, setActiveBgTab] = useState<'normal' | 'hover'>('normal');
  const [activeBorderTab, setActiveBorderTab] = useState<'normal' | 'hover'>('normal');
  const [activeIconListIconHoverTab, setActiveIconListIconHoverTab] = useState<'normal' | 'hover'>('normal');
  const [accordionItemTab, setAccordionItemTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [accordionTitleTab, setAccordionTitleTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [accordionIconTab, setAccordionIconTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [activeIconListTextHoverTab, setActiveIconListTextHoverTab] = useState<'normal' | 'hover'>('normal');
  const [expandedIconListItemIdx, setExpandedIconListItemIdx] = useState<number | null>(0);
  const [draggedIconListItemIdx, setDraggedIconListItemIdx] = useState<number | null>(null);
  const [expandedAccordionItemIdx, setExpandedAccordionItemIdx] = useState<number | null>(0);
  const [tabsItemTab, setTabsItemTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [tabsTitleTab, setTabsTitleTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [tabsIconTab, setTabsIconTab] = useState<'normal' | 'hover' | 'active'>('normal');
  const [expandedTabsItemIdx, setExpandedTabsItemIdx] = useState<number | null>(0);
  const [draggedTabsItemIdx, setDraggedTabsItemIdx] = useState<number | null>(null);
  const [draggedAccordionItemIdx, setDraggedAccordionItemIdx] = useState<number | null>(null);
  const [imageStyleTab, setImageStyleTab] = useState<'normal' | 'hover'>('normal');
  const [showImageDbDropdown, setShowImageDbDropdown] = useState(false);

  const activeTab: SidebarTab = selected.id ? (activeTabByNodeId[selected.id] || 'content') : 'content';
  const activeTextHoverTab = selected.id ? (textHoverTabByNodeId[selected.id] || 'normal') : 'normal';
  const [activeIconHoverTabByNodeId, setActiveIconHoverTabByNodeId] = useState<Record<string, 'normal' | 'hover'>>({});
  const activeIconHoverTab = selected.id ? (activeIconHoverTabByNodeId[selected.id] || 'normal') : 'normal';
  
  const { websiteSettings, device: activeDevice = 'desktop' } = usePageSettings();
  const [activeColorPopoverKey, setActiveColorPopoverKey] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1. Color Picker Click-Away
      if (activeColorPopoverKey) {
        if (!target.closest('.color-picker-popover-container') && !target.closest('.color-picker-trigger')) {
          setActiveColorPopoverKey(null);
        }
      }

      // 2. Spacing Unit Click-Away
      if (openSpacingUnitPopover) {
        if (!target.closest('.spacing-unit-popover-container') && !target.closest('.spacing-unit-trigger')) {
          setOpenSpacingUnitPopover(null);
        }
      }

      // 3. Unit Click-Away
      if (openUnitPopoverKey) {
        if (!target.closest('.unit-popover-container') && !target.closest('.unit-trigger')) {
          setOpenUnitPopoverKey(null);
        }
      }

      // 4. Image DB Dropdown Click-Away
      if (showImageDbDropdown) {
        if (!target.closest('.image-db-popover-container') && !target.closest('.image-db-trigger')) {
          setShowImageDbDropdown(false);
        }
      }

      // 5. Device Dropdown Click-Away (portaled)
      if (openDeviceDropdownKey) {
        if (!target.closest('.device-dropdown-container') && !target.closest('.device-dropdown-trigger')) {
          setOpenDeviceDropdownKey(null);
        }
      }

      // 6. Style Popover Panel Click-Away (portaled)
      if (openStylePopover) {
        if (!target.closest('.popover-panel-container') && !target.closest('.popover-toggle-button')) {
          setOpenStylePopover(null);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeColorPopoverKey, openSpacingUnitPopover, openUnitPopoverKey, showImageDbDropdown, openDeviceDropdownKey, openStylePopover]);

  const [textEditorMode, setTextEditorMode] = useState<'visual' | 'html'>('visual');
  const [showSecondRow, setShowSecondRow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pasteAsPlainText, setPasteAsPlainText] = useState(false);
  const [showSpecialCharModal, setShowSpecialCharModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTextBlockDynamicDropdown, setShowTextBlockDynamicDropdown] = useState(false);
  const [showTextBlockAdvanced, setShowTextBlockAdvanced] = useState(false);
  const [showDynamicTags, setShowDynamicTags] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openStylePopover) return;
      const target = event.target as HTMLElement;
      if (target.closest('.popover-panel-container') || target.closest('.popover-toggle-button')) {
        return;
      }
      setOpenStylePopover(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenStylePopover(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openStylePopover]);

  const handleInsertText = (text: string) => {
    if (textEditorMode === 'visual') {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        if (range) {
          quill.insertText(range.index, text);
          quill.setSelection(range.index + text.length);
        }
      }
    } else {
      const textarea = document.querySelector('textarea[placeholder="Nhập mã HTML..."]') as HTMLTextAreaElement | null;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
        updateProp('text', newVal);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
      }
    }
  };

  const handleInsertHR = () => {
    if (textEditorMode === 'visual') {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        if (range) {
          try {
            quill.insertEmbed(range.index, 'divider', true);
            quill.setSelection(range.index + 1);
          } catch (e) {
            quill.clipboard.dangerouslyPasteHTML(range.index, '<hr/>');
            quill.setSelection(range.index + 1);
          }
        }
      }
    } else {
      const textarea = document.querySelector('textarea[placeholder="Nhập mã HTML..."]') as HTMLTextAreaElement | null;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const newVal = currentVal.substring(0, start) + '\n<hr />\n' + currentVal.substring(end);
        updateProp('text', newVal);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + 8;
        }, 0);
      }
    }
  };

  const togglePasteAsPlainText = () => {
    setPasteAsPlainText(prev => !prev);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (pasteAsPlainText) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (textEditorMode === 'visual') {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          if (range) {
            quill.insertText(range.index, text);
            quill.setSelection(range.index + text.length);
          }
        }
      } else {
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
        updateProp('text', newVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
      }
    }
  };

  const handleInsertDynamicTag = (tag: string) => {
    handleInsertText(tag);
    setShowDynamicTags(false);
  };

  const quillModulesConfig = useMemo(() => ({
    toolbar: {
      container: '#quill-sidebar-toolbar',
      handlers: {
        undo: function(this: any) {
          this.quill.history.undo();
        },
        redo: function(this: any) {
          this.quill.history.redo();
        }
      }
    }
  }), []);



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

  const handleTabChange = (tab: SidebarTab) => {
    if (selected.id) {
      setActiveTabByNodeId(prev => ({ ...prev, [selected.id]: tab }));
    }
  };

  if (!selected.id || !node) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-md h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-sans">
        <Settings size={36} className="opacity-30 mb-3 rotate-12" />
        <p className="text-xs font-semibold">Chọn một thành phần trên trang</p>
        <p className="text-[10px] opacity-80 mt-1 max-w-[200px]">Nhấp chuột vào bất kỳ khối nào để điều chỉnh các thuộc tính, khoảng cách và màu sắc.</p>
      </div>
    );
  }

  const { name, props: rawProps, isDeletable } = selected;

  const props = createResponsiveProps(rawProps, device);

  const isOverriddenForDevice = (key: string | string[]) => {
    if (device === 'desktop') return false;
    const keysToCheck = Array.isArray(key) ? key : [key];
    return keysToCheck.some(k => Boolean(rawProps[`${k}_${device}`] && rawProps[`${k}_${device}`] !== ''));
  };

  const renderResponsiveLabel = (label: string | React.ReactNode, id: string | string[]) => {
    const DeviceIcon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
    const isOverridden = isOverriddenForDevice(id);
    const popoverId = Array.isArray(id) ? id[0] : id;

    return (
      <div className="flex w-full items-center gap-1 relative min-w-0 align-middle">
        <span className="flex-1 text-[11px] font-medium text-slate-600 leading-tight whitespace-normal break-words">{label}</span>
        <button
          type="button"
          className={`device-dropdown-trigger shrink-0 h-4 w-4 rounded-[4px] flex items-center justify-center transition-colors hover:bg-slate-100 ${isOverridden ? 'text-brand-500 bg-brand-50 ring-1 ring-brand-100' : 'text-slate-400 hover:text-slate-600'}`}
          title="Thiết bị hiển thị"
          onClick={(e) => {
            e.stopPropagation();
            setOpenDeviceDropdownKey(openDeviceDropdownKey === popoverId ? null : popoverId);
          }}
        >
          <DeviceIcon size={10} strokeWidth={2.25} />
        </button>
        {openDeviceDropdownKey === popoverId && (
          <div
            className="device-dropdown-container absolute top-full left-0 mt-1 flex flex-col bg-white rounded-lg shadow-xl overflow-hidden py-1 border border-slate-200 min-w-[138px] animate-fade-in"
            style={{ zIndex: 99999 }}
          >
            <button
              type="button"
              onClick={() => { setDevice?.('desktop'); setOpenDeviceDropdownKey(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold transition-colors ${device === 'desktop' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Monitor size={12} /> Máy tính
            </button>
            <button
              type="button"
              onClick={() => { setDevice?.('tablet'); setOpenDeviceDropdownKey(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold transition-colors ${device === 'tablet' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Tablet size={12} /> Máy tính bảng
            </button>
            <button
              type="button"
              onClick={() => { setDevice?.('mobile'); setOpenDeviceDropdownKey(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold transition-colors ${device === 'mobile' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Smartphone size={12} /> Điện thoại
            </button>
          </div>
        )}
      </div>
    );
  };

  const updateProp = (key: string, value: unknown) => {
    actions.setProp(selected.id, (nodeProps) => {
      setResponsiveValue(nodeProps, key, value, device);
    });
  };

  const updateProps = (items: Record<string, unknown>) => {
    actions.setProp(selected.id, (nodeProps) => {
      Object.keys(items).forEach((key) => {
        setResponsiveValue(nodeProps, key, items[key], device);
      });
    });
  };

  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Vui lòng chỉ tải lên tệp định dạng .svg');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.media) {
        updateProp('iconName', data.media.url);
        updateProp('iconStyle', 'custom');
      } else {
        alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const updateFlexDirection = (direction: string) => {
    updateProp('flexDirection', direction);

    const isVertical = direction === 'column' || direction === 'column-reverse';
    if (!isVertical || !node) return;

    const childIds = node.data.nodes || [];
    childIds.forEach((childId: string) => {
      const childNode = query.node(childId).get();
      const childName = childNode?.data.displayName || childNode?.data.name;
      if (childName !== 'Vùng chứa') return;

      actions.setProp(childId, (childProps) => {
        childProps.widthMode = 'full';
        childProps.customWidth = '';
        childProps.width = '100%';
      });
    });
  };

  const isTypographyModified = Boolean(
    props.fontFamily ||
    props.fontSize ||
    props.fontWeight ||
    (props.fontStyle && props.fontStyle !== 'normal') ||
    props.lineHeight ||
    props.letterSpacing ||
    props.wordSpacing
  );

  const handleResetTypography = () => {
    updateProps({
      fontFamily: '',
      fontSize: '',
      fontWeight: '',
      fontStyle: 'normal',
      lineHeight: '',
      letterSpacing: '',
      wordSpacing: '',
    });
  };

  const isTextShadowModified = Boolean(
    (props.textShadowColor && props.textShadowColor !== 'transparent') ||
    (props.textShadowBlur && props.textShadowBlur !== '0px') ||
    (props.textShadowHorizontal && props.textShadowHorizontal !== '0px') ||
    (props.textShadowVertical && props.textShadowVertical !== '0px')
  );

  const handleResetTextShadow = () => {
    updateProps({
      textShadowColor: 'transparent',
      textShadowBlur: '0px',
      textShadowHorizontal: '0px',
      textShadowVertical: '0px',
    });
  };

  const isBorderModified = Boolean(
    props.borderWidth ||
    (props.borderColor && props.borderColor !== 'transparent') ||
    (props.borderStyle && props.borderStyle !== 'none') ||
    props.borderRadius
  );

  const handleResetBorder = () => {
    updateProps({
      borderWidth: '',
      borderColor: 'transparent',
      borderStyle: 'none',
      borderRadius: '',
    });
  };

  const isRow = (props.flexDirection || 'column') === 'row' || (props.flexDirection || 'column') === 'row-reverse';

  const splitSpacingValue = (val: string | undefined | null) => {
    if (!val) return { amount: '', unit: 'px' };
    const match = val.match(/^(-?[\d.]+)(px|%|em|rem|vw)?$/i);
    if (match) {
      return { amount: match[1], unit: (match[2] || 'px').toLowerCase() };
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return { amount: String(num), unit: 'px' };
    }
    return { amount: '', unit: 'px' };
  };

  const getSpacingUnit = (group: string, keys: readonly string[]) => {
    // If not set, try to infer from current values
    for (const key of keys) {
      const val = props[key];
      if (val) {
        const { unit } = splitSpacingValue(String(val));
        if (unit) return unit;
      }
    }
    return 'px';
  };

  const handleSpacingUnitChange = (group: string, keys: readonly string[], newUnit: string) => {
    keys.forEach((key) => {
      const val = props[key];
      if (val != null) {
        const { amount } = splitSpacingValue(String(val));
        updateProp(key, `${amount || '0'}${newUnit}`);
      }
    });
  };

  const spacingLabels = ['Trên', 'Phải', 'Dưới', 'Trái'] as const;

  const toggleLinkedSpacing = (
    group: string,
    keys: readonly [string, string, string, string]
  ) => {
    const willLink = !linkedSpacing[group];
    if (willLink) {
      const firstVal = props[keys[0]] || '';
      keys.forEach((key) => updateProp(key, firstVal));
    }
    setLinkedSpacing(prev => ({ ...prev, [group]: willLink }));
  };

  const renderSpacingControl = (
    group: string,
    title: string,
    keys: readonly [string, string, string, string]
  ) => {
    const linked = linkedSpacing[group];
    const activeUnit = getSpacingUnit(group, keys as unknown as string[]);
    const resolvedStep = activeUnit === 'em' || activeUnit === 'rem' ? 0.1 : 1;

    const adjustSpacingValue = (key: string, direction: 1 | -1) => {
      const val = props[key] || '';
      const { amount, unit } = splitSpacingValue(String(val));
      const base = parseFloat(amount) || 0;
      const step = unit === 'em' || unit === 'rem' ? 0.1 : 1;
      const next = Math.round((base + direction * step) * 100) / 100;
      
      const fullValue = `${next}${unit}`;
      if (linked) {
        keys.forEach((k) => updateProp(k, fullValue));
      } else {
        updateProp(key, fullValue);
      }
    };

    const handleInputChange = (key: string, value: string) => {
      const sanitized = value.replace(/[^-0-9.]/g, '');
      const fullValue = sanitized ? `${sanitized}${activeUnit}` : '';
      
      if (linked) {
        keys.forEach((k) => updateProp(k, fullValue));
      } else {
        updateProp(key, fullValue);
      }
    };

    const getSpacingPlaceholder = (key: string) => {
      const val = props[key];
      const resolvedVal = val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : (getDefaultProp(key) || '0');
      const { amount } = splitSpacingValue(resolvedVal);
      return amount || '0';
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between h-7">
          {renderResponsiveLabel(title, keys as unknown as string[])}
          <div className="flex items-center gap-1 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenSpacingUnitPopover(openSpacingUnitPopover === group ? null : group)}
                className="spacing-unit-trigger inline-flex items-center gap-1 h-5 px-1.5 rounded border border-slate-200 bg-white text-[8px] font-extrabold uppercase text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all leading-none"
              >
                {activeUnit} <svg className="w-1.5 h-1.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {openSpacingUnitPopover === group && (
                <div className="spacing-unit-popover-container absolute right-0 mt-1 z-[9999] min-w-[56px] rounded-md border border-slate-100 bg-white py-1 shadow-lg shadow-slate-200/50 animate-fade-in text-[9px] font-bold text-slate-600">
                  {SPACING_UNITS.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => {
                        handleSpacingUnitChange(group, keys as unknown as string[], unit);
                        setOpenSpacingUnitPopover(null);
                      }}
                      className={`block w-full px-2 py-1.5 text-left hover:bg-slate-50 transition-colors uppercase ${activeUnit === unit ? 'text-brand-600 bg-brand-50/50' : ''}`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => keys.forEach((key) => updateProp(key, ''))}
              className="h-5 w-5 inline-flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
              title="Đặt lại tất cả"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_28px] gap-0 items-start">
          {keys.map((key, index) => {
            const hasVal = props[key] !== undefined && props[key] !== null && String(props[key]).trim() !== '';
            const { amount } = splitSpacingValue(String(props[key] || ''));
            const placeholderAmount = getSpacingPlaceholder(key);
            const upId = `${group}-${key}-up`;
            const downId = `${group}-${key}-down`;
            return (
              <div key={key} className="min-w-0">
                {registerStepper(upId, () => adjustSpacingValue(key, 1))}
                {registerStepper(downId, () => adjustSpacingValue(key, -1))}
                <div className="elementor-number-stepper">
                  <input
                    type="number"
                    step={resolvedStep}
                    value={hasVal ? amount : ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className={`w-full h-7 px-1 border-y border-l border-slate-200 text-[10px] text-center font-mono outline-none focus:border-brand-500 elementor-number-input ${index === 0 ? 'rounded-l-md' : ''}`}
                    placeholder={placeholderAmount}
                  />
                  <div className="elementor-stepper-buttons">
                    <button 
                      type="button" 
                      onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => adjustSpacingValue(key, 1)); }}
                      onMouseUp={stopStepping}
                      onMouseLeave={stopStepping}
                      aria-label="Tăng giá trị" 
                      className="group"
                    >
                      <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => adjustSpacingValue(key, -1)); }}
                      onMouseUp={stopStepping}
                      onMouseLeave={stopStepping}
                      aria-label="Giảm giá trị" 
                      className="group"
                    >
                      <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="pt-1 text-center text-[8px] font-semibold text-slate-400 leading-none">{spacingLabels[index]}</div>
              </div>
            );
          })}
          <button 
            type="button" 
            onClick={() => toggleLinkedSpacing(group, keys as unknown as readonly [string, string, string, string])}
            className={`h-7 rounded-r-md border transition-colors ${linked ? 'border-brand-200 bg-brand-50 text-brand-500' : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title={linked ? 'Bấm để tách 4 hướng' : 'Bấm để liên kết 4 hướng'}
          >
            {linked ? <Link2 size={12} className="mx-auto" /> : <Unlink size={12} className="mx-auto" />}
          </button>
        </div>
      </div>
    );
  };

  const renderStyleSection = (title: string, children: React.ReactNode) => (
    <section className="border-b border-slate-100 pb-3.5">
      <button
        type="button"
        className="mb-2.5 flex w-full items-center gap-1.5 text-left text-[11px] font-black uppercase tracking-wider text-slate-800"
      >
        <span className="text-[10px] text-slate-500">▾</span>
        {title}
      </button>
      <div className="space-y-2.5">{children}</div>
    </section>
  );

  const renderAccordionSection = (sectionId: string, title: string, children: React.ReactNode, defaultExpanded = true) => {
    const isExpanded = expandedSections[sectionId] ?? defaultExpanded;
    return (
      <section className="border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setExpandedSections(prev => ({ ...prev, [sectionId]: !isExpanded }))}
          className="flex w-full items-center justify-between text-left text-[11px] font-black uppercase tracking-wider text-slate-800 py-2 hover:text-brand-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              className="text-slate-400 transform transition-transform duration-200 shrink-0"
              style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
            {title}
          </span>
        </button>
        {isExpanded && (
          <div className="mt-2.5 space-y-3.5 animate-fade-in pl-1">
            {children}
          </div>
        )}
      </section>
    );
  };

  const renderStyleRow = (label: React.ReactNode, control: React.ReactNode) => (
    <div className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-2 text-[11px]">
      <div className="min-w-0 font-medium text-slate-500">{label}</div>
      <div className="min-w-0">{control}</div>
    </div>
  );

  const renderUnitSelector = (currentUnit: string, units: string[], onChange: (unit: string) => void) => (
    <div className="flex rounded bg-slate-100 p-0.5 text-[8px] font-extrabold uppercase text-slate-500 gap-0.5 ml-auto">
      {units.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-1.5 py-0.5 rounded transition-all leading-none ${currentUnit === u ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-700'}`}
        >
          {u}
        </button>
      ))}
    </div>
  );

  const renderSegmentedControl = <T extends string,>(
    value: T | undefined,
    fallback: T,
    options: readonly { value: T; label: React.ReactNode }[],
    onChange: (value: T) => void
  ) => (
    <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold text-slate-500">
      {options.map((option) => {
        const active = (value || fallback) === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded px-1.5 py-1 transition-colors ${active ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-800'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const renderEditButton = (
    popoverKey: string,
    extra?: React.ReactNode,
    onReset?: () => void,
    isModified?: boolean
  ) => (
    <div className="relative flex justify-end gap-1.5 items-center">
      {extra}
      {isModified && onReset && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all active:scale-95"
          title="Trở về mặc định"
        >
          <RotateCcw size={10} />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPopoverPanelCoords({ top: rect.bottom + 4, left: rect.right });
          setOpenStylePopover(openStylePopover === popoverKey ? null : popoverKey);
        }}
        className={`popover-toggle-button inline-flex h-7 w-8 items-center justify-center rounded-md border transition-colors ${openStylePopover === popoverKey ? 'border-brand-300 bg-brand-50 text-brand-600' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}
      >
        <Lucide.Pencil size={11} className="stroke-[2.5]" />
      </button>
    </div>
  );

  const renderToggleControl = (
    label: string, 
    value: boolean, 
    onChange: (checked: boolean) => void, 
    options?: { activeLabel?: string; inactiveLabel?: string; note?: string }
  ) => {
    const activeLabel = options?.activeLabel || 'Có';
    const inactiveLabel = options?.inactiveLabel || 'Không';
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={Boolean(value)} 
              onChange={(e) => onChange(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
        {options?.note && (
          <p className="text-[9px] text-slate-400 font-semibold leading-relaxed italic" dangerouslySetInnerHTML={{ __html: options.note }} />
        )}
      </div>
    );
  };

  const renderColorControl = (
    key: string,
    fallback: string,
    placeholderVal?: string,
    customValue?: string,
    customOnChange?: (val: string) => void
  ) => {
    const currentValue = customValue !== undefined ? customValue : (props[key] || '');
    const isGlobalColor = String(currentValue).startsWith('var(--site-color-');
    const isModified = Boolean(currentValue && currentValue !== fallback);
    
    const getGlobalColorHex = (token: string) => {
      if (!token) return '';
      switch (token) {
        case 'var(--site-color-primary)': return websiteSettings?.colors?.primary || '#3b82f6';
        case 'var(--site-color-secondary)': return websiteSettings?.colors?.secondary || '#6b7280';
        case 'var(--site-color-accent)': return websiteSettings?.colors?.accent || '#f59e0b';
        case 'var(--site-color-success)': return websiteSettings?.colors?.success || '#10b981';
        case 'var(--site-color-warning)': return websiteSettings?.colors?.warning || '#f59e0b';
        case 'var(--site-color-danger)': return websiteSettings?.colors?.danger || '#ef4444';
        case 'var(--site-color-background)': return websiteSettings?.colors?.background || '#ffffff';
        case 'var(--site-color-text)': return websiteSettings?.colors?.text || '#1f2937';
        default: return '';
      }
    };

    const globalColorHex = getGlobalColorHex(String(currentValue));
    const hasColor = Boolean(currentValue && currentValue !== 'transparent');
    const colorBg = hasColor 
      ? (isGlobalColor ? (globalColorHex || currentValue) : currentValue)
      : 'transparent';

    const getValidHex = (val: string, fallbackHex: string): string => {
      const s = String(val);
      if (s.startsWith('#') && (s.length === 4 || s.length === 7 || s.length === 9)) {
        return s;
      }
      const g = getGlobalColorHex(s);
      if (g.startsWith('#')) return g;
      if (fallbackHex.startsWith('#')) return fallbackHex;
      return '#ffffff';
    };

    const getTooltipText = () => {
      if (!currentValue) return 'Mặc định';
      if (isGlobalColor) {
        const col = [
          { token: 'var(--site-color-primary)', label: 'Primary (Chính)' },
          { token: 'var(--site-color-secondary)', label: 'Secondary (Phụ)' },
          { token: 'var(--site-color-accent)', label: 'Accent (Nhấn)' },
          { token: 'var(--site-color-success)', label: 'Success (Thành công)' },
          { token: 'var(--site-color-warning)', label: 'Warning (Cảnh báo)' },
          { token: 'var(--site-color-danger)', label: 'Danger (Nguy hiểm)' },
          { token: 'var(--site-color-background)', label: 'Màu nền trang' },
          { token: 'var(--site-color-text)', label: 'Màu chữ chính' },
        ].find(c => c.token === currentValue);
        return col ? `${col.label} (${globalColorHex})` : currentValue;
      }
      return currentValue;
    };
    
    const handleCommit = (val: string) => {
      if (customOnChange) {
        customOnChange(val);
      } else {
        updateProp(key, val);
      }
    };
    
    return (
      <div className="flex items-center gap-1.5 relative justify-end">
        {isModified && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCommit('');
            }}
            className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shrink-0"
            title="Trở về mặc định"
          >
            <RotateCcw size={10} />
          </button>
        )}
        
        <div className="relative">
          <div className="flex items-center rounded border border-slate-200 bg-white overflow-hidden h-6">
            <button 
              type="button"
              className="color-picker-trigger w-6 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition-colors"
              title="Màu hệ thống"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setColorPickerCoords({ top: rect.bottom + 4, left: rect.right });
                setActiveColorPopoverKey(activeColorPopoverKey === key ? null : key);
              }}
            >
              <Lucide.Globe size={11} />
            </button>
            <div 
              className="color-picker-trigger w-6 h-full cursor-pointer relative group/color-btn bg-white hover:bg-slate-50 transition-colors"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setColorPickerCoords({ top: rect.bottom + 4, left: rect.right });
                setActiveColorPopoverKey(activeColorPopoverKey === key ? null : key);
              }}
            >
              <div 
                className="absolute inset-[3px] rounded-[2px] border border-slate-200/50" 
                style={{ backgroundColor: hasColor ? colorBg : 'white' }} 
              />
              {!hasColor && (
                <div 
                  className="absolute inset-[3px] rounded-[2px]" 
                  style={{ backgroundImage: 'linear-gradient(45deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)' }} 
                />
              )}
            </div>
          </div>

        {activeColorPopoverKey === key && (
            <div
              className="color-picker-popover-container absolute right-0 top-full mt-1"
              style={{ zIndex: 99999 }}
            >
              <ColorPickerPopoverContent 
                currentValue={currentValue}
                fallback={fallback}
                handleCommit={handleCommit}
                onClose={() => setActiveColorPopoverKey(null)}
                websiteSettings={websiteSettings}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPopoverPanel = (popoverKey: string, children: React.ReactNode, _isRelative?: boolean) => openStylePopover === popoverKey ? (
    <div className="popover-panel-container mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-900/5 animate-fade-in">
      {children}
    </div>
  ) : null;

  const renderTypographyFields = (prefix: string, defaultSize = '14', defaultWeight = '400') => (
    <div className="space-y-3">
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Gia đình</span>
        <select
          value={props[prefix + 'FontFamily'] || 'Inter'}
          onChange={(e) => updateProp(prefix + 'FontFamily', e.target.value)}
          className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
        >
          <optgroup label="Cài đặt website">
            <option value="var(--site-font-family-body)">Default: Body font</option>
            <option value="var(--site-font-family-heading)">Default: Heading font</option>
          </optgroup>
          <optgroup label="Tất cả Font chữ Google">
            {GOOGLE_FONTS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Kích thước</span>
        {renderUnitControl(prefix + 'FontSize', defaultSize, 'px', { min: 8, max: 80 })}
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Độ đậm</span>
        <select value={props[prefix + 'FontWeight'] || defaultWeight} onChange={(e) => updateProp(prefix + 'FontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
          <option value="100">100 (Rất mỏng)</option>
          <option value="200">200 (Mỏng nhẹ)</option>
          <option value="300">300 (Mỏng)</option>
          <option value="400">400 (Bình thường)</option>
          <option value="500">500 (Trung bình)</option>
          <option value="600">600 (Nửa đậm)</option>
          <option value="700">700 (Đậm)</option>
          <option value="800">800 (Rất đậm)</option>
          <option value="900">900 (Đen)</option>
        </select>
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Kiểu hiển thị</span>
        {renderSegmentedControl(props[prefix + 'FontStyle'], 'normal', [
          { value: 'normal', label: 'Bình thường' },
          { value: 'italic', label: 'Nghiêng' },
        ] as const, (value) => updateProp(prefix + 'FontStyle', value))}
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Độ cao dòng</span>
        {renderUnitControl(prefix + 'LineHeight', '1.5', 'em', { min: 0.5, max: 3 }, ['em', 'px', '%'])}
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Dãn cách ký tự</span>
        {renderUnitControl(prefix + 'LetterSpacing', '0', 'px', { min: -5, max: 20 })}
      </div>
      <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
        <span className="font-medium text-slate-500">Khoảng cách từ</span>
        {renderUnitControl(prefix + 'WordSpacing', '0', 'px', { min: 0, max: 40 })}
      </div>
    </div>
  );

  const renderTextShadowPopover = (propKey: string) => {
    const shadowVal = props[propKey] || '';
    const parsed = parseTextShadow(shadowVal);

    const updateShadow = (field: 'h' | 'v' | 'blur' | 'color', newVal: string) => {
      const current = { ...parsed, [field]: newVal };
      let shadowStr = '';
      if (current.color && current.color !== 'transparent') {
        shadowStr = `${current.h || '0px'} ${current.v || '0px'} ${current.blur || '0px'} ${current.color}`;
      }
      updateProp(propKey, shadowStr);
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Màu sắc</span>
          {renderColorControl(propKey, 'rgba(0,0,0,0.3)', undefined, parsed.color, (val) => updateShadow('color', val || 'transparent'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Ngang</span>
          {renderUnitControl(propKey + '-h', '0', 'px', { min: -50, max: 50 }, TYPOGRAPHY_UNITS, undefined, parsed.h, (val) => updateShadow('h', val || '0px'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Dọc</span>
          {renderUnitControl(propKey + '-v', '0', 'px', { min: -50, max: 50 }, TYPOGRAPHY_UNITS, undefined, parsed.v, (val) => updateShadow('v', val || '0px'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ mờ</span>
          {renderUnitControl(propKey + '-blur', '10', 'px', { min: 0, max: 100 }, TYPOGRAPHY_UNITS, undefined, parsed.blur, (val) => updateShadow('blur', val || '0px'))}
        </div>
      </div>
    );
  };

  const renderTextStrokePopover = (propKey: string) => {
    const strokeVal = props[propKey] || '';
    const parsed = parseTextStroke(strokeVal);

    const updateStroke = (field: 'width' | 'color', newVal: string) => {
      const current = { ...parsed, [field]: newVal };
      let strokeStr = '';
      if (current.width && current.width !== '0px' && current.color && current.color !== 'transparent') {
        strokeStr = `${current.width} ${current.color}`;
      } else if (current.width && current.width !== '0px') {
        strokeStr = `${current.width} #000000`;
      }
      updateProp(propKey, strokeStr);
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Màu viền</span>
          {renderColorControl(propKey, '#000000', undefined, parsed.color, (val) => updateStroke('color', val || 'transparent'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ dày</span>
          {renderUnitControl(propKey + '-width', '0', 'px', { min: 0, max: 20 }, TYPOGRAPHY_UNITS, undefined, parsed.width, (val) => updateStroke('width', val || '0px'))}
        </div>
      </div>
    );
  };

  const renderBoxShadowFields = (
    shadow: { horizontal: number; vertical: number; blur: number; spread: number; color: string; inset: boolean },
    onChange: (shadow: { horizontal: number; vertical: number; blur: number; spread: number; color: string; inset: boolean }) => void
  ) => {
    const updateShadow = (field: 'horizontal' | 'vertical' | 'blur' | 'spread' | 'color' | 'inset', newVal: string | number | boolean) => {
      onChange({ ...shadow, [field]: newVal });
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Màu sắc</span>
          {renderColorControl('boxShadowFields-color', 'rgba(0,0,0,0.12)', undefined, shadow.color, (val) => updateShadow('color', val || 'transparent'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Ngang</span>
          {renderUnitControl('boxShadowFields-horizontal', '0', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${shadow.horizontal}px`, (val) => updateShadow('horizontal', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Dọc</span>
          {renderUnitControl('boxShadowFields-vertical', '4', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${shadow.vertical}px`, (val) => updateShadow('vertical', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ mờ</span>
          {renderUnitControl('boxShadowFields-blur', '10', 'px', { min: 0, max: 160 }, TYPOGRAPHY_UNITS, undefined, `${shadow.blur}px`, (val) => updateShadow('blur', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ lan</span>
          {renderUnitControl('boxShadowFields-spread', '0', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${shadow.spread}px`, (val) => updateShadow('spread', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Inset</span>
          {renderSegmentedControl(shadow.inset ? 'yes' : 'no', 'no', [
            { value: 'no', label: 'Không' },
            { value: 'yes', label: 'Có' },
          ] as const, (value) => updateShadow('inset', value === 'yes'))}
        </div>
      </div>
    );
  };

  const renderBoxShadowPopover = (propKey: string) => {
    const shadowVal = props[propKey] || '';
    const parsed = parseBoxShadow(shadowVal);

    const updateShadow = (field: 'horizontal' | 'vertical' | 'blur' | 'spread' | 'color' | 'inset', newVal: string | number | boolean) => {
      const current = { ...parsed, [field]: newVal };
      const shouldRender = current.color && current.color !== 'transparent';
      updateProp(propKey, shouldRender ? serializeBoxShadow(current) : 'none');
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Màu sắc</span>
          {renderColorControl(propKey, 'rgba(0,0,0,0.12)', undefined, parsed.color, (val) => updateShadow('color', val || 'transparent'))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Ngang</span>
          {renderUnitControl(`${propKey}-horizontal`, '0', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${parsed.horizontal}px`, (val) => updateShadow('horizontal', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Dọc</span>
          {renderUnitControl(`${propKey}-vertical`, '4', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${parsed.vertical}px`, (val) => updateShadow('vertical', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ mờ</span>
          {renderUnitControl(`${propKey}-blur`, '10', 'px', { min: 0, max: 160 }, TYPOGRAPHY_UNITS, undefined, `${parsed.blur}px`, (val) => updateShadow('blur', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Độ lan</span>
          {renderUnitControl(`${propKey}-spread`, '0', 'px', { min: -100, max: 100 }, TYPOGRAPHY_UNITS, undefined, `${parsed.spread}px`, (val) => updateShadow('spread', parseSpacing(val)))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Inset</span>
          {renderSegmentedControl(parsed.inset ? 'yes' : 'no', 'no', [
            { value: 'no', label: 'Không' },
            { value: 'yes', label: 'Có' },
          ] as const, (value) => updateShadow('inset', value === 'yes'))}
        </div>
      </div>
    );
  };

  const renderUnitControl = (
    propKey: string,
    placeholder: string,
    fallbackUnit: string = 'px',
    range?: { min: number; max: number },
    unitsList: readonly string[] = TYPOGRAPHY_UNITS,
    onValueChange?: (val: string) => void,
    customValue?: string,
    customOnChange?: (val: string) => void
  ) => {
    const rawValue = customValue !== undefined ? customValue : props[propKey];
    const current = splitSizeValue(rawValue, fallbackUnit);

    // Resolve dynamic default placeholder from getDefaultProp mapping
    const defaultVal = getDefaultProp(propKey);
    let resolvedPlaceholder = placeholder;
    if (defaultVal) {
      const parsedDefault = splitSizeValue(defaultVal, fallbackUnit);
      if (parsedDefault.amount !== '') {
        resolvedPlaceholder = parsedDefault.amount;
      }
    }

    const resolvedStep = current.unit === 'px' ? 1 : 0.1;
    const resolvedRange = range || (
      current.unit === '%' || current.unit === 'vw' || current.unit === 'vh'
        ? { min: 0, max: 100 }
        : current.unit === 'em' || current.unit === 'rem'
          ? { min: 0, max: 60 }
          : { min: 0, max: 1000 }
    );

    const commitValue = (amount: string, unit: string) => {
      let nextAmount = amount;
      if (amount !== '') {
        const numericAmount = Number(amount);
        if (Number.isFinite(numericAmount)) {
          const clampedAmount = Math.min(Math.max(numericAmount, resolvedRange.min), resolvedRange.max);
          nextAmount = String(clampedAmount);
        }
      }
      const fullVal = nextAmount ? `${nextAmount}${unit}` : '';
      if (customOnChange) {
        customOnChange(fullVal);
      } else {
        updateProp(propKey, fullVal);
      }
      if (onValueChange) {
        onValueChange(fullVal);
      }
    };
    const stepValue = (direction: 1 | -1) => {
      const base = parseFloat(current.amount || '0') || 0;
      const next = Math.round((base + direction * resolvedStep) * 100) / 100;
      commitValue(String(next), current.unit);
    };

    const upId = `unit-${propKey}-up`;
    const downId = `unit-${propKey}-down`;

    return (
      <div className="flex items-center gap-2 w-full mt-[18px]">
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={resolvedRange.min}
            max={resolvedRange.max}
            step={resolvedStep}
            value={parseFloat(current.amount) || parseFloat(resolvedPlaceholder) || resolvedRange.min}
            onChange={(e) => commitValue(e.target.value, current.unit)}
            className="elementor-slider w-full"
          />
        </div>
        <div className="w-[48px] shrink-0 elementor-number-stepper">
          {/* Unit Selector Overlay (placed directly above the number input) */}
          {unitsList.length > 1 && (
            <div className="absolute -top-[22px] right-0 flex rounded bg-slate-100/80 p-[2px] text-[8px] font-extrabold uppercase text-slate-400 gap-[2px]">
              {unitsList.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => commitValue(current.amount, unit)}
                  className={`px-1 py-0.5 rounded transition-all leading-none ${current.unit === unit ? 'bg-white text-brand-600 shadow-sm' : 'hover:text-slate-700'}`}
                >
                  {unit}
                </button>
              ))}
            </div>
          )}
          <input
            type="number"
            min={resolvedRange.min}
            max={resolvedRange.max}
            step={resolvedStep}
            value={current.amount}
            onChange={(e) => commitValue(e.target.value, current.unit)}
            className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
            placeholder={resolvedPlaceholder}
          />
          <div className="elementor-stepper-buttons">
            <button 
              type="button" 
              onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepValue(1)); }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              aria-label="Tăng giá trị" 
              className="group"
            >
              <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button 
              type="button" 
              onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepValue(-1)); }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              aria-label="Giảm giá trị" 
              className="group"
            >
              <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSliderControl = (
    key: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hueRotate',
    value: number,
    range: { min: number; max: number; step: number },
    onChange: (key: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hueRotate', value: number) => void
  ) => (
    <div className="grid grid-cols-[1fr_58px] items-center gap-2">
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(key, Number(e.target.value))}
        className="elementor-slider"
      />
      <input
        type="number"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(key, Number(e.target.value))}
        className="h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
      />
    </div>
  );

  const renderLineHeightControl = (propKey: string = 'lineHeight') => {
    const raw = props[propKey] || '';
    const hasUnit = /(px|em|rem)$/i.test(raw);
    const current = splitSizeValue(raw, 'em');
    const lineStep = hasUnit ? (current.unit === 'px' ? 1 : 0.1) : 0.1;
    const commitValue = (amount: string, unit: string) => {
      updateProp(propKey, amount ? `${amount}${unit}` : '');
    };
    const stepLineHeight = (direction: 1 | -1) => {
      const base = parseFloat(hasUnit ? current.amount : raw || '1.5') || 0;
      const next = Math.round((base + direction * lineStep) * 100) / 100;
      if (hasUnit) commitValue(String(next), current.unit);
      else updateProp('lineHeight', String(next));
    };

    const upId = 'lineHeight-up';
    const downId = 'lineHeight-down';

    return (
      <div className="grid grid-cols-[1fr_64px_42px] items-center gap-1.5">
        {registerStepper(upId, () => stepLineHeight(1))}
        {registerStepper(downId, () => stepLineHeight(-1))}
        <input
          type="range"
          min="1"
          max="80"
          value={hasUnit ? parseFloat(current.amount) || 1 : Math.round((parseFloat(raw) || 1.5) * 10)}
          onChange={(e) => {
            if (hasUnit) commitValue(e.target.value, current.unit);
            else updateProp('lineHeight', String(Number(e.target.value) / 10));
          }}
          className="elementor-slider"
        />
        <div className="elementor-number-stepper">
          <input
            type="number"
            step={lineStep}
            value={hasUnit ? current.amount : raw}
            onChange={(e) => hasUnit ? commitValue(e.target.value, current.unit) : updateProp('lineHeight', e.target.value)}
            className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
            placeholder="1.5"
          />
          <div className="elementor-stepper-buttons">
            <button 
              type="button" 
              onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepLineHeight(1)); }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              aria-label="Tăng độ cao dòng" 
              className="group"
            >
              <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button 
              type="button" 
              onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepLineHeight(-1)); }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              aria-label="Giảm độ cao dòng" 
              className="group"
            >
              <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
        <select
          value={hasUnit ? current.unit : ''}
          onChange={(e) => {
            if (!e.target.value) updateProp('lineHeight', current.amount || '1.5');
            else commitValue(current.amount || '1.5', e.target.value);
          }}
          className="h-7 rounded border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-500 outline-none"
        >
          <option value="">—</option>
          {TYPOGRAPHY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
        </select>
      </div>
    );
  };

  const handleDelete = () => {
    if (isDeletable) {
      actions.delete(selected.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden bg-white">
      {/* Component Header Info */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-center bg-white relative">
        <h3 className="text-xs font-bold text-slate-800 tracking-tight select-none">Sửa {name}</h3>
        {isDeletable && (
          <button
            onClick={handleDelete}
            title="Xóa thành phần"
            className="absolute right-3 text-slate-400 hover:text-red-500 p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 text-[11px] font-bold text-slate-400 bg-white">
        <button
          onClick={() => handleTabChange('content')}
          className={`flex-1 py-2.5 border-b-2 text-center transition-all ${
            activeTab === 'content'
              ? 'border-slate-800 text-slate-800 font-bold bg-white'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            {(() => {
              const PenIcon = Lucide.Pen || Lucide.Pencil;
              return PenIcon ? <PenIcon size={12} /> : null;
            })()}
            {(name === 'Vùng chứa' || name === 'Lưới') ? 'Bố cục' : 'Nội dung'}
          </div>
        </button>
        <button
          onClick={() => handleTabChange('style')}
          className={`flex-1 py-2.5 border-b-2 text-center transition-all ${
            activeTab === 'style'
              ? 'border-slate-800 text-slate-800 font-bold bg-white'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            {(() => {
              const ContrastIcon = Lucide.Contrast;
              return ContrastIcon ? <ContrastIcon size={12} /> : null;
            })()}
            Kiểu hiển thị
          </div>
        </button>
        <button
          onClick={() => handleTabChange('advanced')}
          className={`flex-1 py-2.5 border-b-2 text-center transition-all ${
            activeTab === 'advanced'
              ? 'border-slate-800 text-slate-800 font-bold bg-white'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Settings size={12} />
            Nâng cao
          </div>
        </button>
      </div>

      {/* Panels Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        
        {/* TAB 1: CONTENT TRAITS */}
        {activeTab === 'content' && (
          <ContentPanel
            ctx={{
              props,
              name,
              selected,
              node,
              ReactQuill,
              quillRef,
              quillModulesConfig,
              textEditorMode,
              setTextEditorMode,
              showSecondRow,
              setShowSecondRow,
              isFullscreen,
              setIsFullscreen,
              pasteAsPlainText,
              setPasteAsPlainText,
              showSpecialCharModal,
              setShowSpecialCharModal,
              showHelpModal,
              setShowHelpModal,
              showTextBlockDynamicDropdown,
              setShowTextBlockDynamicDropdown,
              showTextBlockAdvanced,
              setShowTextBlockAdvanced,
              showDynamicTags,
              setShowDynamicTags,
              showImageDbDropdown,
              setShowImageDbDropdown,
              linkedSpacing,
              setLinkedSpacing,
              openSpacingUnitPopover,
              setOpenSpacingUnitPopover,
              expandedIconListItemIdx,
              setExpandedIconListItemIdx,
              draggedIconListItemIdx,
              setDraggedIconListItemIdx,
              expandedAccordionItemIdx,
              setExpandedAccordionItemIdx,
              draggedAccordionItemIdx,
              setDraggedAccordionItemIdx,
              expandedTabsItemIdx,
              setExpandedTabsItemIdx,
              draggedTabsItemIdx,
              setDraggedTabsItemIdx,
              updateProp,
              updateProps,
              renderStyleRow,
              renderColorControl,
              renderUnitControl,
              renderSegmentedControl,
              renderSpacingControl,
              renderUnitSelector,
              registerStepper,
              startStepping,
              stopStepping,
              splitSpacingValue,
              renderStyleSection,
              renderAccordionSection,
              renderToggleControl,
              renderResponsiveLabel,
              device: activeDevice,
              onOpenMedia,
              onOpenIcon,
            }}
          />
        )}

        {/* TAB 2: STYLE INSPECTOR */}
        <StylePanel
          ctx={{
            activeTab, name, props, selected, Lucide, SPACING_UNITS, GOOGLE_FONTS, TYPOGRAPHY_UNITS,
            activeBorderTab, setActiveBorderTab,
            activeIconListIconHoverTab, setActiveIconListIconHoverTab,
            activeIconListTextHoverTab, setActiveIconListTextHoverTab, activeBgTab, setActiveBgTab,
            activeTextHoverTab, setTextHoverTabByNodeId, imageStyleTab, setImageStyleTab,
            activeIconHoverTab, setActiveIconHoverTabByNodeId,
            accordionItemTab, setAccordionItemTab, accordionTitleTab, setAccordionTitleTab, accordionIconTab, setAccordionIconTab,
            tabsItemTab, setTabsItemTab, tabsTitleTab, setTabsTitleTab, tabsIconTab, setTabsIconTab,
            isTypographyModified, handleResetTypography, isTextShadowModified, handleResetTextShadow, updateProp,
            renderStyleSection, renderStyleRow, renderSegmentedControl, renderEditButton, renderPopoverPanel,
            renderTypographyFields,
            renderColorControl, renderUnitControl, renderSpacingControl,
            renderLineHeightControl,
            renderBoxShadowPopover, renderTextShadowPopover, renderTextStrokePopover,
            registerStepper, startStepping, stopStepping, splitSpacingValue, renderAccordionSection, renderResponsiveLabel,
            onOpenMedia, onOpenIcon,
          }}
        />
      </div>
    </div>
  );
};

