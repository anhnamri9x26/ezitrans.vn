import React, { useEffect, useRef, useState } from 'react';
import { Database, Wrench, X, ChevronDown, Image as ImageIcon, Trash2, GripVertical, Monitor, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Link2, Unlink, Copy } from 'lucide-react';
import * as Lucide from 'lucide-react';
import { DynamicInput } from '../shared/DynamicInput';
import { DYNAMIC_TAGS, SPECIAL_CHARS, SPACING_UNITS } from '../shared/constants';
import { getDynamicFieldLabel, splitSizeValue } from '../shared/utils';
import { getLucideReactComponent } from '../../../utils/iconRegistry';
import { getSocialIcon } from '../../../utils/socialIconsData';

export function ContentPanel({ ctx }: { ctx: Record<string, any> }) {
  const {
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
    device = 'desktop',
    onOpenMedia,
    onOpenIcon,
  } = ctx;

  const responsiveKey = (key: string) => {
    if (device === 'mobile') return `${key}_mobile`;
    if (device === 'tablet') return `${key}_tablet`;
    return key;
  };

  const responsiveValue = (key: string, fallback?: unknown) => {
    const activeKey = responsiveKey(key);
    const activeValue = props[activeKey];
    if (activeValue !== undefined && activeValue !== null && String(activeValue).trim() !== '') return activeValue;
    const desktopValue = props[key];
    if (desktopValue !== undefined && desktopValue !== null && String(desktopValue).trim() !== '') return desktopValue;
    return fallback;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [managedMenus, setManagedMenus] = useState<Array<{ id: number; name: string; itemCount: number }>>([]);
  useEffect(() => {
    if (name !== 'Menu') return;
    fetch('/api/navigation/menus')
      .then((response) => response.json())
      .then((data) => setManagedMenus(data?.success && Array.isArray(data.menus) ? data.menus : []))
      .catch(() => setManagedMenus([]));
  }, [name]);
  const [isUploading, setIsUploading] = useState(false);
  const insertText = (text: string) => {
    const editor = quillRef?.current?.getEditor?.();
    if (editor) {
      const range = editor.getSelection(true);
      editor.insertText(range?.index ?? editor.getLength(), text);
      return;
    }
    updateProp('content', `${props.content || ''}${text}`);
  };
  const handleInsertDynamicTag = (tag: string) => {
    insertText(tag);
    setShowDynamicTags(false);
  };
  const handleInsertHR = () => insertText('<hr />');
  const togglePasteAsPlainText = () => setPasteAsPlainText((prev: boolean) => !prev);
  const handlePaste = (event: React.ClipboardEvent) => {
    if (!pasteAsPlainText) return;
    event.preventDefault();
    insertText(event.clipboardData.getData('text/plain'));
  };
  const handleSvgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateProps({ iconSvg: String(reader.result || ''), iconName: '' });
      event.target.value = '';
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsText(file);
  };
  const [expandedSocialItemIdx, setExpandedSocialItemIdx] = useState<number | null>(null);
  const [draggedSocialItemIdx, setDraggedSocialItemIdx] = useState<number | null>(null);
  const [expandedFormFieldIdx, setExpandedFormFieldIdx] = useState<number | null>(null);
  const [draggedFormFieldIdx, setDraggedFormFieldIdx] = useState<number | null>(null);
  const updateFlexDirection = (value: string) => updateProp('flexDirection', value);

  return (
  <div className="space-y-4 animate-fade-in">
    {name === 'Văn bản' && (
      <div className="space-y-4">
        <div className="space-y-2 relative">
          {props.dynamicText?.enabled ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nội dung văn bản</label>
              </div>
              <div className="flex items-center justify-between w-full h-8 px-2.5 bg-brand-50/40 border border-brand-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-brand-50/60">
                <button
                  type="button"
                  onClick={() => setShowTextBlockAdvanced((prev: boolean) => !prev)}
                  className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold"
                  title="Cài đặt nâng cao"
                >
                  <Wrench size={11} className="text-brand-500" />
                  <span>{getDynamicFieldLabel(props.dynamicText.source || '', props.dynamicText.field || '')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProp('dynamicText', {
                      enabled: false,
                      source: '',
                      field: '',
                      before: '',
                      after: '',
                      fallback: '',
                    });
                    setShowTextBlockAdvanced(false);
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                  title="Xóa liên kết động"
                >
                  <X size={11} />
                </button>
              </div>
              
              {showTextBlockAdvanced && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-[10px] mt-1 shadow-inner">
                  <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Thiết lập nâng cao</div>
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">Trước (Before)</label>
                    <input
                      type="text"
                      value={props.dynamicText.before || ''}
                      onChange={(e) => updateProp('dynamicText', { ...props.dynamicText, before: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                      placeholder="Ví dụ: Giá: "
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">Sau (After)</label>
                    <input
                      type="text"
                      value={props.dynamicText.after || ''}
                      onChange={(e) => updateProp('dynamicText', { ...props.dynamicText, after: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                      placeholder="Ví dụ: VNĐ"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-bold">Dự phòng (Fallback)</label>
                    <input
                      type="text"
                      value={props.dynamicText.fallback || ''}
                      onChange={(e) => updateProp('dynamicText', { ...props.dynamicText, fallback: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                      placeholder="Giá trị hiển thị nếu dữ liệu rỗng"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1 relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nội dung văn bản</label>
                <button
                  type="button"
                  onClick={() => setShowTextBlockDynamicDropdown((prev: boolean) => !prev)}
                  className={`text-slate-400 hover:text-brand-500 transition-colors ${showTextBlockDynamicDropdown ? 'text-brand-500' : ''}`}
                  title="Dữ liệu động"
                >
                  <Database size={11} />
                </button>
                
                {showTextBlockDynamicDropdown && (
                  <div className="absolute right-0 top-5 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 w-[220px] text-slate-700 font-sans animate-scale-up max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div className="px-2.5 pb-1 mb-1 border-b border-slate-100 text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Chọn dữ liệu động</div>
                    
                    <div className="space-y-0.5">
                      {/* 1. POST */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-brand-600 uppercase bg-brand-50/50">Bài viết (Post)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'title' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tiêu đề bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'content' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Nội dung bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'excerpt' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả ngắn</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'slug' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Slug bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'id' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">ID bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'status' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Trạng thái bài viết</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'publishedAt' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày xuất bản</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'modifiedAt' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày cập nhật</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'post', field: 'featuredImage' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh đại diện bài viết</button>

                      {/* 2. AUTHOR */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-rose-600 uppercase bg-rose-50/50 mt-1">Tác giả (Author)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'name' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên tác giả</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'displayName' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên hiển thị tác giả</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'email' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email tác giả</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'bio' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Giới thiệu tác giả</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'avatar' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Avatar tác giả</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'author', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL tác giả</button>

                      {/* 3. TAXONOMY */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-cyan-600 uppercase bg-cyan-50/50 mt-1">Phân loại (Taxonomy)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'category', field: 'name' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên chuyên mục</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'category', field: 'description' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả chuyên mục</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'category', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL chuyên mục</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'tag', field: 'name' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên thẻ (Tag)</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'tag', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL thẻ (Tag)</button>

                      {/* 4. SITE */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-indigo-600 uppercase bg-indigo-50/50 mt-1">Website (Site)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'title' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên trang web</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'tagline' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả trang web</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL trang web</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'logo' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Logo trang web</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'email' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email liên hệ</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'site', field: 'phone' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Số điện thoại</button>

                      {/* 5. CURRENT USER & LEARNING */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-amber-600 uppercase bg-amber-50/50 mt-1">Thành viên & Học tập</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'name' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên hiển thị</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'email' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email thành viên</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'avatar' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh đại diện</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'role' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Vai trò</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'id' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">ID thành viên</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'xp' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Điểm tích lũy (XP)</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'streak' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Chuỗi ngày học</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'level' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Cấp độ học viên</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'band' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Band hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'targetBand' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Band mục tiêu</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'completedLessons' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Bài học đã làm</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'completedTests' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Bài thi đã làm</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'user', field: 'studyTime' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Thời gian học</button>

                      {/* 6. DATE & TIME */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-purple-600 uppercase bg-purple-50/50 mt-1">Thời gian (Date & Time)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'dateTime', field: 'currentDate' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'dateTime', field: 'currentTime' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Giờ hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'dateTime', field: 'currentYear' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Năm hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'dateTime', field: 'currentMonth' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tháng hiện tại</button>

                      {/* 7. REQUEST / URL */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-orange-600 uppercase bg-orange-50/50 mt-1">Yêu cầu (Request / URL)</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'request', field: 'url' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'request', field: 'path' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Path hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'request', field: 'query' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Query String hiện tại</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'request', field: 'referrer' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Referrer URL</button>

                      {/* 8. SEO */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-emerald-600 uppercase bg-emerald-50/50 mt-1">SEO</div>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'seo', field: 'title' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tiêu đề SEO</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'seo', field: 'description' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả SEO</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'seo', field: 'canonicalUrl' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Đường dẫn Canonical</button>
                      <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'seo', field: 'ogImage' }); setShowTextBlockDynamicDropdown(false); }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh Open Graph</button>

                      {/* 9. CUSTOM FIELDS */}
                      <div className="px-2.5 py-0.5 text-[8.5px] font-black text-blue-600 uppercase bg-blue-50/50 mt-1">Trường tùy biến</div>
                      <div className="px-2 pb-1 bg-slate-50/80 pt-1.5 space-y-1 border-t border-slate-100">
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase px-1">Gợi ý nhanh</span>
                        <div className="flex flex-wrap gap-1 px-1 mb-1">
                          <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'custom_field', field: 'course_price' }); setShowTextBlockDynamicDropdown(false); }} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Giá</button>
                          <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'custom_field', field: 'course_level' }); setShowTextBlockDynamicDropdown(false); }} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Trình độ</button>
                          <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'custom_field', field: 'teacher_name' }); setShowTextBlockDynamicDropdown(false); }} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Tên GV</button>
                          <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'custom_field', field: 'teacher_avatar' }); setShowTextBlockDynamicDropdown(false); }} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Ảnh GV</button>
                          <button type="button" onClick={() => { updateProp('dynamicText', { enabled: true, source: 'custom_field', field: 'duration' }); setShowTextBlockDynamicDropdown(false); }} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Thời lượng</button>
                        </div>
                        
                        <span className="block text-[8px] font-extrabold text-slate-400 uppercase px-1">Nhập khóa tùy chỉnh</span>
                        <input
                          type="text"
                          placeholder="Nhập Key..."
                          id="textblock-custom-key-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                updateProp('dynamicText', { enabled: true, source: 'custom_field', field: val });
                                setShowTextBlockDynamicDropdown(false);
                              }
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[10px] outline-none focus:border-brand-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.getElementById('textblock-custom-key-input') as HTMLInputElement | null;
                            const val = input?.value.trim();
                            if (val) {
                              updateProp('dynamicText', { enabled: true, source: 'custom_field', field: val });
                              setShowTextBlockDynamicDropdown(false);
                            }
                          }}
                          className="w-full py-0.5 bg-brand-500 text-white rounded text-[9px] font-bold text-center hover:bg-brand-600 transition-colors"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Visual vs Code Tab Toolbar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-t-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenMedia((url: string) => {
                      if (textEditorMode === 'visual') {
                        const quill = quillRef.current?.getEditor();
                        if (quill) {
                          const range = quill.getSelection(true);
                          if (range) {
                            quill.insertEmbed(range.index, 'image', url);
                            quill.setSelection(range.index + 1);
                          }
                        }
                      } else {
                        const textarea = document.querySelector('textarea[placeholder="Nhập mã HTML..."]') as HTMLTextAreaElement | null;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const currentVal = textarea.value;
                          const imgTag = `<img src="${url}" alt="" />`;
                          const newVal = currentVal.substring(0, start) + imgTag + currentVal.substring(end);
                          updateProp('text', newVal);
                          setTimeout(() => {
                            textarea.focus();
                            textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
                          }, 0);
                        }
                      }
                    });
                  }}
                  className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <ImageIcon size={10} className="text-slate-500" />
                  Thêm tệp
                </button>

                <div className="flex items-center gap-1 bg-slate-200/50 p-0.5 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTextEditorMode('visual')}
                    className={`h-5 px-2.5 text-[9px] font-bold rounded transition-all ${
                      textEditorMode === 'visual'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Trực quan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextEditorMode('html')}
                    className={`h-5 px-2.5 text-[9px] font-bold rounded transition-all ${
                      textEditorMode === 'html'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Mã
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDynamicTags((prev: boolean) => !prev)}
                    className={`h-6 w-6 inline-flex items-center justify-center rounded border transition-colors shadow-sm ${
                      showDynamicTags ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                    title="Dữ liệu động"
                  >
                    <Database size={10} />
                  </button>

                  {showDynamicTags && (
                    <div className="absolute right-0 top-7 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 w-[160px] text-slate-700 font-sans animate-scale-up">
                      <div className="px-2 pb-1 mb-1.5 border-b border-slate-100 text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Chèn dữ liệu động</div>
                      {DYNAMIC_TAGS.map((tagObj) => (
                        <button
                          key={tagObj.tag}
                          type="button"
                          onClick={() => handleInsertDynamicTag(tagObj.tag)}
                          className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-50 transition-colors font-medium flex flex-col"
                        >
                          <span className="text-slate-700 font-bold">{tagObj.label}</span>
                          <span className="text-[8.5px] text-slate-400 font-mono mt-0.5">{tagObj.tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div onPaste={handlePaste} className={isFullscreen ? "fixed inset-4 z-[99999] bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-scale-up" : "relative"}>
                {isFullscreen && (
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                      <Lucide.FileText size={12} className="text-brand-500" />
                      <span>CHẾ ĐỘ TOÀN MÀN HÌNH - {name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(false)}
                      className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      <Lucide.X size={14} />
                    </button>
                  </div>
                )}

                {textEditorMode === 'visual' ? (
                  <div className={`sidebar-quill flex flex-col border border-t-0 border-slate-200 ${isFullscreen ? 'flex-1 h-full rounded-none border-none' : 'rounded-b-lg'}`}>
                    {/* Custom Quill Toolbar */}
                    <div id="quill-sidebar-toolbar" className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1 select-none">
                      {/* Dropdown formats */}
                      <select className="ql-header h-5 px-1 text-[9px] font-bold border border-slate-200 rounded bg-white text-slate-600 outline-none max-w-[76px]" defaultValue="">
                        <option value="">Đoạn văn</option>
                        <option value="1">Tiêu đề 1</option>
                        <option value="2">Tiêu đề 2</option>
                        <option value="3">Tiêu đề 3</option>
                        <option value="4">Tiêu đề 4</option>
                        <option value="5">Tiêu đề 5</option>
                        <option value="6">Tiêu đề 6</option>
                      </select>

                      {/* Bold, Italic, Underline, Strike */}
                      <button className="ql-bold h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Chữ đậm">
                        <Lucide.Bold size={11} />
                      </button>
                      <button className="ql-italic h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Chữ nghiêng">
                        <Lucide.Italic size={11} />
                      </button>
                      <button className="ql-underline h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Gạch dưới">
                        <Lucide.Underline size={11} />
                      </button>
                      <button className="ql-strike h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Gạch ngang">
                        <Lucide.Strikethrough size={11} />
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Lists */}
                      <button className="ql-list h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="bullet" title="Danh sách dấu chấm">
                        <Lucide.List size={11} />
                      </button>
                      <button className="ql-list h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="ordered" title="Danh sách số">
                        <Lucide.ListOrdered size={11} />
                      </button>

                      {/* Link, Blockquote, Divider */}
                      <button className="ql-link h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Chèn liên kết">
                        <Lucide.Link2 size={11} />
                      </button>
                      <button className="ql-blockquote h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Trích dẫn">
                        <Lucide.Quote size={11} />
                      </button>
                      <button type="button" onClick={handleInsertHR} className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Đường phân cách ngang">
                        <Lucide.Minus size={11} />
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Color pickers */}
                      <select className="ql-color" title="Màu chữ" defaultValue="" />
                      <select className="ql-background" title="Màu nền" defaultValue="" />

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Alignment */}
                      <button className="ql-align h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="" title="Căn trái">
                        <Lucide.AlignLeft size={11} />
                      </button>
                      <button className="ql-align h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="center" title="Căn giữa">
                        <Lucide.AlignCenter size={11} />
                      </button>
                      <button className="ql-align h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="right" title="Căn phải">
                        <Lucide.AlignRight size={11} />
                      </button>
                      <button className="ql-align h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="justify" title="Căn đều">
                        <Lucide.AlignJustify size={11} />
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Indent / Outdent */}
                      <button className="ql-indent h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="-1" title="Giảm thụt lề">
                        <Lucide.Outdent size={11} />
                      </button>
                      <button className="ql-indent h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" value="+1" title="Tăng thụt lề">
                        <Lucide.Indent size={11} />
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Utility actions */}
                      <button
                        type="button"
                        onClick={togglePasteAsPlainText}
                        className={`h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors ${pasteAsPlainText ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'text-slate-500 hover:text-slate-800'}`}
                        title={pasteAsPlainText ? "Đang bật: Dán văn bản thuần" : "Dán dưới dạng văn bản thuần"}
                      >
                        <Lucide.ClipboardType size={11} />
                      </button>
                      <button className="ql-clean h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Xóa định dạng">
                        <Lucide.Eraser size={11} />
                      </button>
                      <button type="button" onClick={() => setShowSpecialCharModal(true)} className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Chèn ký tự đặc biệt">
                        <span className="text-[10px] font-black font-serif">Ω</span>
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Undo / Redo */}
                      <button className="ql-undo h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Hoàn tác">
                        <Lucide.Undo2 size={11} />
                      </button>
                      <button className="ql-redo h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Làm lại">
                        <Lucide.Redo2 size={11} />
                      </button>

                      <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

                      {/* Fullscreen & Help */}
                      <button
                        type="button"
                        onClick={() => setIsFullscreen((prev: boolean) => !prev)}
                        className={`h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 transition-colors ${isFullscreen ? 'bg-slate-200 text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
                        title="Toàn màn hình"
                      >
                        {isFullscreen ? <Lucide.Minimize2 size={11} /> : <Lucide.Maximize2 size={11} />}
                      </button>
                      <button type="button" onClick={() => setShowHelpModal(true)} className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-all" title="Trợ giúp">
                        <Lucide.HelpCircle size={11} />
                      </button>
                    </div>

                    {/* ReactQuill Editor */}
                    {isFullscreen ? (
                      <div className="flex-1 min-h-[300px] h-full">
                        <ReactQuill
                          ref={quillRef}
                          key={selected.id}
                          theme="snow"
                          value={props.text || ''}
                          onChange={(val: string) => {
                            if (val !== (props.text || '')) {
                              updateProp('text', val);
                            }
                          }}
                          modules={quillModulesConfig}
                          placeholder="Nhập đoạn văn..."
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <ReactQuill
                        ref={quillRef}
                        key={selected.id}
                        theme="snow"
                        value={props.text || ''}
                        onChange={(val: string) => {
                          if (val !== (props.text || '')) {
                            updateProp('text', val);
                          }
                        }}
                        modules={quillModulesConfig}
                        placeholder="Nhập đoạn văn..."
                      />
                    )}
                  </div>
                ) : (
                  <textarea
                    value={props.text || ''}
                    onChange={(e) => updateProp('text', e.target.value)}
                    className={`w-full p-2 border border-t-0 border-slate-200 text-xs font-mono outline-none focus:border-brand-500 bg-white text-slate-700 resize-vertical ${
                      isFullscreen ? 'flex-1 h-full border-none rounded-none min-h-[400px]' : 'min-h-[140px] rounded-b-lg'
                    }`}
                    placeholder="Nhập mã HTML..."
                  />
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold text-slate-600">Chữ viết hoa</span>
          <button
            type="button"
            onClick={() => updateProp('dropCap', !props.dropCap)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              props.dropCap ? 'bg-brand-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                props.dropCap ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-[88px_1fr] items-center gap-3 text-[11px] py-1 border-t border-slate-100 pt-3">
          <span className="font-bold text-slate-600">Cột</span>
          <select
            value={props.columns || 'default'}
            onChange={(e) => updateProp('columns', e.target.value)}
            className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="default">Mặc định</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={String(num)}>{num}</option>
            ))}
          </select>
        </div>

        {props.columns && props.columns !== 'default' && props.columns !== '1' && (
          <div className="space-y-1.5 py-1 border-t border-slate-100 pt-3 animate-fade-in">
            <label className="block text-[10px] text-slate-600 font-bold">Khoảng cách cách cột</label>
            {renderUnitControl('columnGap', '24', 'px', { min: 0, max: 100 }, ['px', 'em', 'rem', '%'])}
          </div>
        )}
      </div>
    )}

    {name === 'Tiêu đề' && (
      <div className="space-y-4">
        <DynamicInput
          label="Tiêu đề"
          type="textarea"
          value={props.text || ''}
          onChange={(val) => updateProp('text', val)}
          dynamicConfig={props.dynamicText}
          onDynamicChange={(config) => updateProp('dynamicText', config)}
          placeholder="Thêm tiếu đề của bạn ở đây"
        />
        <DynamicInput
          label="Liên kết"
          type="link"
          value={props.link || ''}
          onChange={(val) => updateProp('link', val)}
          dynamicConfig={props.dynamicLink}
          onDynamicChange={(config) => updateProp('dynamicLink', config)}
          linkSettings={props.linkSettings}
          onLinkSettingsChange={(settings) => updateProp('linkSettings', settings)}
          placeholder="Dán URL hoặc loại"
        />
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thẻ HTML</label>
          <select
            value={props.level || 'h2'}
            onChange={(e) => updateProp('level', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white"
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
            <option value="h5">H5</option>
            <option value="h6">H6</option>
          </select>
        </div>
      </div>
    )}

    {name === 'Hình ảnh' && (
      <div className="space-y-4 font-sans">
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chọn ảnh</span>
            <Lucide.Sparkles size={12} className="text-pink-500 animate-pulse animate-duration-1000" />
          </div>
          
          <div 
            onClick={() => onOpenMedia((url: string) => {
              updateProp('url', url);
              updateProp('dynamicUrl', { enabled: false, source: '', field: '', before: '', after: '', fallback: '' });
            })}
            className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/10] group/picker select-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
          >
            {props.dynamicUrl?.enabled ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-brand-50/60 border border-brand-200 p-4">
                <Lucide.Database className="w-8 h-8 text-brand-500 mb-1" />
                <span className="text-[11px] font-bold text-brand-700">Dữ liệu động</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {getDynamicFieldLabel(props.dynamicUrl.source, props.dynamicUrl.field)}
                </span>
              </div>
            ) : props.url ? (
              <img src={props.url} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 pb-10">
                <ImageIcon className="w-8 h-8 mb-1.5 opacity-50 text-slate-400" strokeWidth={1.5} />
                <span className="text-[10px] font-bold">Chưa chọn hình ảnh</span>
              </div>
            )}
            
            {(props.url || props.dynamicUrl?.enabled) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.dynamicUrl?.enabled) {
                    updateProp('dynamicUrl', { enabled: false, source: '', field: '', before: '', after: '', fallback: '' });
                  } else {
                    updateProp('url', '');
                  }
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 hover:bg-slate-950 text-white rounded flex items-center justify-center transition-colors shadow-md active:scale-95 cursor-pointer z-10"
                title="Xóa hình ảnh"
              >
                <Lucide.Trash2 size={12} />
              </button>
            )}
            
            <div className="absolute bottom-0 inset-x-0 h-9 bg-slate-900/95 flex items-center text-xs font-semibold text-white">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMedia((url: string) => {
                    updateProp('url', url);
                    updateProp('dynamicUrl', { enabled: false, source: '', field: '', before: '', after: '', fallback: '' });
                  });
                }}
                className="flex-1 h-full text-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                Chọn ảnh
              </button>
              
              <div className="w-[1px] h-4 bg-white/20 shrink-0" />
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageDbDropdown(!showImageDbDropdown);
                }}
                className={`image-db-trigger w-9 h-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer ${showImageDbDropdown ? 'bg-brand-600 text-white' : 'text-slate-300 hover:text-white'}`}
                title="Dữ liệu động"
              >
                <Lucide.Database size={12} />
              </button>
            </div>
          </div>

          {showImageDbDropdown && (
            <div className="image-db-popover-container absolute left-0 right-0 mt-1 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 text-slate-700 font-sans max-h-[220px] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="px-2.5 pb-1 mb-1 border-b border-slate-100 text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Chọn ảnh động</div>
              <div className="space-y-0.5">
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-brand-600 uppercase bg-brand-50/50">Bài viết (Post)</div>
                <button type="button" onClick={() => {
                  updateProp('dynamicUrl', { enabled: true, source: 'post', field: 'featuredImage', before: '', after: '', fallback: '' });
                  setShowImageDbDropdown(false);
                }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh đại diện bài viết</button>
                
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-indigo-600 uppercase bg-indigo-50/50 mt-1">Website (Site)</div>
                <button type="button" onClick={() => {
                  updateProp('dynamicUrl', { enabled: true, source: 'site', field: 'logo', before: '', after: '', fallback: '' });
                  setShowImageDbDropdown(false);
                }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Logo trang web</button>
                
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-amber-600 uppercase bg-amber-50/50 mt-1">Thành viên (User)</div>
                <button type="button" onClick={() => {
                  updateProp('dynamicUrl', { enabled: true, source: 'user', field: 'avatar', before: '', after: '', fallback: '' });
                  setShowImageDbDropdown(false);
                }} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Avatar thành viên</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả alt (SEO)</label>
          <input
            type="text"
            value={props.alt || ''}
            onChange={(e) => updateProp('alt', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium text-slate-700 text-xs bg-white"
            placeholder="Mô tả bức ảnh..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Độ phân giải hình ảnh</label>
          <select
            value={props.imageResolution || 'large'}
            onChange={(e) => updateProp('imageResolution', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white text-xs"
          >
            <option value="thumbnail">Thumbnail - 150 x 150</option>
            <option value="medium">Medium - 300 x 300</option>
            <option value="large">Large - 1024 x 1024</option>
            <option value="full">Full - Kích thước gốc</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chú thích</label>
          <select
            value={props.captionType || 'none'}
            onChange={(e) => updateProp('captionType', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white text-xs"
          >
            <option value="none">Không</option>
            <option value="attachment">Chú thích của hình ảnh</option>
            <option value="custom">Chú thích tùy chỉnh</option>
          </select>
        </div>

        {props.captionType === 'custom' && (
          <div className="space-y-1.5 animate-slide-down">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nội dung chú thích</label>
            <input
              type="text"
              value={props.customCaption || ''}
              onChange={(e) => updateProp('customCaption', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-medium text-slate-700 text-xs bg-white"
              placeholder="Nhập chú thích..."
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Liên kết</label>
          <select
            value={props.linkType || 'none'}
            onChange={(e) => updateProp('linkType', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white text-xs"
          >
            <option value="none">Không</option>
            <option value="media">Tệp truyền thông</option>
            <option value="custom">URL tùy chỉnh</option>
          </select>
        </div>

        {props.linkType === 'custom' && (
          <div className="animate-slide-down">
            <DynamicInput
              label="Đường dẫn"
              type="link"
              value={props.link || ''}
              onChange={(val) => updateProp('link', val)}
              dynamicConfig={props.dynamicLink}
              onDynamicChange={(config) => updateProp('dynamicLink', config)}
              linkSettings={props.linkSettings}
              onLinkSettingsChange={(settings) => updateProp('linkSettings', settings)}
              placeholder="https://example.com/san-pham"
            />
          </div>
        )}
      </div>
    )}

    {name === 'Nút bấm' && (
      <div className="space-y-4">
        {renderStyleRow('Kiểu', (
          <select
            value={props.buttonPreset || 'custom'}
            onChange={(e) => updateProp('buttonPreset', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none w-full bg-white"
          >
            <option value="custom">Mặc định</option>
            <option value="primary">Nút chính (Primary)</option>
            <option value="secondary">Nút phụ (Secondary)</option>
          </select>
        ))}

        <DynamicInput
          label="Văn bản"
          type="text"
          value={props.text || ''}
          onChange={(val) => updateProp('text', val)}
          dynamicConfig={props.dynamicText}
          onDynamicChange={(config) => updateProp('dynamicText', config)}
        />

        <DynamicInput
          label="Liên kết"
          type="link"
          value={props.link || ''}
          onChange={(val) => updateProp('link', val)}
          dynamicConfig={props.dynamicLink}
          onDynamicChange={(config) => updateProp('dynamicLink', config)}
          linkSettings={props.linkSettings}
          onLinkSettingsChange={(settings) => updateProp('linkSettings', settings)}
          placeholder="#"
        />

        <div className="mt-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Biểu tượng</label>
          <div 
            style={{
              backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
              backgroundSize: '16px 16px',
            }}
            className="w-full h-24 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
          >
            {/* Trash icon to clear selected icon */}
            {props.iconName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateProp('iconName', '');
                }}
                className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                title="Xóa biểu tượng"
              >
                <Lucide.Trash2 size={12} />
              </button>
            )}

            {/* Hidden input for direct SVG upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleSvgUpload} 
              accept=".svg" 
              className="hidden" 
            />

            {/* Icon Preview - Click opens library modal */}
            <div 
              onClick={() => onOpenIcon(
                props.iconName || 'Star', 
                (iconName: string) => updateProp('iconName', iconName)
              )}
              className="flex-1 flex items-center justify-center cursor-pointer p-2 hover:bg-slate-900/5 transition-colors"
              title="Click để chọn biểu tượng từ thư viện"
            >
              {!props.iconName ? (
                <div className="flex flex-col items-center gap-1 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <Lucide.ChevronDown size={16} />
                  Chọn biểu tượng
                </div>
              ) : (
                props.iconName.startsWith('/') || props.iconName.startsWith('http') ? (
                  <img 
                    src={props.iconName} 
                    alt="" 
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                    className="transition-transform duration-200 hover:scale-105"
                  />
                ) : (
                  React.createElement((Lucide as any)[props.iconName] || Lucide.HelpCircle, {
                    size: 32,
                    color: '#475569',
                    className: 'transition-transform duration-200 hover:scale-105'
                  })
                )
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="h-7 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
              <button
                type="button"
                onClick={() => onOpenIcon(
                  props.iconName || 'Star', 
                  (iconName: string) => updateProp('iconName', iconName)
                )}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              >
                Thư viện
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
              </button>
            </div>
          </div>
        </div>

        {props.iconName && (
          <>
            {renderStyleRow(renderResponsiveLabel('Vị trí biểu tượng', 'iconPosition'), renderSegmentedControl(props.iconPosition,
              'left',
              [
                { value: 'left', label: 'Bên trái' },
                { value: 'right', label: 'Bên phải' },
              ] as const,
              (value: string) => updateProp('iconPosition', value)
            ))}
            {renderStyleRow(renderResponsiveLabel('Khoảng cách biểu tượng', 'iconSpacing'), renderUnitControl('iconSpacing', '8', 'px', { min: 0, max: 100 }))}
          </>
        )}

        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {renderStyleRow('ID của Nút', (
            <input
              type="text"
              value={props.buttonId || ''}
              onChange={(e) => updateProp('buttonId', e.target.value)}
              className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500"
            />
          ))}
          <p className="text-[9px] text-slate-400 font-medium italic mt-1 leading-relaxed">
            Hãy đảm bảo rằng ID là duy nhất và không được sử dụng ở nơi khác trên trang. Trường này cho phép A-z 0-9 & dấu gạch dưới, không có dấu cách.
          </p>
        </div>
      </div>
    )}

    {name === 'Video' && (
      <div className="space-y-4 font-sans">
        {/* 1. Accordion Video Settings */}
        {renderAccordionSection('video_block_video_settings', 'Video', (
          <div className="space-y-3.5 pt-1">
            {/* Nguồn */}
            {renderStyleRow('Nguồn', (
              <select
                value={props.source || 'youtube'}
                onChange={(e) => {
                  updateProp('source', e.target.value);
                  updateProp('url', ''); // clear url on source switch
                }}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="youtube">YouTube</option>
                <option value="self_hosted">Tự lưu trữ</option>
              </select>
            ))}

            {/* Liên kết */}
            {renderStyleRow('Liên kết', (
              <div className="flex gap-1 items-center w-full">
                <input
                  type="text"
                  value={props.url || ''}
                  onChange={(e) => updateProp('url', e.target.value)}
                  className="h-7 flex-1 rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500"
                  placeholder={
                    props.source === 'self_hosted'
                      ? 'Chọn file video hoặc nhập liên kết...'
                      : 'https://www.youtube.com/watch?v=...'
                  }
                />
                {props.source === 'self_hosted' && (
                  <button
                    type="button"
                    onClick={() => onOpenMedia((url: string) => updateProp('url', url))}
                    className="h-7 px-2 rounded border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 hover:border-brand-400 hover:text-brand-600 shrink-0 cursor-pointer"
                  >
                    Chọn file
                  </button>
                )}
                {props.url && (
                  <button
                    type="button"
                    onClick={() => updateProp('url', '')}
                    className="h-7 w-7 rounded border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-red-500 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Xóa liên kết"
                  >
                    <Lucide.Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}

            {/* Thời gian bắt đầu / kết thúc */}
            {renderStyleRow('Thời gian bắt đầu', (
              <div className="space-y-1 w-full">
                <input
                  type="number"
                  min="0"
                  value={props.startTime ?? ''}
                  onChange={(e) => updateProp('startTime', e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500"
                  placeholder="Ví dụ: 10"
                />
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">Chỉ định thời gian bắt đầu (tính bằng giây)</p>
              </div>
            ))}

            {renderStyleRow('Thời gian kết thúc', (
              <div className="space-y-1 w-full">
                <input
                  type="number"
                  min="0"
                  value={props.endTime ?? ''}
                  onChange={(e) => updateProp('endTime', e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500"
                  placeholder="Ví dụ: 90"
                />
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">Chỉ định thời gian kết thúc (tính bằng giây)</p>
              </div>
            ))}

            {/* Các tùy chọn cho video */}
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] pt-2.5 border-t border-slate-100">
              Các tùy chọn cho video
            </div>

            {renderToggleControl('Tự động chơi', Boolean(props.autoplay), (val: boolean) => updateProp('autoplay', val), {
              note: 'Lưu ý: Tính năng Tự động phát bị ảnh hưởng bởi <a href="https://developer.chrome.com/blog/autoplay/" target="_blank" rel="noopener noreferrer" class="text-brand-600 font-black hover:underline">chính sách Tự động phát</a> của Google trên trình duyệt Chrome.'
            })}

            {renderToggleControl('Tắt tiếng', Boolean(props.mute), (val: boolean) => updateProp('mute', val))}

            {renderToggleControl('Lặp lại', Boolean(props.loop), (val: boolean) => updateProp('loop', val))}

            {renderToggleControl('Điều khiển trình phát', props.controls !== false, (val: boolean) => updateProp('controls', val), {
              activeLabel: 'Hiện',
              inactiveLabel: 'Ẩn'
            })}

            {renderToggleControl('Captions', Boolean(props.captions), (val: boolean) => updateProp('captions', val))}

            {renderToggleControl('Chế độ riêng tư', Boolean(props.privacy), (val: boolean) => updateProp('privacy', val), {
              note: 'Khi bạn bật chế độ riêng tư, YouTube sẽ không lưu thông tin về người truy cập trên web của bạn nếu họ không chơi video.'
            })}

            {renderToggleControl('Tải trì hoãn', Boolean(props.lazyLoad), (val: boolean) => updateProp('lazyLoad', val))}

            {props.source === 'youtube' && renderStyleRow('Video được đề xuất', (
              <select
                value={props.suggestedVideos || 'current'}
                onChange={(e) => updateProp('suggestedVideos', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="current">Kênh video hiện tại</option>
                <option value="any">Bất kỳ video nào</option>
              </select>
            ))}
          </div>
        ), true)}

        {/* 2. Accordion Image Overlay Settings */}
        {renderAccordionSection('video_block_image_overlay', 'Lớp phủ hình ảnh', (
          <div className="space-y-3.5 pt-1">
            {renderToggleControl('Lớp phủ hình ảnh', Boolean(props.showOverlay), (val: boolean) => updateProp('showOverlay', val), {
              activeLabel: 'Hiện',
              inactiveLabel: 'Ẩn'
            })}

            {props.showOverlay && (
              <>
                {renderStyleRow(
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    Chọn ảnh
                    <Lucide.Sparkles size={11} className="text-pink-500 animate-pulse" />
                  </span>,
                  <div 
                    onClick={() => onOpenMedia((url: string) => updateProp('overlayImage', url))}
                    className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/10] group/picker select-none shadow-sm cursor-pointer hover:border-slate-300 transition-colors w-full"
                  >
                    {props.overlayImage ? (
                      <img src={props.overlayImage} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 pb-10">
                        <Lucide.Image className="w-8 h-8 mb-1.5 opacity-50 text-slate-400" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold">Chưa chọn hình ảnh</span>
                      </div>
                    )}
                    {props.overlayImage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProp('overlayImage', '');
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 hover:bg-slate-950 text-white rounded flex items-center justify-center transition-colors shadow-md active:scale-95 cursor-pointer z-10"
                        title="Xóa hình ảnh"
                      >
                        <Lucide.Trash2 size={12} />
                      </button>
                    )}
                    <div className="absolute bottom-0 inset-x-0 h-9 bg-slate-900/95 flex items-center text-xs font-semibold text-white justify-center">
                      Chọn ảnh
                    </div>
                  </div>
                )}

                {renderStyleRow('Độ phân giải hình ảnh', (
                  <select
                    value={props.overlayImageResolution || 'full'}
                    onChange={(e) => updateProp('overlayImageResolution', e.target.value)}
                    className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
                  >
                    <option value="full">Đầy đủ</option>
                    <option value="large">Lớn</option>
                    <option value="medium">Trung bình</option>
                    <option value="thumbnail">Thumbnail</option>
                  </select>
                ))}

                {renderToggleControl('Icon phát', props.showPlayIcon !== false, (val: boolean) => updateProp('showPlayIcon', val), {
                  activeLabel: 'Hiện',
                  inactiveLabel: 'Ẩn'
                })}

                {props.showPlayIcon !== false && (
                  <>
                    {renderStyleRow('Biểu tượng', (
                      <div className="flex rounded border border-slate-200 overflow-hidden bg-slate-50 w-full">
                        <button
                          type="button"
                          onClick={() => updateProp('playIconType', 'default')}
                          className={`flex-1 py-1 flex items-center justify-center hover:bg-slate-100 transition-colors ${props.playIconType === 'default' || !props.playIconType ? 'bg-white font-bold text-brand-600 shadow-sm border-r border-l border-slate-100' : 'text-slate-400'}`}
                          title="Mặc định"
                        >
                          <Lucide.PlayCircle size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProp('playIconType', 'svg')}
                          className={`flex-1 py-1 flex items-center justify-center hover:bg-slate-100 transition-colors ${props.playIconType === 'svg' ? 'bg-white font-bold text-brand-600 shadow-sm border-r border-l border-slate-100' : 'text-slate-400'}`}
                          title="Tải lên SVG"
                        >
                          <Lucide.Upload size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateProp('playIconType', 'lucide')}
                          className={`flex-1 py-1 flex items-center justify-center hover:bg-slate-100 transition-colors ${props.playIconType === 'lucide' ? 'bg-white font-bold text-brand-600 shadow-sm border-r border-l border-slate-100' : 'text-slate-400'}`}
                          title="Chọn Icon"
                        >
                          <Lucide.Star size={14} />
                        </button>
                      </div>
                    ))}

                    {props.playIconType === 'svg' && renderStyleRow('Mã SVG', (
                      <textarea
                        value={props.playIconSvg || ''}
                        onChange={(e) => updateProp('playIconSvg', e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-brand-500 font-mono text-[9px] text-slate-700 bg-white"
                        placeholder="Nhập mã <svg>...</svg>"
                      />
                    ))}

                    {props.playIconType === 'lucide' && renderStyleRow('Tên Icon (Lucide)', (
                      <input
                        type="text"
                        value={props.playIconLucide || 'Play'}
                        onChange={(e) => updateProp('playIconLucide', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                        placeholder="Ví dụ: Play, PlayCircle, Tv, Video"
                      />
                    ))}
                  </>
                )}

                {renderToggleControl('Lightbox', Boolean(props.lightbox), (val: boolean) => updateProp('lightbox', val), {
                  activeLabel: 'Bật',
                  inactiveLabel: 'Tắt'
                })}
              </>
            )}
          </div>
        ), false)}
      </div>
    )}

    {name === 'Khoảng trống' && (
      <div className="space-y-3">
        {renderStyleRow(renderResponsiveLabel('Chiều cao', 'heightProp'), renderUnitControl('heightProp', '30', 'px', { min: 10, max: 300 }))}
      </div>
    )}

    {name === 'Biểu tượng' && (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biểu tượng</label>
          <div 
            style={{
              backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
              backgroundSize: '16px 16px',
            }}
            className="w-full h-32 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
          >
            {/* Trash icon to clear selected icon */}
            {props.iconName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateProp('iconName', '');
                  updateProp('iconStyle', 'outline');
                }}
                className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                title="Xóa biểu tượng"
              >
                <Trash2 size={12} />
              </button>
            )}

            {/* Hidden input for direct SVG upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleSvgUpload} 
              accept=".svg" 
              className="hidden" 
            />

            {/* Icon Preview - Click opens library modal */}
            <div 
              onClick={() => onOpenIcon(
                props.iconName || 'Star', 
                (iconName: string, iconStyle: string) => {
                  updateProp('iconName', iconName);
                  updateProp('iconStyle', iconStyle);
                },
                props.iconStyle
              )}
              className="flex-1 flex items-center justify-center cursor-pointer p-4 hover:bg-slate-900/5 transition-colors"
              title="Click để chọn biểu tượng từ thư viện"
            >
              {!props.iconName ? (
                <div className="flex flex-col items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <Lucide.ChevronDown size={16} />
                  Chọn biểu tượng
                </div>
              ) : (
                props.iconStyle === 'custom' || props.iconName.startsWith('/') || props.iconName.startsWith('http') ? (
                  <img 
                    src={props.iconName} 
                    alt="" 
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                    className="transition-transform duration-200 hover:scale-105"
                  />
                ) : (
                  React.createElement((Lucide as any)[props.iconName] || Lucide.HelpCircle, {
                    size: 48,
                    color: props.primaryColor || '#475569',
                    fill: props.iconStyle === 'solid' ? (props.primaryColor || '#475569') : 'none',
                    className: 'transition-transform duration-200 hover:scale-105'
                  })
                )
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="h-8 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
              <button
                type="button"
                onClick={() => onOpenIcon(
                  props.iconName || 'Star', 
                  (iconName: string, iconStyle: string) => {
                    updateProp('iconName', iconName);
                    updateProp('iconStyle', iconStyle);
                  },
                  props.iconStyle
                )}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              >
                Thư viện biểu tượng
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
              </button>
            </div>
          </div>
        </div>

        {renderStyleRow('Xem', (
          <select
            value={props.iconView || 'default'}
            onChange={(e) => updateProp('iconView', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white animate-fade-in"
          >
            <option value="default">Mặc định</option>
            <option value="stacked">Xếp chồng</option>
            <option value="framed">Đóng khung</option>
          </select>
        ))}

        {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow('Hình dáng', (
          <select
            value={props.iconShape || 'circle'}
            onChange={(e) => updateProp('iconShape', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white"
          >
            <option value="square">Hình vuông</option>
            <option value="rounded">Bo tròn góc</option>
            <option value="circle">Hình tròn</option>
          </select>
        ))}

        {renderStyleRow('Đường dẫn link', (
          <input
            type="text"
            value={props.link || ''}
            onChange={(e) => updateProp('link', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none w-full focus:border-brand-500"
            placeholder="https://..."
          />
        ))}
      </div>
    )}

    {(name === 'Icon Mạng Xã Hội' || name === 'SocialIconsBlock') && (
      <div className="space-y-4">
        {/* General Settings */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cài đặt chung</label>
          
          {renderStyleRow(renderResponsiveLabel('Căn lề', 'align'), renderSegmentedControl(props.align || 'center',
            'center',
            [
              { value: 'left', label: 'Trái' },
              { value: 'center', label: 'Giữa' },
              { value: 'right', label: 'Phải' },
            ] as const,
            (value: string) => updateProp('align', value)
          ))}

          {renderStyleRow(renderResponsiveLabel('Hình dạng', 'shape'), renderSegmentedControl(props.shape || 'rounded',
            'rounded',
            [
              { value: 'square', label: 'Vuông' },
              { value: 'rounded', label: 'Bo góc' },
              { value: 'circle', label: 'Tròn' },
            ] as const,
            (value: string) => updateProp('shape', value)
          ))}

          {renderStyleRow(renderResponsiveLabel('Kiểu hiển thị', 'iconView'), renderSegmentedControl(props.iconView || 'default',
            'default',
            [
              { value: 'default', label: 'Mặc định' },
              { value: 'stacked', label: 'Đầy' },
              { value: 'framed', label: 'Khung' },
            ] as const,
            (value: string) => updateProp('iconView', value)
          ))}

          {renderStyleRow('Số cột', (
            <select
              value={props.columns || 'auto'}
              onChange={(e) => updateProp('columns', e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
              className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
            >
              <option value="auto">Tự động (Dòng)</option>
              <option value="1">1 Cột</option>
              <option value="2">2 Cột</option>
              <option value="3">3 Cột</option>
              <option value="4">4 Cột</option>
              <option value="5">5 Cột</option>
              <option value="6">6 Cột</option>
              <option value="8">8 Cột</option>
              <option value="10">10 Cột</option>
              <option value="12">12 Cột</option>
            </select>
          ))}
        </div>

        {/* Global Color override */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Màu sắc mặc định</label>
          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'itemColorMode'), renderSegmentedControl(props.itemColorMode || 'official',
            'official',
            [
              { value: 'official', label: 'Thương hiệu' },
              { value: 'custom', label: 'Tùy chỉnh' },
            ] as const,
            (value: string) => updateProp('itemColorMode', value)
          ))}

          {props.itemColorMode === 'custom' && (
            <div className="space-y-2 mt-2 pl-1">
              {renderStyleRow(renderResponsiveLabel('Màu icon', 'itemCustomColor'), renderColorControl('itemCustomColor',
                '#3b82f6'
              ))}
              {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Màu phụ', 'itemCustomSecondaryColor'), renderColorControl('itemCustomSecondaryColor',
                '#ffffff'
              ))}
            </div>
          )}
        </div>

        {/* Icon Items */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Danh sách icon mạng xã hội</label>
          <div className="space-y-3">
            {(props.items || []).map((item: any, idx: number) => {
              const isExpanded = expandedSocialItemIdx === idx;
              return (
                <div 
                  key={idx} 
                  draggable
                  onDragStart={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input') || target.closest('select')) {
                      e.preventDefault();
                      return;
                    }
                    setDraggedSocialItemIdx(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedSocialItemIdx === null || draggedSocialItemIdx === idx) return;
                    const newItems = [...(props.items || [])];
                    const draggedItem = newItems[draggedSocialItemIdx];
                    newItems.splice(draggedSocialItemIdx, 1);
                    newItems.splice(idx, 0, draggedItem);
                    updateProp('items', newItems);
                    
                    if (expandedSocialItemIdx === draggedSocialItemIdx) {
                      setExpandedSocialItemIdx(idx);
                    } else if (expandedSocialItemIdx !== null) {
                      setExpandedSocialItemIdx(idx);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedSocialItemIdx(null);
                  }}
                  className={`border border-slate-200 rounded-lg bg-white mb-2 shadow-sm transition-all duration-200 ${
                    isExpanded ? 'overflow-visible' : 'overflow-hidden'
                  } ${
                    draggedSocialItemIdx === idx ? 'opacity-40 border-dashed border-brand-300' : ''
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    className={`flex items-center justify-between px-2.5 py-1.5 bg-slate-50/75 hover:bg-slate-100/75 cursor-grab active:cursor-grabbing select-none ${
                      isExpanded ? 'border-b border-slate-200' : ''
                    }`}
                    onClick={() => setExpandedSocialItemIdx(isExpanded ? null : idx)}
                  >
                    <div className="flex items-center gap-1.5 max-w-[70%]">
                      <Lucide.GripVertical size={11} className="text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-700 capitalize truncate">
                        {item.platform || `Mạng xã hội #${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newItems = [...(props.items || [])];
                          newItems.splice(idx + 1, 0, {
                            ...item,
                          });
                          updateProp('items', newItems);
                          setExpandedSocialItemIdx(idx + 1);
                        }}
                        className="text-slate-400 hover:text-brand-500 text-[10px] p-0.5"
                        title="Nhân bản"
                      >
                        ❐
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newItems = [...(props.items || [])];
                          newItems.splice(idx, 1);
                          updateProp('items', newItems);
                          if (expandedSocialItemIdx === idx) {
                            setExpandedSocialItemIdx(null);
                          } else if (expandedSocialItemIdx !== null && expandedSocialItemIdx > idx) {
                            setExpandedSocialItemIdx(expandedSocialItemIdx - 1);
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 text-[10px] p-0.5"
                        title="Xóa"
                      >
                        ✕
                      </button>
                      <Lucide.ChevronDown
                        size={10}
                        className={`text-slate-400 transform transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </div>
                  </div>

                  {/* Collapsible details */}
                  {isExpanded && (
                    <div className="p-2.5 bg-white space-y-3 border-t border-slate-100 font-sans">
                      {/* 1. Biểu tượng Section */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Biểu tượng</label>
                        <div 
                          style={{
                            backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
                            backgroundSize: '16px 16px',
                          }}
                          className="w-full h-24 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
                        >
                          {/* Trash icon to clear selected icon */}
                          {item.platform && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems[idx] = { ...item, platform: '' };
                                updateProp('items', newItems);
                              }}
                              className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                              title="Xóa biểu tượng"
                            >
                              <Lucide.Trash2 size={12} />
                            </button>
                          )}

                          {/* Hidden input for direct SVG upload */}
                          <input 
                            type="file" 
                            id={`social-item-svg-upload-${idx}`}
                            onChange={async (e) => {
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
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, platform: data.media.url };
                                  updateProp('items', newItems);
                                } else {
                                  alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
                                }
                              } catch (error) {
                                alert('Lỗi kết nối máy chủ!');
                                console.error(error);
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                            accept=".svg" 
                            className="hidden" 
                          />

                          {/* Icon Preview - Click opens library modal */}
                          <div 
                            onClick={() => onOpenIcon(
                              item.platform || 'Globe', 
                              (selectedIcon: string) => {
                                const newItems = [...(props.items || [])];
                                newItems[idx] = { ...item, platform: selectedIcon };
                                updateProp('items', newItems);
                              }
                            )}
                            className="flex-1 flex items-center justify-center cursor-pointer p-4 hover:bg-slate-900/5 transition-colors"
                            title="Click để chọn biểu tượng từ thư viện"
                          >
                            {!item.platform ? (
                              <div className="flex flex-col items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                <Lucide.ChevronDown size={16} />
                                Chọn biểu tượng
                              </div>
                            ) : (
                              item.platform.startsWith('/') || item.platform.startsWith('http') ? (
                                <img 
                                  src={item.platform} 
                                  alt="" 
                                  style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                                  className="transition-transform duration-200 hover:scale-105"
                                />
                              ) : (() => {
                                const platformData = getSocialIcon(item.platform);
                                if (platformData) {
                                  return (
                                    <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }} fill="#475569" className="transition-transform duration-200 hover:scale-105">
                                      <path d={platformData.path} />
                                    </svg>
                                  );
                                }
                                return React.createElement((Lucide as any)[item.platform] || Lucide.HelpCircle, {
                                  size: 32,
                                  color: '#475569',
                                  className: 'transition-transform duration-200 hover:scale-105'
                                });
                              })()
                            )}
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="h-8 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenIcon(
                                item.platform || 'Globe', 
                                (selectedIcon: string) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, platform: selectedIcon };
                                  updateProp('items', newItems);
                                }
                              )}
                              className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                            >
                              Thư viện
                            </button>
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => document.getElementById(`social-item-svg-upload-${idx}`)?.click()}
                              className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. Liên kết Section */}
                      <DynamicInput
                        label="Liên kết"
                        type="link"
                        value={item.link || ''}
                        onChange={(val) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, link: val };
                          updateProp('items', newItems);
                        }}
                        dynamicConfig={item.dynamicLink}
                        onDynamicChange={(config) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, dynamicLink: config };
                          updateProp('items', newItems);
                        }}
                        linkSettings={item.linkSettings}
                        onLinkSettingsChange={(settings) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, linkSettings: settings };
                          updateProp('items', newItems);
                        }}
                        placeholder="Dán URL hoặc loại"
                      />

                      {/* 3. Màu sắc Section */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Màu sắc</label>
                        <select
                          value={item.colorMode || 'official'}
                          onChange={(e) => {
                            const newItems = [...(props.items || [])];
                            newItems[idx] = { ...item, colorMode: e.target.value };
                            updateProp('items', newItems);
                          }}
                          className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white font-medium"
                        >
                          <option value="official">Màu thương hiệu</option>
                          <option value="custom">Màu tùy chỉnh</option>
                        </select>
                      </div>

                      {item.colorMode === 'custom' && (
                        <div className="space-y-2 pl-1 border-l-2 border-slate-100 mt-2">
                          {renderStyleRow(renderResponsiveLabel('Màu icon', 'item-${idx}-customColor'), renderColorControl('item-${idx}-customColor',
                            '#3b82f6',
                            undefined,
                            item.customColor,
                            (val: string) => {
                              const newItems = [...(props.items || [])];
                              newItems[idx] = { ...item, customColor: val };
                              updateProp('items', newItems);
                            }
                          ))}
                          {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Màu phụ', 'item-${idx}-customSecondaryColor'), renderColorControl('item-${idx}-customSecondaryColor',
                            '#ffffff',
                            undefined,
                            item.customSecondaryColor,
                            (val: string) => {
                              const newItems = [...(props.items || [])];
                              newItems[idx] = { ...item, customSecondaryColor: val };
                              updateProp('items', newItems);
                            }
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const newItems = [...(props.items || [])];
                newItems.push({
                  platform: 'facebook',
                  link: 'https://',
                  colorMode: 'official',
                });
                updateProp('items', newItems);
                setExpandedSocialItemIdx(newItems.length - 1);
              }}
              className="w-full py-2 border border-dashed border-slate-300 hover:border-brand-500 rounded-lg text-[10px] font-bold text-slate-500 hover:text-brand-600 bg-white hover:bg-brand-50/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              + Thêm mạng xã hội
            </button>
          </div>
        </div>
      </div>
    )}

    {name === 'Hộp Icon' && (
      <div className="space-y-4">
        {/* 1. Biểu tượng Section */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biểu tượng</label>
          <div 
            style={{
              backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
              backgroundSize: '16px 16px',
            }}
            className="w-full h-32 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
          >
            {props.iconName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateProp('iconName', '');
                  updateProp('iconStyle', 'outline');
                }}
                className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                title="Xóa biểu tượng"
              >
                <Trash2 size={12} />
              </button>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleSvgUpload} 
              accept=".svg" 
              className="hidden" 
            />

            <div 
              onClick={() => onOpenIcon(
                props.iconName || 'Star', 
                (iconName: string, iconStyle: string) => {
                  updateProp('iconName', iconName);
                  updateProp('iconStyle', iconStyle);
                },
                props.iconStyle
              )}
              className="flex-1 flex items-center justify-center cursor-pointer p-4 hover:bg-slate-900/5 transition-colors"
              title="Click để chọn biểu tượng từ thư viện"
            >
              {!props.iconName ? (
                <div className="flex flex-col items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                  <ChevronDown size={16} />
                  Chọn biểu tượng
                </div>
              ) : (
                props.iconStyle === 'custom' || props.iconName.startsWith('/') || props.iconName.startsWith('http') ? (
                  <img 
                    src={props.iconName} 
                    alt="" 
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                    className="transition-transform duration-200 hover:scale-105"
                  />
                ) : (
                  React.createElement((Lucide as any)[props.iconName] || Lucide.HelpCircle, {
                    size: 48,
                    color: props.iconColor || '#3b82f6',
                    fill: props.iconStyle === 'solid' ? (props.iconColor || '#3b82f6') : 'none',
                    className: 'transition-transform duration-200 hover:scale-105'
                  })
                )
              )}
            </div>

            <div className="h-8 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
              <button
                type="button"
                onClick={() => onOpenIcon(
                  props.iconName || 'Star', 
                  (iconName: string, iconStyle: string) => {
                    updateProp('iconName', iconName);
                    updateProp('iconStyle', iconStyle);
                  },
                  props.iconStyle
                )}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              >
                Thư viện biểu tượng
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
              </button>
            </div>
          </div>
        </div>

        {renderStyleRow('Xem', (
          <select
            value={props.iconView || 'default'}
            onChange={(e) => updateProp('iconView', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white"
          >
            <option value="default">Mặc định</option>
            <option value="stacked">Xếp chồng</option>
            <option value="framed">Đóng khung</option>
          </select>
        ))}

        {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow('Hình dáng', (
          <select
            value={props.iconShape || 'circle'}
            onChange={(e) => updateProp('iconShape', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white"
          >
            <option value="square">Hình vuông</option>
            <option value="rounded">Bo tròn góc</option>
            <option value="circle">Hình tròn</option>
          </select>
        ))}

        {/* 2. Tiêu đề, Mô tả, Liên kết */}
        <DynamicInput
          label="Tiêu đề"
          type="text"
          value={props.title || ''}
          onChange={(val) => updateProp('title', val)}
          dynamicConfig={props.dynamicTitle}
          onDynamicChange={(config) => updateProp('dynamicTitle', config)}
          placeholder="Tiêu đề hộp icon"
        />

        <DynamicInput
          label="Mô tả"
          type="textarea"
          value={props.description || ''}
          onChange={(val) => updateProp('description', val)}
          dynamicConfig={props.dynamicDescription}
          onDynamicChange={(config) => updateProp('dynamicDescription', config)}
          placeholder="Nhập mô tả cho hộp icon"
        />

        <DynamicInput
          label="Liên kết"
          type="link"
          value={props.link || ''}
          onChange={(val) => updateProp('link', val)}
          dynamicConfig={props.dynamicLink}
          onDynamicChange={(config) => updateProp('dynamicLink', config)}
          linkSettings={props.linkSettings}
          onLinkSettingsChange={(settings) => updateProp('linkSettings', settings)}
          placeholder="Đường dẫn liên kết https://..."
        />

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiêu đề thẻ HTML</label>
          <select
            value={props.titleTag || 'h3'}
            onChange={(e) => updateProp('titleTag', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white"
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
            <option value="h5">H5</option>
            <option value="h6">H6</option>
            <option value="div">div</option>
            <option value="span">span</option>
            <option value="p">p</option>
          </select>
        </div>
      </div>
    )}
    {name === 'Hộp hình ảnh' && (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hình ảnh</label>
          <div className="flex gap-2">
            {props.url && (
              <div className="w-16 h-16 border border-slate-200 rounded overflow-hidden relative group">
                <img src={props.url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => updateProp('url', '')}
                  className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"
                >
                  <Trash2 size={12} />
                  <span className="text-[8px] font-bold mt-0.5 uppercase">Xóa</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => onOpenMedia?.((url: string) => updateProp('url', url))}
              className={`flex-1 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded hover:border-brand-500 hover:bg-brand-50 transition-colors ${!props.url ? 'w-full' : ''}`}
            >
              <Lucide.Image size={18} className="text-slate-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-500">Chọn hình ảnh</span>
            </button>
          </div>
        </div>

        {renderStyleRow('Độ phân giải', (
          <select
            value={props.imageResolution || 'large'}
            onChange={(e) => updateProp('imageResolution', e.target.value)}
            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white"
          >
            <option value="thumbnail">Thumbnail</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full</option>
          </select>
        ))}

        {renderStyleRow(renderResponsiveLabel('Vị trí ảnh', 'imagePosition'), renderSegmentedControl(props.imagePosition,
          'top',
          [
            { value: 'left', label: <Lucide.AlignLeft size={14} /> },
            { value: 'top', label: <Lucide.ArrowUp size={14} /> },
            { value: 'right', label: <Lucide.AlignRight size={14} /> },
          ] as const,
          (value: string) => updateProp('imagePosition', value)
        ))}

        {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align,
          'center',
          [
            { value: 'left', label: <Lucide.AlignLeft size={14} /> },
            { value: 'center', label: <Lucide.AlignCenter size={14} /> },
            { value: 'right', label: <Lucide.AlignRight size={14} /> },
            { value: 'justify', label: <Lucide.AlignJustify size={14} /> },
          ] as const,
          (value: string) => updateProp('align', value)
        ))}

        <DynamicInput
          label="Tiêu đề"
          type="text"
          value={props.title || ''}
          onChange={(val) => updateProp('title', val)}
          dynamicConfig={props.dynamicTitle}
          onDynamicChange={(config) => updateProp('dynamicTitle', config)}
          placeholder="Tiêu đề hộp hình ảnh"
        />

        <DynamicInput
          label="Mô tả"
          type="textarea"
          value={props.description || ''}
          onChange={(val) => updateProp('description', val)}
          dynamicConfig={props.dynamicDescription}
          onDynamicChange={(config) => updateProp('dynamicDescription', config)}
          placeholder="Nhập mô tả"
        />

        <DynamicInput
          label="Liên kết"
          type="link"
          value={props.link || ''}
          onChange={(val) => updateProp('link', val)}
          dynamicConfig={props.dynamicLink}
          onDynamicChange={(config) => updateProp('dynamicLink', config)}
          linkSettings={props.linkSettings}
          onLinkSettingsChange={(settings) => updateProp('linkSettings', settings)}
          placeholder="Đường dẫn liên kết https://..."
        />

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiêu đề thẻ HTML</label>
          <select
            value={props.titleTag || 'h3'}
            onChange={(e) => updateProp('titleTag', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-brand-500 font-semibold text-slate-700 bg-white"
          >
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
            <option value="h5">H5</option>
            <option value="h6">H6</option>
            <option value="div">div</option>
            <option value="span">span</option>
            <option value="p">p</option>
          </select>
        </div>
      </div>
    )}

    {name === 'Đường phân cách' && (
      <div className="space-y-4">
        {renderStyleSection('Đường phân cách', (
          <>
            {renderStyleRow('Kiểu hiển thị', (
              <select value={props.style || 'solid'} onChange={(e) => updateProp('style', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white">
                <option value="solid">Nét liền</option>
                <option value="dashed">Nét đứt</option>
                <option value="dotted">Chấm bi</option>
              </select>
            ))}
            {renderStyleRow(renderResponsiveLabel('Chiều rộng', 'dividerWidth'), renderUnitControl('dividerWidth', '100', '%', { min: 1, max: 100 }))}
            {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align,
              'center',
              [
                { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                { value: 'right', label: <Lucide.AlignRight size={14} /> },
              ] as const,
              (value: string) => updateProp('align', value)
            ))}
          </>
        ))}

        {renderStyleSection('Thêm thành phần', (
          <>
            {renderStyleRow(renderResponsiveLabel('Loại', 'elementType'), renderSegmentedControl(props.elementType,
              'none',
              [
                { value: 'none', label: <Lucide.Ban size={14} /> },
                { value: 'text', label: <Lucide.Type size={14} /> },
                { value: 'icon', label: <Lucide.Star size={14} /> },
              ] as const,
              (value: string) => updateProp('elementType', value)
            ))}
            
            {props.elementType === 'text' && (
              renderStyleRow('Văn bản', (
                <input
                  type="text"
                  value={props.text || 'Đường phân cách'}
                  onChange={(e) => updateProp('text', e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500"
                />
              ))
            )}

            {props.elementType === 'icon' && (
              <div className="mt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Biểu tượng</label>
                <div 
                  style={{
                    backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
                    backgroundSize: '16px 16px',
                  }}
                  className="w-full h-32 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
                >
                  {/* Trash icon to clear selected icon */}
                  {props.iconName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateProp('iconName', '');
                      }}
                      className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                      title="Xóa biểu tượng"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}

                  {/* Hidden input for direct SVG upload */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleSvgUpload} 
                    accept=".svg" 
                    className="hidden" 
                  />

                  {/* Icon Preview - Click opens library modal */}
                  <div 
                    onClick={() => onOpenIcon(
                      props.iconName || 'Star', 
                      (iconName: string) => updateProp('iconName', iconName)
                    )}
                    className="flex-1 flex items-center justify-center cursor-pointer p-4 hover:bg-slate-900/5 transition-colors"
                    title="Click để chọn biểu tượng từ thư viện"
                  >
                    {!props.iconName ? (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                        <Lucide.ChevronDown size={16} />
                        Chọn biểu tượng
                      </div>
                    ) : (
                      props.iconName.startsWith('/') || props.iconName.startsWith('http') ? (
                        <img 
                          src={props.iconName} 
                          alt="" 
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                          className="transition-transform duration-200 hover:scale-105"
                        />
                      ) : (
                        React.createElement((Lucide as any)[props.iconName] || Lucide.HelpCircle, {
                          size: 48,
                          color: props.iconColor || '#475569',
                          className: 'transition-transform duration-200 hover:scale-105'
                        })
                      )
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="h-8 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenIcon(
                        props.iconName || 'Star', 
                        (iconName: string) => updateProp('iconName', iconName)
                      )}
                      className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                    >
                      Thư viện biểu tượng
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ))}
      </div>
    )}

    {name === 'Danh sách' && (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cài đặt chung</label>
          {renderStyleRow(renderResponsiveLabel('Bố cục', 'listLayout'), renderSegmentedControl(props.listLayout || 'vertical',
            'vertical',
            [
              { value: 'vertical', label: 'Danh sách' },
              { value: 'horizontal', label: 'Ngang' },
            ] as const,
            (value: string) => updateProp('listLayout', value)
          ))}
        </div>
        
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Các mục danh sách</label>
          <div className="space-y-3">
            {(props.items || []).map((item: any, idx: number) => {
              const isExpanded = expandedIconListItemIdx === idx;
              return (
                <div 
                  key={item.id} 
                  draggable
                  onDragStart={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
                      e.preventDefault();
                      return;
                    }
                    setDraggedIconListItemIdx(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIconListItemIdx === null || draggedIconListItemIdx === idx) return;
                    const newItems = [...(props.items || [])];
                    const draggedItem = newItems[draggedIconListItemIdx];
                    newItems.splice(draggedIconListItemIdx, 1);
                    newItems.splice(idx, 0, draggedItem);
                    updateProp('items', newItems);
                    
                    if (expandedIconListItemIdx === draggedIconListItemIdx) {
                      setExpandedIconListItemIdx(idx);
                    } else if (expandedIconListItemIdx !== null) {
                      const expandedId = props.items[expandedIconListItemIdx].id;
                      const newExpandedIdx = newItems.findIndex(x => x.id === expandedId);
                      setExpandedIconListItemIdx(newExpandedIdx !== -1 ? newExpandedIdx : null);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedIconListItemIdx(null);
                  }}
                  className={`border border-slate-200 rounded-lg overflow-hidden bg-white mb-2 shadow-sm transition-all duration-200 ${
                    draggedIconListItemIdx === idx ? 'opacity-40 border-dashed border-brand-300' : ''
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    className={`flex items-center justify-between px-2.5 py-1.5 bg-slate-50/75 hover:bg-slate-100/75 cursor-grab active:cursor-grabbing select-none ${
                      isExpanded ? 'border-b border-slate-200' : ''
                    }`}
                    onClick={() => setExpandedIconListItemIdx(isExpanded ? null : idx)}
                  >
                    <div className="flex items-center gap-1.5 max-w-[70%]">
                      <GripVertical size={11} className="text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-slate-600" />


                      {/* Icon preview indicator */}
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-500">
                        {(() => {
                          if (item.iconName && item.iconName.startsWith('/')) {
                            return <span className="text-[10px] font-bold">★</span>;
                          }
                          const IconComponent = getLucideReactComponent(item.iconName || 'Check');
                          return IconComponent ? <IconComponent size={12} className="text-slate-500" /> : <span>✓</span>;
                        })()}
                      </span>
                      
                      {/* Text preview */}
                      <span className="text-[10px] font-bold text-slate-700 truncate">
                        {item.text || `Mục ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Action buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newItems = [...(props.items || [])];
                          newItems.splice(idx + 1, 0, {
                            ...item,
                            id: String(Date.now() + Math.random()),
                          });
                          updateProp('items', newItems);
                          setExpandedIconListItemIdx(idx + 1);
                        }}
                        className="text-slate-400 hover:text-brand-500 text-[10px] p-0.5"
                        title="Nhân bản"
                      >
                        ❐
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newItems = [...(props.items || [])];
                          newItems.splice(idx, 1);
                          updateProp('items', newItems);
                          if (expandedIconListItemIdx === idx) {
                            setExpandedIconListItemIdx(null);
                          } else if (expandedIconListItemIdx !== null && expandedIconListItemIdx > idx) {
                            setExpandedIconListItemIdx(expandedIconListItemIdx - 1);
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 text-[10px] p-0.5"
                        title="Xóa"
                      >
                        ✕
                      </button>
                      <ChevronDown
                        size={10}
                        className={`text-slate-400 transform transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </div>
                  </div>

                  {/* Collapsible details */}
                  {isExpanded && (
                    <div className="p-2.5 bg-white space-y-3 border-t border-slate-100 font-sans">
                      {/* Text input with Dynamic Support */}
                      <DynamicInput
                        label="Văn bản hiển thị"
                        type="text"
                        value={item.text || ''}
                        onChange={(val) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, text: val };
                          updateProp('items', newItems);
                        }}
                        dynamicConfig={item.dynamicText}
                        onDynamicChange={(config) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, dynamicText: config };
                          updateProp('items', newItems);
                        }}
                        placeholder="Nội dung mục..."
                      />

                      {/* Icon selector with checkerboard preview area, matching consistent style */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Biểu tượng</label>
                        <div 
                          style={{
                            backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
                            backgroundSize: '16px 16px',
                          }}
                          className="w-full h-32 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
                        >
                          {/* Trash icon to clear selected icon */}
                          {item.iconName && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems[idx] = { ...item, iconName: '' };
                                updateProp('items', newItems);
                              }}
                              className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                              title="Xóa biểu tượng"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}

                          {/* Hidden input for direct SVG upload */}
                          <input 
                            type="file" 
                            id={`list-item-svg-upload-${idx}`}
                            onChange={async (e) => {
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
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, iconName: data.media.url };
                                  updateProp('items', newItems);
                                } else {
                                  alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
                                }
                              } catch (error) {
                                alert('Lỗi kết nối máy chủ!');
                                console.error(error);
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                            accept=".svg" 
                            className="hidden" 
                          />

                          {/* Icon Preview - Click opens library modal */}
                          <div 
                            onClick={() => onOpenIcon(
                              item.iconName || 'Check', 
                              (selectedIcon: string) => {
                                const newItems = [...(props.items || [])];
                                newItems[idx] = { ...item, iconName: selectedIcon };
                                updateProp('items', newItems);
                              }
                            )}
                            className="flex-1 flex items-center justify-center cursor-pointer p-4 hover:bg-slate-900/5 transition-colors"
                            title="Click để chọn biểu tượng từ thư viện"
                          >
                            {!item.iconName ? (
                              <div className="flex flex-col items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                <ChevronDown size={16} />
                                Chọn biểu tượng
                              </div>
                            ) : (
                              item.iconName.startsWith('/') || item.iconName.startsWith('http') ? (
                                <img 
                                  src={item.iconName} 
                                  alt="" 
                                  style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                                  className="transition-transform duration-200 hover:scale-105"
                                />
                              ) : (
                                React.createElement((Lucide as any)[item.iconName] || Lucide.HelpCircle, {
                                  size: 48,
                                  color: props.iconColor || '#475569',
                                  className: 'transition-transform duration-200 hover:scale-105'
                                })
                              )
                            )}
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="h-8 bg-slate-50 border-t border-slate-200 flex divide-x divide-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenIcon(
                                item.iconName || 'Check', 
                                (selectedIcon: string) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, iconName: selectedIcon };
                                  updateProp('items', newItems);
                                }
                              )}
                              className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                            >
                              Thư viện
                            </button>
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => document.getElementById(`list-item-svg-upload-${idx}`)?.click()}
                              className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isUploading ? 'Đang tải...' : 'Tải lên SVG'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Link input with Dynamic Support */}
                      <DynamicInput
                        label="Liên kết"
                        type="link"
                        value={item.link || ''}
                        onChange={(val) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, link: val };
                          updateProp('items', newItems);
                        }}
                        dynamicConfig={item.dynamicLink}
                        onDynamicChange={(config) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, dynamicLink: config };
                          updateProp('items', newItems);
                        }}
                        linkSettings={item.linkSettings}
                        onLinkSettingsChange={(settings) => {
                          const newItems = [...(props.items || [])];
                          newItems[idx] = { ...item, linkSettings: settings };
                          updateProp('items', newItems);
                        }}
                        placeholder="Dán URL hoặc loại"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const newItems = [...(props.items || [])];
                newItems.push({
                  id: String(Date.now()),
                  text: 'Mục danh sách mới',
                  iconName: 'Check',
                });
                updateProp('items', newItems);
              }}
              className="w-full h-8 border border-dashed border-slate-200 hover:border-brand-500 rounded-lg text-[10px] font-bold text-slate-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-1 bg-white cursor-pointer"
            >
              + Thêm mục mới
            </button>
          </div>
        </div>
      </div>
    )}

    {name === 'Menu' && (
      <div className="space-y-4">
        {/* SECTION 1: Layout */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandLayout', props._expandLayout !== false ? false : true)}>
            {(() => {
              const ChevronDownIcon = getLucideReactComponent('ChevronDown');
              return ChevronDownIcon ? <ChevronDownIcon size={14} className={`text-slate-400 transition-transform ${props._expandLayout !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Layout</label>
          </div>

          {props._expandLayout !== false && (
            <div className="space-y-4 pl-1 mt-2">
              {/* Menu Source */}
              {renderStyleRow('Nguồn menu', (
                <select
                  value={props.menuSource || 'header'}
                  onChange={(e) => {
                    const source = e.target.value;
                    updateProp('menuSource', source);
                    if (source === 'managed' && !props.menuId && managedMenus[0]) updateProp('menuId', managedMenus[0].id);
                  }}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="managed">Menu đã quản lý</option>
                  <option value="custom">Tự chọn (Custom Menu)</option>
                  <option value="header">Header cũ (tương thích)</option>
                  <option value="footer">Footer cũ (tương thích)</option>
                </select>
              ))}

              {props.menuSource === 'managed' && renderStyleRow('Chọn menu', (
                <select
                  value={props.menuId || ''}
                  onChange={(e) => updateProp('menuId', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="">— Chọn menu —</option>
                  {managedMenus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name} ({menu.itemCount} mục)</option>)}
                </select>
              ))}

              {/* Menu Items (if Custom) */}
              {props.menuSource === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menu Items</label>
                  <div className="space-y-3">
                    {(props.customItems || []).map((item: any, idx: number) => {
                      const isExpanded = expandedIconListItemIdx === idx;
                      return (
                        <div 
                          key={item.id || idx} 
                          draggable
                          onDragStart={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
                              e.preventDefault();
                              return;
                            }
                            setDraggedIconListItemIdx(idx);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedIconListItemIdx === null || draggedIconListItemIdx === idx) return;
                            const newItems = [...(props.customItems || [])];
                            const draggedItem = newItems[draggedIconListItemIdx];
                            newItems.splice(draggedIconListItemIdx, 1);
                            newItems.splice(idx, 0, draggedItem);
                            
                            setDraggedIconListItemIdx(null);
                            if (expandedIconListItemIdx === draggedIconListItemIdx) {
                              setExpandedIconListItemIdx(idx);
                            } else if (expandedIconListItemIdx !== null) {
                              const expandedId = props.customItems[expandedIconListItemIdx].id;
                              const newExpandedIdx = newItems.findIndex(x => x.id === expandedId);
                              if (newExpandedIdx !== -1) {
                                setExpandedIconListItemIdx(newExpandedIdx);
                              }
                            }
                            updateProp('customItems', newItems);
                          }}
                          className="border border-slate-200 rounded overflow-hidden bg-white shadow-sm"
                        >
                          {/* Header */}
                          <div 
                            onClick={() => setExpandedIconListItemIdx(isExpanded ? null : idx)}
                            className="h-9 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none bg-slate-50/50 border-b border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-slate-400 cursor-grab active:cursor-grabbing p-1 -ml-1">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">
                                {item.label || `Mục ${idx + 1}`}
                              </span>
                              {item.indent > 0 && (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                                  Lớp {item.indent}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newItems = [...(props.customItems || [])];
                                  newItems.splice(idx + 1, 0, {
                                    ...item,
                                    id: String(Date.now()),
                                    label: `${item.label} (Sao chép)`
                                  });
                                  updateProp('customItems', newItems);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newItems = (props.customItems || []).filter((_: any, i: number) => i !== idx);
                                  updateProp('customItems', newItems);
                                  if (expandedIconListItemIdx === idx) {
                                    setExpandedIconListItemIdx(null);
                                  } else if (expandedIconListItemIdx !== null && expandedIconListItemIdx > idx) {
                                    setExpandedIconListItemIdx(expandedIconListItemIdx - 1);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expand Panel */}
                          {isExpanded && (
                            <div className="p-3 bg-white space-y-3 border-t border-slate-100">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-slate-500 font-medium">Nhãn</label>
                                  <input
                                    type="text"
                                    value={item.label || ''}
                                    onChange={(e) => {
                                      const newItems = [...(props.customItems || [])];
                                      newItems[idx] = { ...item, label: e.target.value };
                                      updateProp('customItems', newItems);
                                    }}
                                    className="w-full h-8 text-xs border border-slate-200 rounded px-2 focus:outline-none focus:border-brand-500 bg-white"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] text-slate-500 font-medium">Thụt lề (Lớp)</label>
                                  <select
                                    value={item.indent || 0}
                                    onChange={(e) => {
                                      const newItems = [...(props.customItems || [])];
                                      newItems[idx] = { ...item, indent: parseInt(e.target.value) };
                                      updateProp('customItems', newItems);
                                    }}
                                    className="w-full h-8 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                                  >
                                    <option value={0}>Lớp 0 (Gốc)</option>
                                    <option value={1}>Lớp 1 (Con)</option>
                                    <option value={2}>Lớp 2 (Cháu)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 font-medium">Đường dẫn (URL)</label>
                                <input
                                  type="text"
                                  value={item.url || ''}
                                  onChange={(e) => {
                                    const newItems = [...(props.customItems || [])];
                                    newItems[idx] = { ...item, url: e.target.value };
                                    updateProp('customItems', newItems);
                                  }}
                                  className="w-full h-8 text-xs border border-slate-200 rounded px-2 focus:outline-none focus:border-brand-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] text-slate-500 font-medium">Biểu tượng</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenIcon(item.icon || '', (iconName: string) => {
                                      const newItems = [...(props.customItems || [])];
                                      newItems[idx] = { ...item, icon: iconName };
                                      updateProp('customItems', newItems);
                                    });
                                  }}
                                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between bg-white cursor-pointer"
                                >
                                  <span className="truncate">{item.icon || 'Chọn icon...'}</span>
                                  {(() => {
                                    const SearchIcon = getLucideReactComponent('Search');
                                    return SearchIcon ? <SearchIcon className="w-3.5 h-3.5 text-slate-400" /> : null;
                                  })()}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...(props.customItems || [])];
                        newItems.push({
                          id: String(Date.now()),
                          label: 'Mục menu mới',
                          url: '#',
                          indent: 0,
                        });
                        updateProp('customItems', newItems);
                      }}
                      className="w-full h-8 border border-dashed border-slate-200 hover:border-brand-500 rounded-lg text-[10px] font-bold text-slate-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-1 bg-white cursor-pointer"
                    >
                      + Thêm mục
                    </button>
                  </div>
                </div>
              )}

              {/* Display redirect helper for Header/Footer sources */}
              {props.menuSource !== 'custom' && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
                  <div className="flex items-start gap-2 text-slate-600">
                    {(() => {
                      const InfoIcon = getLucideReactComponent('Info');
                      return InfoIcon ? <InfoIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> : null;
                    })()}
                    <p className="text-[11px] leading-relaxed">
                      Các mục Menu được lấy tự động từ cài đặt <strong>{props.menuSource === 'header' ? 'Header' : 'Footer'}</strong> của website.
                    </p>
                  </div>
                  <a
                    href="/admin/settings/navigation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors hover:underline"
                  >
                    {(() => {
                      const LinkIcon = getLucideReactComponent('ExternalLink');
                      return LinkIcon ? <LinkIcon className="w-3 h-3" /> : null;
                    })()}
                    Đi tới Quản lý Menu
                  </a>
                </div>
              )}

              {/* Content Width */}
              {renderStyleRow('Content Width', (
                <select
                  value={props.contentWidth || 'full'}
                  onChange={(e) => updateProp('contentWidth', e.target.value)}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="full">Full Width</option>
                  <option value="boxed">Boxed</option>
                </select>
              ))}

              {/* Item Layout */}
              {renderStyleRow('Item Layout', (
                <select
                  value={props.menuLayout || 'horizontal'}
                  onChange={(e) => updateProp('menuLayout', e.target.value)}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              ))}

              {/* Item Position */}
              {renderStyleRow(renderResponsiveLabel('Item Position', 'align'), renderSegmentedControl(props.align || 'left',
                'left',
                [
                  { value: 'left', label: 'Trái' },
                  { value: 'center', label: 'Giữa' },
                  { value: 'right', label: 'Phải' },
                  { value: 'space-between', label: 'Đều' },
                ] as const,
                (value: string) => updateProp('align', value)
              ))}

              {/* Dropdown Indicator Icon */}
              {renderStyleRow('Icon', (
                <button
                  type="button"
                  onClick={() => onOpenIcon(props.indicatorIcon || 'ChevronDown', (iconName: string) => updateProp('indicatorIcon', iconName))}
                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between bg-white cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    {(() => {
                      const IconComp = getLucideReactComponent(props.indicatorIcon || 'ChevronDown');
                      return IconComp ? <IconComp className="w-3.5 h-3.5 text-slate-500" /> : null;
                    })()}
                    <span className="truncate">{props.indicatorIcon || 'ChevronDown'}</span>
                  </span>
                  {(() => {
                    const SearchIcon = getLucideReactComponent('Search');
                    return SearchIcon ? <SearchIcon className="w-3.5 h-3.5 text-slate-400" /> : null;
                  })()}
                </button>
              ))}

              {/* Dropdown Active Icon */}
              {renderStyleRow('Active Icon', (
                <button
                  type="button"
                  onClick={() => onOpenIcon(props.indicatorActiveIcon || 'ChevronUp', (iconName: string) => updateProp('indicatorActiveIcon', iconName))}
                  className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between bg-white cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    {(() => {
                      const IconComp = getLucideReactComponent(props.indicatorActiveIcon || 'ChevronUp');
                      return IconComp ? <IconComp className="w-3.5 h-3.5 text-slate-500" /> : null;
                    })()}
                    <span className="truncate">{props.indicatorActiveIcon || 'ChevronUp'}</span>
                  </span>
                  {(() => {
                    const SearchIcon = getLucideReactComponent('Search');
                    return SearchIcon ? <SearchIcon className="w-3.5 h-3.5 text-slate-400" /> : null;
                  })()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Dropdown Effect */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandDropdownEffect', props._expandDropdownEffect !== false ? false : true)}>
            {(() => {
              const ChevronDownIcon = getLucideReactComponent('ChevronDown');
              return ChevronDownIcon ? <ChevronDownIcon size={14} className={`text-slate-400 transition-transform ${props._expandDropdownEffect !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Dropdown Effect</label>
          </div>

          {props._expandDropdownEffect !== false && (
            <div className="space-y-4 pl-1 mt-2">
              {renderStyleRow('Effect', (
                <select
                  value={props.dropdownEffect || 'fade'}
                  onChange={(e) => updateProp('dropdownEffect', e.target.value)}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="slide">Slide Down</option>
                  <option value="zoom">Zoom In</option>
                </select>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Menu Toggle */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandMenuToggle', props._expandMenuToggle !== false ? false : true)}>
            {(() => {
              const ChevronDownIcon = getLucideReactComponent('ChevronDown');
              return ChevronDownIcon ? <ChevronDownIcon size={14} className={`text-slate-400 transition-transform ${props._expandMenuToggle !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Menu Toggle</label>
          </div>

          {props._expandMenuToggle !== false && (
            <div className="space-y-4 pl-1 mt-2">
              {renderStyleRow('Breakpoint di động', (
                <select
                  value={props.mobileBreakpoint || 'mobile'}
                  onChange={(e) => updateProp('mobileBreakpoint', e.target.value)}
                  className="w-full h-7 text-xs border border-slate-200 rounded px-1.5 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="tablet">Tablet (&lt; 1024px)</option>
                  <option value="mobile">Mobile (&lt; 768px)</option>
                  <option value="none">Không có</option>
                </select>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Additional Settings */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandAdditionalSettings', props._expandAdditionalSettings !== false ? false : true)}>
            {(() => {
              const ChevronDownIcon = getLucideReactComponent('ChevronDown');
              return ChevronDownIcon ? <ChevronDownIcon size={14} className={`text-slate-400 transition-transform ${props._expandAdditionalSettings !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Additional Settings</label>
          </div>

          {props._expandAdditionalSettings !== false && (
            <div className="space-y-4 pl-1 mt-2">
              {renderStyleRow('Full Width Mobile', (
                <input
                  type="checkbox"
                  checked={props.fullWidthMobile !== false}
                  onChange={(e) => updateProp('fullWidthMobile', e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 bg-white"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {name === 'Sập mở (FAQ)' && (
      <div className="space-y-4">
        {/* Bố cục */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandLayout', !props._expandLayout)}>
            {(() => {
              const ChevronDown = getLucideReactComponent('ChevronDown');
              return ChevronDown ? <ChevronDown size={14} className={`text-slate-400 transition-transform ${props._expandLayout !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Bố cục</label>
          </div>
          
          {props._expandLayout !== false && (
            <div className="space-y-4 pl-1 mt-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-2">Các mục</label>
                <div className="space-y-3">
                  {(props.items || []).map((item: any, idx: number) => {
                    const isExpanded = expandedAccordionItemIdx === idx;
                    return (
                      <div 
                        key={item.id} 
                        draggable
                        onDragStart={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedAccordionItemIdx(idx);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAccordionItemIdx === null || draggedAccordionItemIdx === idx) return;
                          const newItems = [...(props.items || [])];
                          const draggedItem = newItems[draggedAccordionItemIdx];
                          newItems.splice(draggedAccordionItemIdx, 1);
                          newItems.splice(idx, 0, draggedItem);
                          updateProp('items', newItems);
                          
                          if (expandedAccordionItemIdx === draggedAccordionItemIdx) {
                            setExpandedAccordionItemIdx(idx);
                          } else if (expandedAccordionItemIdx !== null) {
                            const expandedId = props.items[expandedAccordionItemIdx].id;
                            const newExpandedIdx = newItems.findIndex((x: any) => x.id === expandedId);
                            setExpandedAccordionItemIdx(newExpandedIdx !== -1 ? newExpandedIdx : null);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedAccordionItemIdx(null);
                        }}
                        className={`border border-slate-200 rounded-lg overflow-hidden bg-white mb-2 shadow-sm transition-all duration-200 ${
                          draggedAccordionItemIdx === idx ? 'opacity-40 border-dashed border-brand-300' : ''
                        }`}
                      >
                        {/* Header Row */}
                        <div 
                          className={`flex items-center justify-between px-2.5 py-1.5 bg-slate-50/75 hover:bg-slate-100/75 cursor-grab active:cursor-grabbing select-none ${
                            isExpanded ? 'border-b border-slate-200' : ''
                          }`}
                          onClick={() => setExpandedAccordionItemIdx(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-1.5 max-w-[70%]">
                            <Lucide.GripVertical size={11} className="text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-slate-600" />
                            
                            <span className="text-[10px] font-bold text-slate-700 truncate">
                              {item.title || `Mục #${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Action buttons */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems.splice(idx + 1, 0, {
                                  ...item,
                                  id: String(Date.now() + Math.random()),
                                });
                                updateProp('items', newItems);
                                setExpandedAccordionItemIdx(idx + 1);
                              }}
                              className="text-slate-400 hover:text-brand-500 text-[10px] p-0.5"
                              title="Nhân bản"
                            >
                              ❐
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems.splice(idx, 1);
                                updateProp('items', newItems);
                                if (expandedAccordionItemIdx === idx) {
                                  setExpandedAccordionItemIdx(null);
                                } else if (expandedAccordionItemIdx !== null && expandedAccordionItemIdx > idx) {
                                  setExpandedAccordionItemIdx(expandedAccordionItemIdx - 1);
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 text-[10px] p-0.5"
                              title="Xóa"
                            >
                              ✕
                            </button>
                            <ChevronDown
                              size={10}
                              className={`text-slate-400 transform transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                            />
                          </div>
                        </div>

                        {/* Collapsible details */}
                        {isExpanded && (
                          <div className="p-2.5 bg-white space-y-3 border-t border-slate-100 font-sans">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Tiêu đề</label>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, title: e.target.value };
                                  updateProp('items', newItems);
                                }}
                                placeholder="Tiêu đề mục..."
                                className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white font-medium"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Kiểu nội dung</label>
                                <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newItems = [...(props.items || [])];
                                      newItems[idx] = { ...item, contentType: 'text' };
                                      updateProp('items', newItems);
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${item.contentType !== 'builder' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Văn bản
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newItems = [...(props.items || [])];
                                      newItems[idx] = { ...item, contentType: 'builder' };
                                      updateProp('items', newItems);
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${item.contentType === 'builder' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Trình dựng trang
                                  </button>
                                </div>
                              </div>
                              
                              {item.contentType !== 'builder' ? (
                                <textarea
                                  value={item.content || ''}
                                  onChange={(e) => {
                                    const newItems = [...(props.items || [])];
                                    newItems[idx] = { ...item, content: e.target.value };
                                    updateProp('items', newItems);
                                  }}
                                  placeholder="Nội dung chi tiết..."
                                  rows={4}
                                  className="w-full rounded border border-slate-200 p-2 text-[10px] outline-none bg-white resize-none"
                                />
                              ) : (
                                <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 border-dashed text-center">
                                  Kéo thả widget vào phần nội dung FAQ trên màn hình.
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">ID CSS</label>
                              <input
                                type="text"
                                value={item.cssId || ''}
                                onChange={(e) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, cssId: e.target.value };
                                  updateProp('items', newItems);
                                }}
                                placeholder="VD: cau-hoi-1"
                                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [...(props.items || [])];
                      newItems.push({
                        id: String(Date.now()),
                        title: 'Mục mới',
                        content: 'Nội dung mục mới',
                        cssId: ''
                      });
                      updateProp('items', newItems);
                    }}
                    className="w-full h-8 border border-dashed border-slate-200 hover:border-brand-500 rounded-lg text-[10px] font-bold text-slate-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-1 bg-white cursor-pointer"
                  >
                    + Thêm mục
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Vị trí mục</span>
                {renderSegmentedControl(
                  props.itemAlign || 'left',
                  'left',
                  [
                    { value: 'left', label: (() => { const AlignLeft = getLucideReactComponent('AlignLeft'); return AlignLeft ? <AlignLeft size={12} /> : 'Trái'; })() },
                    { value: 'center', label: (() => { const AlignCenter = getLucideReactComponent('AlignCenter'); return AlignCenter ? <AlignCenter size={12} /> : 'Giữa'; })() },
                    { value: 'right', label: (() => { const AlignRight = getLucideReactComponent('AlignRight'); return AlignRight ? <AlignRight size={12} /> : 'Phải'; })() },
                    { value: 'justify', label: (() => { const AlignJustify = getLucideReactComponent('AlignJustify'); return AlignJustify ? <AlignJustify size={12} /> : 'Đều'; })() },
                  ] as any,
                  (value: string) => updateProp('itemAlign', value)
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-2">Biểu tượng</label>
                <div className="space-y-2 pl-2 border-l border-slate-100">
                  <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                    <span className="text-[10px] font-medium text-slate-500">Vị trí</span>
                    {renderSegmentedControl(
                      props.iconPosition || 'right',
                      'right',
                      [
                        { value: 'left', label: 'Trái' },
                        { value: 'right', label: 'Phải' },
                      ] as const,
                      (value: string) => updateProp('iconPosition', value)
                    )}
                  </div>
                  
                  {(() => {
                    const renderAccordionIconPicker = (
                      label: string,
                      typeProp: string,
                      svgProp: string,
                      lucideProp: string,
                      defaultLucideIcon: string
                    ) => {
                      return (
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 mt-2">
                          <span className="text-[10px] font-medium text-slate-500 pt-1.5">{label}</span>
                          <div className="flex bg-slate-100/50 p-1 rounded-md border border-slate-200 w-full">
                            {/* None Button */}
                            <button
                              onClick={() => updateProp(typeProp, 'none')}
                              className={`flex-1 flex items-center justify-center h-7 rounded-sm transition-colors ${props[typeProp] === 'none' ? 'bg-white shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                              title="Không có"
                            >
                              <Lucide.Ban size={14} />
                            </button>
                            
                            {/* Upload SVG Button */}
                            <div className="relative flex-1 flex items-center justify-center">
                              <input
                                type="file"
                                accept=".svg,image/svg+xml"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploading(true);
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const response = await fetch('/api/media', { method: 'POST', body: formData });
                                    const data = await response.json();
                                    if (data.success && data.media) {
                                      updateProp(typeProp, 'svg');
                                      updateProp(svgProp, `<img src="${data.media.url}" alt="icon" style="width:100%;height:100%;object-fit:contain;"/>`);
                                    }
                                  } catch (err) {}
                                  setIsUploading(false);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                title="Tải lên SVG"
                              />
                              <div className={`w-full h-7 flex items-center justify-center rounded-sm transition-colors ${props[typeProp] === 'svg' ? 'bg-white shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}>
                                {isUploading ? <Lucide.Loader size={14} className="animate-spin" /> : <Lucide.UploadCloud size={14} />}
                              </div>
                            </div>

                            {/* Lucide Library Button */}
                            <button
                              onClick={() => {
                                onOpenIcon(
                                  props[lucideProp] || defaultLucideIcon,
                                  (selectedIcon: string) => {
                                    updateProp(typeProp, 'lucide');
                                    updateProp(lucideProp, selectedIcon);
                                  }
                                );
                              }}
                              className={`flex-1 flex items-center justify-center h-7 rounded-sm transition-colors ${props[typeProp] === 'lucide' || !props[typeProp] ? 'bg-white shadow-sm border border-slate-200/60 text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                              title="Chọn từ thư viện"
                            >
                              {(() => {
                                 const DefaultIcon = getLucideReactComponent(props[lucideProp] || defaultLucideIcon);
                                 return DefaultIcon ? <DefaultIcon size={14} /> : <Lucide.Plus size={14} />;
                              })()}
                            </button>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-3 pb-2">
                        {renderAccordionIconPicker('Mở rộng', 'activeIconType', 'activeIconSvg', 'activeIconLucide', 'Minus')}
                        {renderAccordionIconPicker('Thu gọn', 'inactiveIconType', 'inactiveIconSvg', 'inactiveIconLucide', 'Plus')}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Tiêu đề thẻ HTML</span>
                <select
                  value={props.titleHtmlTag || 'div'}
                  onChange={(e) => updateProp('titleHtmlTag', e.target.value)}
                  className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full"
                >
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">FAQ Schema</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={props.faqSchema || false} onChange={(e) => updateProp('faqSchema', e.target.checked)} />
                  <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Tương tác */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandInteraction', !props._expandInteraction)}>
            {(() => {
              const ChevronDown = getLucideReactComponent('ChevronDown');
              return ChevronDown ? <ChevronDown size={14} className={`text-slate-400 transition-transform ${props._expandInteraction !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Tương tác</label>
          </div>
          
          {props._expandInteraction !== false && (
            <div className="space-y-4 pl-1 mt-2">
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-slate-500 block">Trạng thái mặc định</span>
                <select
                  value={props.defaultState || 'first'}
                  onChange={(e) => updateProp('defaultState', e.target.value)}
                  className="h-7 rounded border border-slate-200 px-2 text-[10px] outline-none w-full"
                >
                  <option value="first">Đầu tiên mở rộng</option>
                  <option value="all">Tất cả mở rộng</option>
                  <option value="none">Tất cả đóng</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-medium text-slate-500 block">Số lượng mục mở tối đa</span>
                <select
                  value={props.maxExpanded || 'one'}
                  onChange={(e) => updateProp('maxExpanded', e.target.value)}
                  className="h-7 rounded border border-slate-200 px-2 text-[10px] outline-none w-full"
                >
                  <option value="one">Một</option>
                  <option value="unlimited">Không giới hạn</option>
                </select>
              </div>

              {renderStyleRow(renderResponsiveLabel('Thời lượng hiệu ứng động', 'animationDuration'), renderUnitControl('animationDuration', '400', 'ms', { min: 0, max: 2000 }, ['ms', 's']))}
            </div>
          )}
        </div>
      </div>
    )}

    {name === 'Tabs' && (
      <div className="space-y-4">
        {/* Tabs */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandLayout', !props._expandLayout)}>
            {(() => {
              const ChevronDown = getLucideReactComponent('ChevronDown');
              return ChevronDown ? <ChevronDown size={14} className={`text-slate-400 transition-transform ${props._expandLayout !== false ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Tabs</label>
          </div>
          
          {props._expandLayout !== false && (
            <div className="space-y-4 pl-1 mt-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-2">Các mục trong Tab</label>
                <div className="space-y-3">
                  {(props.items || []).map((item: any, idx: number) => {
                    const isExpanded = expandedTabsItemIdx === idx;
                    return (
                      <div 
                        key={item.id} 
                        draggable
                        onDragStart={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedTabsItemIdx(idx);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedTabsItemIdx === null || draggedTabsItemIdx === idx) return;
                          const newItems = [...(props.items || [])];
                          const draggedItem = newItems[draggedTabsItemIdx];
                          newItems.splice(draggedTabsItemIdx, 1);
                          newItems.splice(idx, 0, draggedItem);
                          updateProp('items', newItems);
                          
                          if (expandedTabsItemIdx === draggedTabsItemIdx) {
                            setExpandedTabsItemIdx(idx);
                          } else if (expandedTabsItemIdx !== null) {
                            const expandedId = props.items[expandedTabsItemIdx].id;
                            const newExpandedIdx = newItems.findIndex((x: any) => x.id === expandedId);
                            setExpandedTabsItemIdx(newExpandedIdx !== -1 ? newExpandedIdx : null);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedTabsItemIdx(null);
                        }}
                        className={`border border-slate-200 rounded-lg overflow-hidden bg-white mb-2 shadow-sm transition-all duration-200 ${
                          draggedTabsItemIdx === idx ? 'opacity-40 border-dashed border-brand-300' : ''
                        }`}
                      >
                        {/* Header Row */}
                        <div 
                          className={`flex items-center justify-between px-2.5 py-1.5 bg-slate-50/75 hover:bg-slate-100/75 cursor-grab active:cursor-grabbing select-none ${
                            isExpanded ? 'border-b border-slate-200' : ''
                          }`}
                          onClick={() => setExpandedTabsItemIdx(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-1.5 max-w-[70%]">
                            <Lucide.GripVertical size={11} className="text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-slate-600" />
                            <span className="text-[10px] font-bold text-slate-700 truncate">
                              {item.title || `Tab #${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems.splice(idx + 1, 0, {
                                  ...item,
                                  id: String(Date.now() + Math.random()),
                                });
                                updateProp('items', newItems);
                                setExpandedTabsItemIdx(idx + 1);
                              }}
                              className="text-slate-400 hover:text-brand-500 text-[10px] p-0.5"
                              title="Nhân bản"
                            >
                              ❐
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newItems = [...(props.items || [])];
                                newItems.splice(idx, 1);
                                updateProp('items', newItems);
                                if (expandedTabsItemIdx === idx) {
                                  setExpandedTabsItemIdx(null);
                                } else if (expandedTabsItemIdx !== null && expandedTabsItemIdx > idx) {
                                  setExpandedTabsItemIdx(expandedTabsItemIdx - 1);
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 text-[10px] p-0.5"
                              title="Xóa"
                            >
                              ✕
                            </button>
                            <ChevronDown
                              size={10}
                              className={`text-slate-400 transform transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                            />
                          </div>
                        </div>

                        {/* Collapsible details */}
                        {isExpanded && (
                          <div className="p-2.5 bg-white space-y-3 border-t border-slate-100 font-sans">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Tiêu đề</label>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, title: e.target.value };
                                  updateProp('items', newItems);
                                }}
                                placeholder="Tiêu đề tab..."
                                className="h-8 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white font-medium"
                              />
                            </div>
                            
                            {/* Icon selection */}
                            <div className="space-y-2">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Biểu tượng</label>
                              <div className="flex bg-slate-100/50 p-1 rounded-md border border-slate-200 w-full">
                                <button
                                  onClick={() => {
                                    const newItems = [...(props.items || [])];
                                    newItems[idx] = { ...item, iconType: 'none' };
                                    updateProp('items', newItems);
                                  }}
                                  className={`flex-1 flex items-center justify-center h-7 rounded-sm transition-colors ${item.iconType === 'none' || !item.iconType ? 'bg-white shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                                  title="Không có"
                                >
                                  <Lucide.Ban size={14} />
                                </button>
                                
                                <div className="relative flex-1 flex items-center justify-center">
                                  <input
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setIsUploading(true);
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      try {
                                        const response = await fetch('/api/media', { method: 'POST', body: formData });
                                        const data = await response.json();
                                        if (data.success && data.media) {
                                          const newItems = [...(props.items || [])];
                                          newItems[idx] = {
                                            ...item,
                                            iconType: 'svg',
                                            iconSvg: `<img src="${data.media.url}" alt="icon" style="width:100%;height:100%;object-fit:contain;"/>`
                                          };
                                          updateProp('items', newItems);
                                        }
                                      } catch (err) {}
                                      setIsUploading(false);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    title="Tải lên SVG"
                                  />
                                  <div className={`w-full h-7 flex items-center justify-center rounded-sm transition-colors ${item.iconType === 'svg' ? 'bg-white shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {isUploading ? <Lucide.Loader size={14} className="animate-spin" /> : <Lucide.UploadCloud size={14} />}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    onOpenIcon(
                                      item.iconLucide || 'Folder',
                                      (selectedIcon: string) => {
                                        const newItems = [...(props.items || [])];
                                        newItems[idx] = { ...item, iconType: 'lucide', iconLucide: selectedIcon };
                                        updateProp('items', newItems);
                                      }
                                    );
                                  }}
                                  className={`flex-1 flex items-center justify-center h-7 rounded-sm transition-colors ${item.iconType === 'lucide' ? 'bg-white shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                                  title="Chọn từ thư viện"
                                >
                                  <Lucide.Smile size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Content type */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Kiểu nội dung</label>
                                <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newItems = [...(props.items || [])];
                                      newItems[idx] = { ...item, contentType: 'text' };
                                      updateProp('items', newItems);
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${item.contentType !== 'builder' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Văn bản
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newItems = [...(props.items || [])];
                                      newItems[idx] = { ...item, contentType: 'builder' };
                                      updateProp('items', newItems);
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${item.contentType === 'builder' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Trình dựng trang
                                  </button>
                                </div>
                              </div>
                              
                              {item.contentType !== 'builder' ? (
                                <textarea
                                  value={item.content || ''}
                                  onChange={(e) => {
                                    const newItems = [...(props.items || [])];
                                    newItems[idx] = { ...item, content: e.target.value };
                                    updateProp('items', newItems);
                                  }}
                                  placeholder="Nội dung chi tiết..."
                                  rows={4}
                                  className="w-full rounded border border-slate-200 p-2 text-[10px] outline-none bg-white resize-none"
                                />
                              ) : (
                                <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 border-dashed text-center">
                                  Kéo thả widget vào phần nội dung Tab trên màn hình.
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">ID CSS</label>
                              <input
                                type="text"
                                value={item.cssId || ''}
                                onChange={(e) => {
                                  const newItems = [...(props.items || [])];
                                  newItems[idx] = { ...item, cssId: e.target.value };
                                  updateProp('items', newItems);
                                }}
                                placeholder="VD: tab-1"
                                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [...(props.items || [])];
                      newItems.push({
                        id: String(Date.now()),
                        title: 'Tab mới',
                        content: 'Nội dung tab mới',
                        cssId: '',
                        contentType: 'text'
                      });
                      updateProp('items', newItems);
                    }}
                    className="w-full h-8 border border-dashed border-slate-200 hover:border-brand-500 rounded-lg text-[10px] font-bold text-slate-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-1 bg-white cursor-pointer"
                  >
                    + Thêm Tab
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Hướng</span>
                {renderSegmentedControl(
                  props.direction || 'top',
                  'top',
                  [
                    { value: 'top', label: 'Trên' },
                    { value: 'bottom', label: 'Dưới' },
                    { value: 'left', label: 'Trái' },
                    { value: 'right', label: 'Phải' },
                  ] as const,
                  (value: string) => updateProp('direction', value)
                )}
              </div>

              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Căn chỉnh</span>
                {renderSegmentedControl(
                  props.align || 'start',
                  'start',
                  [
                    { value: 'start', label: 'Trái' },
                    { value: 'center', label: 'Giữa' },
                    { value: 'end', label: 'Phải' },
                    { value: 'justify', label: 'Đều' },
                  ] as const,
                  (value: string) => updateProp('align', value)
                )}
              </div>

              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Căn tiêu đề</span>
                {renderSegmentedControl(
                  props.titleAlign || 'left',
                  'left',
                  [
                    { value: 'left', label: 'Trái' },
                    { value: 'center', label: 'Giữa' },
                    { value: 'right', label: 'Phải' },
                  ] as const,
                  (value: string) => updateProp('titleAlign', value)
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional settings */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => updateProp('_expandAdditional', !props._expandAdditional)}>
            {(() => {
              const ChevronDown = getLucideReactComponent('ChevronDown');
              return ChevronDown ? <ChevronDown size={14} className={`text-slate-400 transition-transform ${props._expandAdditional ? 'rotate-0' : '-rotate-90'}`} /> : null;
            })()}
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer">Cài đặt thêm</label>
          </div>
          
          {props._expandAdditional && (
            <div className="space-y-4 pl-1 mt-2">
              <div className="grid grid-cols-[82px_1fr] items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">Cuộn ngang</span>
                {renderSegmentedControl(
                  props.horizontalScroll || 'off',
                  'off',
                  [
                    { value: 'off', label: 'Tắt' },
                    { value: 'on', label: 'Bật' },
                  ] as const,
                  (value: string) => updateProp('horizontalScroll', value)
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-medium text-slate-500 block">Điểm ngắt</span>
                <select
                  value={props.breakpoint || 'mobile'}
                  onChange={(e) => updateProp('breakpoint', e.target.value)}
                  className="h-7 rounded border border-slate-200 px-2 text-[10px] outline-none w-full bg-white"
                >
                  <option value="none">Không ngắt</option>
                  <option value="mobile">Di động dọc (&gt; 767px)</option>
                  <option value="tablet">Máy tính bảng (&gt; 1023px)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {name === 'Băng chuyền hình ảnh' && (
      <div className="space-y-4">
        {/* Accordion 1: Băng chuyền hình ảnh */}
        {renderAccordionSection('carousel_images_settings', 'Băng chuyền hình ảnh', (
          <div className="space-y-4 font-sans">
            {/* Carousel name input */}
            {renderStyleRow('Tên Carousel', (
              <input
                type="text"
                value={props.carouselName || ''}
                onChange={(e) => updateProp('carouselName', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                placeholder="Nhập tên..."
              />
            ))}

            {/* Gallery Picker list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase">
                  {(props.images || []).length} Hình ảnh đã chọn
                </span>
                {(props.images || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateProp('images', [])}
                    className="text-red-500 hover:text-red-600 text-[9px] font-bold uppercase flex items-center gap-0.5 animate-fade-in"
                    title="Xóa tất cả ảnh"
                  >
                    <Trash2 size={10} /> Xóa hết
                  </button>
                )}
              </div>

              {/* Grid representation of thumbnails */}
              <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar p-1 border border-slate-100 rounded-lg bg-slate-50/50">
                {(props.images || []).map((img: any, idx: number) => (
                  <div key={img.id || idx} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 bg-white group/thumb">
                    <img src={img.url} alt="" className="w-full h-full object-cover select-none" />
                    
                    {/* Hover actions panel */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(props.images || [])];
                            const temp = list[idx];
                            list[idx] = list[idx - 1];
                            list[idx - 1] = temp;
                            updateProp('images', list);
                          }}
                          className="bg-white/90 hover:bg-white text-slate-800 rounded p-1 hover:scale-105 transition-transform text-[8px] font-bold"
                          title="Dịch trái"
                        >
                          ◀
                        </button>
                      )}
                      {idx < (props.images || []).length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(props.images || [])];
                            const temp = list[idx];
                            list[idx] = list[idx + 1];
                            list[idx + 1] = temp;
                            updateProp('images', list);
                          }}
                          className="bg-white/90 hover:bg-white text-slate-800 rounded p-1 hover:scale-105 transition-transform text-[8px] font-bold"
                          title="Dịch phải"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const list = [...(props.images || [])];
                          list.splice(idx, 1);
                          updateProp('images', list);
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded p-1 hover:scale-105 transition-transform text-[8px] font-bold"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Image Card trigger */}
                <button
                  type="button"
                  onClick={() => onOpenMedia((url: string) => {
                    const newImages = [...(props.images || []), {
                      id: String(Date.now() + Math.random()),
                      url,
                      alt: '',
                      title: '',
                      description: '',
                    }];
                    updateProp('images', newImages);
                  })}
                  className="aspect-square flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Lucide.Plus size={16} />
                  <span className="text-[8px] font-bold mt-1">Thêm</span>
                </button>
              </div>
            </div>

            {/* Image Resolution */}
            {renderStyleRow('Độ phân giải', (
              <select
                value={props.imageResolution || 'large'}
                onChange={(e) => updateProp('imageResolution', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="thumbnail">Thumbnail (150x150)</option>
                <option value="medium">Medium (300x300)</option>
                <option value="large">Large (1024x1024)</option>
                <option value="full">Kích thước gốc</option>
              </select>
            ))}

            {/* Slides to Show */}
            {renderStyleRow('Hiển thị slide', (
              <select
                value={props.slidesToShow || 'default'}
                onChange={(e) => updateProp('slidesToShow', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="default">Mặc định</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            ))}

            {/* Slides to Scroll */}
            {renderStyleRow('Cuộn slide', (
              <select
                value={props.slidesToScroll || 'default'}
                onChange={(e) => updateProp('slidesToScroll', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="default">Mặc định</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            ))}

            {/* Image Stretch */}
            {renderStyleRow('Kéo dãn ảnh', (
              <select
                value={props.imageStretch || 'no'}
                onChange={(e) => updateProp('imageStretch', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="no">Không</option>
                <option value="yes">Có</option>
              </select>
            ))}

            {/* Navigation Selection */}
            {renderStyleRow('Điều hướng', (
              <select
                value={props.navigation || 'arrows_dots'}
                onChange={(e) => updateProp('navigation', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="arrows_dots">Mũi tên & Chấm</option>
                <option value="arrows">Mũi tên</option>
                <option value="dots">Dấu chấm</option>
                <option value="none">Không</option>
              </select>
            ))}

            {/* Icon pickers for Navigation Arrows */}
            {(props.navigation === 'arrows_dots' || props.navigation === 'arrows') && (
              <>
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mũi tên quay lại</label>
                  <div 
                    style={{
                      backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
                      backgroundSize: '16px 16px',
                    }}
                    className="w-full h-24 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
                  >
                    {/* Trash icon to reset left icon */}
                    {props.iconLeft && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProp('iconLeft', '');
                        }}
                        className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                        title="Đặt lại mặc định"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    {/* Icon Preview - Click opens library modal */}
                    <div 
                      onClick={() => onOpenIcon(
                        props.iconLeft || 'ChevronLeft', 
                        (iconName: string) => updateProp('iconLeft', iconName)
                      )}
                      className="flex-1 flex items-center justify-center cursor-pointer p-2 hover:bg-slate-900/5 transition-colors"
                      title="Click để chọn biểu tượng từ thư viện"
                    >
                      {React.createElement((Lucide as any)[props.iconLeft || 'ChevronLeft'] || Lucide.ChevronLeft, {
                        size: 32,
                        color: '#475569',
                        className: 'transition-transform duration-200 hover:scale-105'
                      })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="h-7 bg-slate-50 border-t border-slate-200 flex text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenIcon(
                          props.iconLeft || 'ChevronLeft', 
                          (iconName: string) => updateProp('iconLeft', iconName)
                        )}
                        className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                      >
                        Thư viện biểu tượng
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mũi tên Tiếp theo</label>
                  <div 
                    style={{
                      backgroundImage: 'conic-gradient(#f1f5f9 0.25turn, #ffffff 0.25turn 0.5turn, #f1f5f9 0.5turn 0.75turn, #ffffff 0.75turn)',
                      backgroundSize: '16px 16px',
                    }}
                    className="w-full h-24 border border-slate-200 rounded-lg flex flex-col justify-between cursor-default group relative overflow-hidden bg-slate-50/50"
                  >
                    {/* Trash icon to reset right icon */}
                    {props.iconRight && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProp('iconRight', '');
                        }}
                        className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white p-1 rounded transition-colors z-10 cursor-pointer shadow-sm flex items-center justify-center h-5 w-5"
                        title="Đặt lại mặc định"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    {/* Icon Preview - Click opens library modal */}
                    <div 
                      onClick={() => onOpenIcon(
                        props.iconRight || 'ChevronRight', 
                        (iconName: string) => updateProp('iconRight', iconName)
                      )}
                      className="flex-1 flex items-center justify-center cursor-pointer p-2 hover:bg-slate-900/5 transition-colors"
                      title="Click để chọn biểu tượng từ thư viện"
                    >
                      {React.createElement((Lucide as any)[props.iconRight || 'ChevronRight'] || Lucide.ChevronRight, {
                        size: 32,
                        color: '#475569',
                        className: 'transition-transform duration-200 hover:scale-105'
                      })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="h-7 bg-slate-50 border-t border-slate-200 flex text-slate-600 text-[9px] font-bold uppercase tracking-wider select-none shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenIcon(
                          props.iconRight || 'ChevronRight', 
                          (iconName: string) => updateProp('iconRight', iconName)
                        )}
                        className="flex-1 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                      >
                        Thư viện biểu tượng
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Links and Captions selection */}
            {renderStyleRow('Liên kết', (
              <select
                value={props.linkType || 'none'}
                onChange={(e) => updateProp('linkType', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="none">Không</option>
                <option value="media">Tệp phương tiện</option>
                <option value="custom">Đường dẫn tùy ý</option>
              </select>
            ))}

            {props.linkType === 'custom' && renderStyleRow('Đường dẫn', (
              <input
                type="text"
                value={props.link || ''}
                onChange={(e) => updateProp('link', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                placeholder="https://..."
              />
            ))}

            {renderStyleRow('Chú thích', (
              <select
                value={props.captionType || 'none'}
                onChange={(e) => updateProp('captionType', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="none">Không</option>
                <option value="title">Tiêu đề</option>
                <option value="caption">Chú thích</option>
                <option value="description">Mô tả</option>
              </select>
            ))}
          </div>
        ))}

        {/* Accordion 2: Tùy chọn bổ sung (Additional options) */}
        {renderAccordionSection('carousel_additional_options', 'Tùy chọn bổ sung', (
          <div className="space-y-3 font-sans">
            {renderStyleRow('Tải trễ (Lazy Load)', renderToggleControl('', props.lazyLoad === 'yes', (val: boolean) => updateProp('lazyLoad', val ? 'yes' : 'no')))}
            {renderStyleRow('Tự động chơi', renderToggleControl('', props.autoplay === 'yes', (val: boolean) => updateProp('autoplay', val ? 'yes' : 'no')))}
            {renderStyleRow('Ngừng lại khi di chuột', renderToggleControl('', props.pauseOnHover === 'yes', (val: boolean) => updateProp('pauseOnHover', val ? 'yes' : 'no')))}
            {renderStyleRow('Tạm dừng tương tác', renderToggleControl('', props.pauseOnInteraction === 'yes', (val: boolean) => updateProp('pauseOnInteraction', val ? 'yes' : 'no')))}
            
            {renderStyleRow('Tốc độ phát (ms)', (
              <input
                type="number"
                value={props.autoplaySpeed !== undefined ? props.autoplaySpeed : 5000}
                onChange={(e) => updateProp('autoplaySpeed', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Lặp lại vô hạn', renderToggleControl('', props.infiniteLoop === 'yes', (val: boolean) => updateProp('infiniteLoop', val ? 'yes' : 'no')))}

            {renderStyleRow('Tốc độ chuyển (ms)', (
              <input
                type="number"
                value={props.animationSpeed !== undefined ? props.animationSpeed : 500}
                onChange={(e) => updateProp('animationSpeed', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Hướng', (
              <select
                value={props.direction || 'ltr'}
                onChange={(e) => updateProp('direction', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="ltr">Căn trái (LTR)</option>
                <option value="rtl">Căn phải (RTL)</option>
              </select>
            ))}
          </div>
        ))}
      </div>
    )}

    {name === 'Bộ đếm' && (
      <div className="space-y-4">
        {/* Accordion 1: Bộ đếm */}
        {renderAccordionSection('counter_settings', 'Bộ đếm', (
          <div className="space-y-3 font-sans">
            {renderStyleRow('Số bắt đầu', (
              <input
                type="number"
                value={props.startNumber !== undefined ? props.startNumber : 0}
                onChange={(e) => updateProp('startNumber', parseInt(e.target.value) || 0)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Số kết thúc', (
              <input
                type="number"
                value={props.endNumber !== undefined ? props.endNumber : 100}
                onChange={(e) => updateProp('endNumber', parseInt(e.target.value) || 0)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Tiền tố', (
              <input
                type="text"
                value={props.prefix || ''}
                onChange={(e) => updateProp('prefix', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                placeholder="Ví dụ: $"
              />
            ))}

            {renderStyleRow('Hậu tố', (
              <input
                type="text"
                value={props.suffix || ''}
                onChange={(e) => updateProp('suffix', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                placeholder="Ví dụ: +"
              />
            ))}

            {renderStyleRow('Thời lượng (ms)', (
              <input
                type="number"
                value={props.duration !== undefined ? props.duration : 2000}
                onChange={(e) => updateProp('duration', parseInt(e.target.value) || 0)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Dấu phân cách', renderToggleControl('', Boolean(props.useThousandSeparator), (val: boolean) => updateProp('useThousandSeparator', val)))}

            {renderStyleRow('Tiêu đề', (
              <input
                type="text"
                value={props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Thẻ HTML tiêu đề', (
              <select
                value={props.titleTag || 'div'}
                onChange={(e) => updateProp('titleTag', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="div">div</option>
                <option value="h1">h1</option>
                <option value="h2">h2</option>
                <option value="h3">h3</option>
                <option value="h4">h4</option>
                <option value="h5">h5</option>
                <option value="h6">h6</option>
                <option value="span">span</option>
              </select>
            ))}
          </div>
        ))}
      </div>
    )}

    {name === 'Thanh tiến trình' && (
      <div className="space-y-4">
        {/* Accordion 1: Thanh tiến trình */}
        {renderAccordionSection('progress_settings', 'Thanh tiến trình', (
          <div className="space-y-3 font-sans">
            {renderStyleRow('Tiêu đề', (
              <input
                type="text"
                value={props.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
                placeholder="My Skill"
              />
            ))}

            {renderStyleRow('Phần trăm (%)', (
              <input
                type="number"
                min="0"
                max="100"
                value={props.percentage !== undefined ? props.percentage : 50}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  updateProp('percentage', val);
                }}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Hiện phần trăm', renderToggleControl('', props.displayPercentage !== false, (val: boolean) => updateProp('displayPercentage', val)))}

            {renderStyleRow('Kiểu hiển thị', (
              <select
                value={props.barType || 'default'}
                onChange={(e) => updateProp('barType', e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
              >
                <option value="default">Mặc định</option>
                <option value="inner">Trong thanh</option>
              </select>
            ))}

            {renderStyleRow('Thời lượng (ms)', (
              <input
                type="number"
                value={props.duration !== undefined ? props.duration : 1500}
                onChange={(e) => updateProp('duration', parseInt(e.target.value) || 0)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-700 outline-none focus:border-brand-500 bg-white"
              />
            ))}

            {renderStyleRow('Hiệu ứng sọc', renderToggleControl('', Boolean(props.stripeEnabled), (val: boolean) => updateProp('stripeEnabled', val)))}

            {props.stripeEnabled && renderStyleRow('Sọc chuyển động', renderToggleControl('', Boolean(props.stripeAnimated), (val: boolean) => updateProp('stripeAnimated', val)))}
          </div>
        ))}
      </div>
    )}

    {name === 'Mã HTML' && (
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã HTML tùy chỉnh</label>
        <textarea
          value={props.html || ''}
          onChange={(e) => updateProp('html', e.target.value)}
          className="w-full h-80 rounded-lg border border-slate-200 p-3 text-[10px] font-mono outline-none focus:border-brand-500 bg-white"
          placeholder="<div>...</div>"
        />
        <p className="text-[9px] text-slate-400 leading-normal font-sans">
          Hỗ trợ chèn các thẻ HTML chuẩn như iframe, div, script để nhúng bản đồ, widget, chat, hoặc code liên kết bên thứ ba.
        </p>
      </div>
    )}

    {name === 'Vùng chứa' && (
      <div className="space-y-4">
        {renderAccordionSection('container', 'Vùng chứa', (
          <>
            {renderStyleRow('Bố cục vùng chứa', (
              <select value="flexbox" disabled className="h-7 w-full rounded border border-slate-200 bg-slate-100 px-2 text-[10px] font-semibold text-slate-500 outline-none cursor-not-allowed">
                <option value="flexbox">Flexbox</option>
              </select>
            ))}
            {renderStyleRow('Chiều rộng nội dung', (() => {
              const isTopLevel = node?.data.parent === 'ROOT';
              if (!isTopLevel) return (
                <span className="text-[10px] text-slate-400 font-medium italic">Chỉ áp dụng cho Container cấp 1</span>
              );
              return (
                <select
                  value={props.contentWidth || 'inherit'}
                  onChange={(e) => updateProp('contentWidth', e.target.value)}
                  className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="inherit">Kế thừa từ trang</option>
                  <option value="boxed">Boxed (Hộp)</option>
                  <option value="full">Toàn chiều rộng</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
              );
            })())}
            {node?.data.parent !== 'ROOT' && (() => {
              const parsedColumnWidth = splitSizeValue(props.customWidth || props.width || '33.3%', '%');
              const columnWidthUnit = parsedColumnWidth.unit || '%';
              const columnWidthVal = parsedColumnWidth.amount || '33.3';
              const columnWidthMax = columnWidthUnit === 'px' ? 1600 : 100;
              const columnWidthMin = columnWidthUnit === 'px' ? 20 : 1;

              const stepColWidth = (direction: 1 | -1) => {
                const amountVal = parseFloat(columnWidthVal) || 0;
                const next = Math.max(columnWidthMin, amountVal + direction * (columnWidthUnit === '%' ? 0.1 : 1));
                const formatted = columnWidthUnit === '%' ? next.toFixed(1) : String(next);
                updateProp('widthMode', 'custom');
                updateProp('customWidth', `${formatted}${columnWidthUnit}`);
                updateProp('width', `${formatted}${columnWidthUnit}`);
              };
              const upId = 'col-width-up';
              const downId = 'col-width-down';

              return renderStyleRow(
                <div className="flex items-center gap-1">
                  <span>Chiều rộng</span>
                  <Monitor size={10} className="text-slate-400" />
                </div>,
                <div className="space-y-1">
                  {registerStepper(upId, () => stepColWidth(1))}
                  {registerStepper(downId, () => stepColWidth(-1))}
                  <div className="flex items-center justify-between gap-2">
                    {renderUnitSelector(columnWidthUnit, ['%', 'px', 'vw'], (u: string) => {
                      updateProp('widthMode', 'custom');
                      updateProp('customWidth', `${columnWidthVal}${u}`);
                      updateProp('width', `${columnWidthVal}${u}`);
                    })}
                  </div>
                  <div className="grid grid-cols-[1fr_64px] items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={columnWidthMin}
                      max={columnWidthMax}
                      step={columnWidthUnit === '%' ? 0.1 : 1}
                      value={parseFloat(columnWidthVal) || columnWidthMin}
                      onChange={(e) => {
                        updateProp('widthMode', 'custom');
                        updateProp('customWidth', e.target.value + columnWidthUnit);
                        updateProp('width', e.target.value + columnWidthUnit);
                      }}
                      className="elementor-slider"
                    />
                    <div className="elementor-number-stepper">
                      <input
                        type="number"
                        step={columnWidthUnit === '%' ? 0.1 : 1}
                        value={columnWidthVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sanitized = val.replace(/[^-0-9.]/g, '');
                          updateProp('widthMode', 'custom');
                          updateProp('customWidth', sanitized ? `${sanitized}${columnWidthUnit}` : '');
                          updateProp('width', sanitized ? `${sanitized}${columnWidthUnit}` : '');
                        }}
                        className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
                        placeholder="33.3"
                      />
                      <div className="elementor-stepper-buttons">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepColWidth(1)); }}
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
                          onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepColWidth(-1)); }}
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
                </div>
              );
            })()}
            {node?.data.parent === 'ROOT' && (() => {
              const editsSectionWidth = props.contentWidth === 'full' || props.contentWidth === 'inherit';
              const activeWidth = editsSectionWidth ? (props.customWidth || props.width || '100%') : (props.maxWidth || '1200px');
              const parsedWidth = splitSizeValue(activeWidth, editsSectionWidth ? '%' : 'px');
              const widthUnit = parsedWidth.unit || (editsSectionWidth ? '%' : 'px');
              const widthVal = parsedWidth.amount || (editsSectionWidth ? '100' : '1200');
              const widthMax = widthUnit === 'px' ? 1600 : 100;
              const widthMin = widthUnit === 'px' ? 200 : 10;
              const applyWidth = (value: string) => {
                if (editsSectionWidth) {
                  updateProp('widthMode', 'custom');
                  updateProp('customWidth', value);
                  updateProp('width', value);
                } else {
                  updateProp('maxWidth', value);
                }
              };

              const stepContainerWidth = (direction: 1 | -1) => {
                const amountVal = parseFloat(widthVal) || (widthUnit === 'px' ? 1200 : 100);
                const step = widthUnit === '%' ? 0.1 : 1;
                const next = Math.max(widthMin, amountVal + direction * step);
                const formatted = widthUnit === '%' ? next.toFixed(1) : String(next);
                applyWidth(`${formatted}${widthUnit}`);
              };
              const upId = 'container-width-up';
              const downId = 'container-width-down';

              return renderStyleRow(
                <div className="flex items-center gap-1">
                  <span>Chiều rộng</span>
                  <Monitor size={10} className="text-slate-400" />
                </div>,
                <div className="space-y-1">
                  {registerStepper(upId, () => stepContainerWidth(1))}
                  {registerStepper(downId, () => stepContainerWidth(-1))}
                  <div className="flex items-center justify-between gap-2">
                    {renderUnitSelector(widthUnit, ['px', '%', 'vw'], (u: string) => {
                      applyWidth(`${widthVal}${u}`);
                    })}
                  </div>
                  <div className="grid grid-cols-[1fr_64px] items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={widthMin}
                      max={widthMax}
                      step={widthUnit === '%' ? 0.1 : 1}
                      value={parseFloat(widthVal) || widthMin}
                      onChange={(e) => applyWidth(e.target.value + widthUnit)}
                      className="elementor-slider"
                    />
                    <div className="elementor-number-stepper">
                      <input
                        type="number"
                        step={widthUnit === '%' ? 0.1 : 1}
                        value={widthVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sanitized = val.replace(/[^-0-9.]/g, '');
                          applyWidth(sanitized ? `${sanitized}${widthUnit}` : '');
                        }}
                        className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
                        placeholder={widthUnit === 'px' ? '1200' : '100'}
                      />
                      <div className="elementor-stepper-buttons">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepContainerWidth(1)); }}
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
                          onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepContainerWidth(-1)); }}
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
                </div>
              );
            })()}
            {(() => {
              const parsedHeight = splitSizeValue(props.minHeight || 'auto', 'px');
              const heightUnit = parsedHeight.unit || 'px';
              const isAuto = props.minHeight === 'auto' || !props.minHeight;
              const heightVal = isAuto ? '' : (parsedHeight.amount || '');
              const heightMax = heightUnit === 'px' ? 1000 : 100;
              const heightMin = 0;

              const stepContainerHeight = (direction: 1 | -1) => {
                const amountVal = parseFloat(heightVal) || 0;
                const next = Math.max(0, amountVal + direction);
                updateProp('minHeight', `${next}${heightUnit}`);
              };
              const upId = 'container-height-up';
              const downId = 'container-height-down';

              return renderStyleRow(
                <div className="flex items-center gap-1">
                  <span>Chiều cao</span>
                  <Monitor size={10} className="text-slate-400" />
                </div>,
                <div className="space-y-1">
                  {registerStepper(upId, () => stepContainerHeight(1))}
                  {registerStepper(downId, () => stepContainerHeight(-1))}
                  <div className="flex items-center justify-between gap-2">
                    {renderUnitSelector(heightUnit, ['px', 'vh', '%'], (u: string) => {
                      updateProp('minHeight', heightVal ? `${heightVal}${u}` : '');
                    })}
                  </div>
                  <div className="grid grid-cols-[1fr_64px] items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={heightMin}
                      max={heightMax}
                      value={parseFloat(heightVal) || 0}
                      onChange={(e) => updateProp('minHeight', e.target.value + heightUnit)}
                      className="elementor-slider"
                    />
                    <div className="elementor-number-stepper">
                      <input
                        type="number"
                        value={heightVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sanitized = val.replace(/[^-0-9.]/g, '');
                          updateProp('minHeight', sanitized ? `${sanitized}${heightUnit}` : '');
                        }}
                        className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
                        placeholder="auto"
                      />
                      <div className="elementor-stepper-buttons">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepContainerHeight(1)); }}
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
                          onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepContainerHeight(-1)); }}
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
                  <p className="text-[9px] text-slate-400 font-medium leading-normal mt-1">Để đạt được chiều cao đầy đủ, sử dụng 100vh.</p>
                </div>
              );
            })()}
          </>
        ))}

        {renderAccordionSection('items', 'Các mục', (() => {
          const isRow = (props.flexDirection || 'column').includes('row');
          return (
          <>
            {renderStyleRow(
              <div className="flex items-center gap-1.5">
                <span>Hướng</span>
                <Monitor size={10} className="text-slate-400" />
              </div>,
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                {[
                  { value: 'row', label: <ArrowRight size={12} />, tooltip: 'Ngang (Row)' },
                  { value: 'column', label: <ArrowDown size={12} />, tooltip: 'Dọc (Column)' },
                  { value: 'row-reverse', label: <ArrowLeft size={12} />, tooltip: 'Ngang ngược' },
                  { value: 'column-reverse', label: <ArrowUp size={12} />, tooltip: 'Dọc ngược' },
                ].map((opt) => {
                  const active = (props.flexDirection || 'column') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFlexDirection(opt.value)}
                      className={`flex-1 flex justify-center items-center py-1.5 rounded transition-all ${active ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                      title={opt.tooltip}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Vị trí ngang: Column → alignItems, Row → justifyContent */}
            {renderStyleRow(
              <div className="flex items-center gap-1.5">
                <span>Vị trí ngang</span>
                <Monitor size={10} className="text-slate-400" />
              </div>,
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5 w-full">
                {[
                  { value: 'flex-start', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="2" width="1.5" height="12" rx="0.5" opacity="0.8" />
                      <rect x="4.5" y="4" width="8" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="7" width="5" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="10" width="7" height="2" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Trái' },
                  { value: 'center', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="7.25" y="2" width="1.5" height="12" rx="0.5" opacity="0.8" />
                      <rect x="4" y="4" width="8" height="2" rx="0.5" opacity="0.5" />
                      <rect x="5.5" y="7" width="5" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="10" width="7" height="2" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Giữa' },
                  { value: 'flex-end', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="12.5" y="2" width="1.5" height="12" rx="0.5" opacity="0.8" />
                      <rect x="3.5" y="4" width="8" height="2" rx="0.5" opacity="0.5" />
                      <rect x="6.5" y="7" width="5" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="10" width="7" height="2" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Phải' },
                  { value: 'stretch', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="2" width="1.5" height="12" rx="0.5" opacity="0.8" />
                      <rect x="12.5" y="2" width="1.5" height="12" rx="0.5" opacity="0.8" />
                      <rect x="4.5" y="4.5" width="7" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="7.5" width="7" height="2" rx="0.5" opacity="0.5" />
                      <rect x="4.5" y="10.5" width="7" height="2" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Kéo giãn' },
                ].map((opt) => {
                  const cssProp = isRow ? 'justifyContent' : 'alignItems';
                  const currentVal = isRow ? (props.justifyContent || 'flex-start') : (props.alignItems || 'stretch');
                  const active = currentVal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateProp(cssProp, opt.value)}
                      className={`flex-1 flex justify-center items-center py-1.5 rounded transition-all ${active ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                      title={opt.tooltip}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Vị trí dọc: Column → justifyContent, Row → alignItems */}
            {renderStyleRow(
              <div className="flex items-center gap-1.5">
                <span>Vị trí dọc</span>
                <Monitor size={10} className="text-slate-400" />
              </div>,
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5 w-full">
                {[
                  { value: 'flex-start', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="2" width="12" height="1.5" rx="0.5" opacity="0.8" />
                      <rect x="4" y="4.5" width="2" height="8" rx="0.5" opacity="0.5" />
                      <rect x="7" y="4.5" width="2" height="5" rx="0.5" opacity="0.5" />
                      <rect x="10" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Trên' },
                  { value: 'center', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" opacity="0.8" />
                      <rect x="4" y="4" width="2" height="8" rx="0.5" opacity="0.5" />
                      <rect x="7" y="5.5" width="2" height="5" rx="0.5" opacity="0.5" />
                      <rect x="10" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Giữa' },
                  { value: 'flex-end', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="12.5" width="12" height="1.5" rx="0.5" opacity="0.8" />
                      <rect x="4" y="3.5" width="2" height="8" rx="0.5" opacity="0.5" />
                      <rect x="7" y="6.5" width="2" height="5" rx="0.5" opacity="0.5" />
                      <rect x="10" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                    </svg>
                  ), tooltip: 'Dưới' },
                  { value: 'space-between', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="1.5" width="10" height="2" rx="0.5" opacity="0.8" />
                      <rect x="5" y="7" width="6" height="2" rx="0.5" opacity="0.5" />
                      <rect x="3" y="12.5" width="10" height="2" rx="0.5" opacity="0.8" />
                    </svg>
                  ), tooltip: 'Giãn đều' },
                  { value: 'space-around', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="3" y="3" width="10" height="2" rx="0.5" opacity="0.8" />
                      <rect x="5" y="7" width="6" height="2" rx="0.5" opacity="0.5" />
                      <rect x="3" y="11" width="10" height="2" rx="0.5" opacity="0.8" />
                    </svg>
                  ), tooltip: 'Giãn quanh' },
                  { value: 'stretch', label: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="2" width="12" height="1.5" rx="0.5" opacity="0.8" />
                      <rect x="4.5" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                      <rect x="7.5" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                      <rect x="10.5" y="4.5" width="2" height="7" rx="0.5" opacity="0.5" />
                      <rect x="2" y="12.5" width="12" height="1.5" rx="0.5" opacity="0.8" />
                    </svg>
                  ), tooltip: 'Kéo giãn' },
                ].map((opt) => {
                  const cssProp = isRow ? 'alignItems' : 'justifyContent';
                  const currentVal = isRow ? (props.alignItems || 'stretch') : (props.justifyContent || 'flex-start');
                  const active = currentVal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateProp(cssProp, opt.value)}
                      className={`flex-1 flex justify-center items-center py-1.5 rounded transition-all ${active ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                      title={opt.tooltip}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {(() => {
              const linked = linkedSpacing.gap;
              const hasColGap = props.columnGap !== undefined && props.columnGap !== null && String(props.columnGap).trim() !== '' && !String(props.columnGap).includes('var(');
              const hasRowGap = props.rowGap !== undefined && props.rowGap !== null && String(props.rowGap).trim() !== '' && !String(props.rowGap).includes('var(');
              
              const colGapPlaceholder = '5';
              const rowGapPlaceholder = '5';
              
              const getUnit = (val: any) => {
                if (!val) return 'px';
                const match = String(val).match(/px|%|em|rem|vw/i);
                return match ? match[0].toLowerCase() : 'px';
              };
              const activeUnit = getUnit(props.columnGap ?? props.gap);

              const colVal = hasColGap ? String(props.columnGap) : `${colGapPlaceholder}${activeUnit}`;
              const rowVal = hasRowGap ? String(props.rowGap) : `${rowGapPlaceholder}${activeUnit}`;

              const colGapParsed = splitSpacingValue(colVal);
              const rowGapParsed = splitSpacingValue(rowVal);

              const adjustGapValue = (key: 'columnGap' | 'rowGap', direction: 1 | -1) => {
                const hasVal = key === 'columnGap' ? hasColGap : hasRowGap;
                const val = hasVal ? (props[key] ?? props.gap ?? '') : `5${activeUnit}`;
                const { amount, unit } = splitSpacingValue(String(val));
                const base = parseFloat(amount) || 5;
                const next = Math.max(0, Math.round((base + direction) * 100) / 100);
                const fullValue = `${next}${unit}`;
                if (linked) {
                  updateProp('columnGap', fullValue);
                  updateProp('rowGap', fullValue);
                  updateProp('gap', fullValue);
                } else {
                  updateProp(key, fullValue);
                }
              };

              const handleGapInputChange = (key: 'columnGap' | 'rowGap', value: string) => {
                const sanitized = value.replace(/[^-0-9.]/g, '');
                const fullValue = sanitized ? `${sanitized}${activeUnit}` : '';
                if (linked) {
                  updateProp('columnGap', fullValue);
                  updateProp('rowGap', fullValue);
                  updateProp('gap', fullValue);
                } else {
                  updateProp(key, fullValue);
                }
              };

              const toggleLinkedGap = () => {
                const willLink = !linked;
                if (willLink) {
                  const colVal = hasColGap ? String(props.columnGap) : `5${activeUnit}`;
                  updateProp('rowGap', colVal);
                  updateProp('gap', colVal);
                }
                setLinkedSpacing((prev: Record<string, boolean>) => ({ ...prev, gap: willLink }));
              };

              const handleGapUnitChange = (newUnit: string) => {
                ['columnGap', 'rowGap'].forEach((key) => {
                  const hasVal = key === 'columnGap' ? hasColGap : hasRowGap;
                  const val = hasVal ? (props[key] ?? props.gap) : `5${activeUnit}`;
                  if (val != null) {
                    const { amount } = splitSpacingValue(String(val));
                    updateProp(key, `${amount || '5'}${newUnit}`);
                  }
                });
                const baseVal = props.columnGap ?? props.gap;
                if (baseVal != null) {
                  const { amount } = splitSpacingValue(String(baseVal));
                  updateProp('gap', `${amount || '5'}${newUnit}`);
                }
              };

              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between h-7">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Khoảng trống</span>
                      <Monitor size={10} className="text-slate-400" />
                    </div>
                    <div className="flex items-center gap-1 relative">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenSpacingUnitPopover(openSpacingUnitPopover === 'gap' ? null : 'gap')}
                          className="spacing-unit-trigger inline-flex items-center gap-1 h-5 px-1.5 rounded border border-slate-200 bg-white text-[8px] font-extrabold uppercase text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all leading-none"
                        >
                          {activeUnit} <svg className="w-1.5 h-1.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>
                        {openSpacingUnitPopover === 'gap' && (
                          <div className="spacing-unit-popover-container absolute right-0 mt-1 z-[9999] min-w-[56px] rounded-md border border-slate-100 bg-white py-1 shadow-lg shadow-slate-200/50 animate-fade-in text-[9px] font-bold text-slate-600">
                            {SPACING_UNITS.map((unit) => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => {
                                  handleGapUnitChange(unit);
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
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_28px] gap-0 items-start">
                    <div className="min-w-0">
                      {registerStepper('columnGap-up', () => adjustGapValue('columnGap', 1))}
                      {registerStepper('columnGap-down', () => adjustGapValue('columnGap', -1))}
                      <div className="elementor-number-stepper">
                        <input
                          type="number"
                          value={hasColGap ? colGapParsed.amount : ''}
                          onChange={(e) => handleGapInputChange('columnGap', e.target.value)}
                          className="w-full h-7 px-1 border-y border-l border-slate-200 text-[10px] text-center font-mono outline-none focus:border-brand-500 elementor-number-input rounded-l-md"
                          placeholder={colGapPlaceholder}
                        />
                        <div className="elementor-stepper-buttons">
                          <button 
                            type="button" 
                            onMouseDown={(e) => { e.preventDefault(); startStepping('columnGap-up', () => adjustGapValue('columnGap', 1)); }}
                            onMouseUp={stopStepping}
                            onMouseLeave={stopStepping}
                            className="group"
                          >
                            <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onMouseDown={(e) => { e.preventDefault(); startStepping('columnGap-down', () => adjustGapValue('columnGap', -1)); }}
                            onMouseUp={stopStepping}
                            onMouseLeave={stopStepping}
                            className="group"
                          >
                            <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="pt-1 text-center text-[8px] font-semibold text-slate-400 leading-none font-sans">Cột</div>
                    </div>
                    <div className="min-w-0">
                      {registerStepper('rowGap-up', () => adjustGapValue('rowGap', 1))}
                      {registerStepper('rowGap-down', () => adjustGapValue('rowGap', -1))}
                      <div className="elementor-number-stepper">
                        <input
                          type="number"
                          value={hasRowGap ? rowGapParsed.amount : ''}
                          onChange={(e) => handleGapInputChange('rowGap', e.target.value)}
                          className="w-full h-7 px-1 border-y border-l border-slate-200 text-[10px] text-center font-mono outline-none focus:border-brand-500 elementor-number-input"
                          placeholder={rowGapPlaceholder}
                        />
                        <div className="elementor-stepper-buttons">
                          <button 
                            type="button" 
                            onMouseDown={(e) => { e.preventDefault(); startStepping('rowGap-up', () => adjustGapValue('rowGap', 1)); }}
                            onMouseUp={stopStepping}
                            onMouseLeave={stopStepping}
                            className="group"
                          >
                            <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button 
                            type="button" 
                            onMouseDown={(e) => { e.preventDefault(); startStepping('rowGap-down', () => adjustGapValue('rowGap', -1)); }}
                            onMouseUp={stopStepping}
                            onMouseLeave={stopStepping}
                            className="group"
                          >
                            <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="pt-1 text-center text-[8px] font-semibold text-slate-400 leading-none font-sans">Hàng</div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleLinkedGap}
                      className={`h-7 rounded-r-md border transition-colors ${linked ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-700'}`}
                      title={linked ? 'Bấm để tách hàng/cột' : 'Bấm để liên kết hàng/cột'}
                    >
                      {linked ? <Link2 size={12} className="mx-auto" /> : <Unlink size={12} className="mx-auto" />}
                    </button>
                  </div>
                </div>
              );
            })()}

            {renderStyleRow(
              <div className="flex items-center gap-1.5">
                <span>Ngắt dòng</span>
                <Monitor size={10} className="text-slate-400" />
              </div>,
              <div className="space-y-1.5">
                <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5 text-[10px]">
                  {[
                    { value: 'nowrap', label: (
                      <div className="flex items-center gap-1 justify-center">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="2" y="7" width="12" height="2" rx="0.5" />
                          <circle cx="4" cy="8" r="1" fill="white" />
                          <circle cx="8" cy="8" r="1" fill="white" />
                          <circle cx="12" cy="8" r="1" fill="white" />
                        </svg>
                        <span>Không ngắt</span>
                      </div>
                    ) },
                    { value: 'wrap', label: (
                      <div className="flex items-center gap-1 justify-center">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="2" y="4" width="6" height="2" rx="0.5" />
                          <rect x="2" y="10" width="12" height="2" rx="0.5" />
                          <path d="M10 5 L12 5 A2 2 0 0 1 14 7 L14 8 A2 2 0 0 1 12 10 L10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>Ngắt dòng</span>
                      </div>
                    ) },
                  ].map((opt) => {
                    const active = (props.flexWrap || 'nowrap') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateProp('flexWrap', opt.value)}
                        className={`flex-1 py-1 rounded transition-all ${active ? 'bg-brand-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400 font-medium leading-normal leading-relaxed mt-1">
                  Các mục trong vùng chứa có thể ở trong một dòng duy nhất (Không ngắt dòng), hoặc chia thành nhiều dòng (Ngắt dòng).
                </p>
              </div>
            )}
          </>
          );
        })())}

        {renderAccordionSection('additional', 'Tùy chọn bổ sung', (
          <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-[10px] text-center font-medium leading-relaxed">
            Không có tùy chọn bổ sung nào cho vùng chứa này.
          </div>
        ))}
      </div>
    )}

    {name === 'Lưới' && (
      <div className="space-y-4">
        {renderAccordionSection('grid_layout', 'Cài đặt Lưới', (
          <>
            {renderStyleRow('Số cột', (
              <input type="number" min="1" max="12" value={props.gridColumns || 3} onChange={(e) => updateProp('gridColumns', parseInt(e.target.value) || 3)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow('Số hàng', (
              <input type="text" value={props.gridRows || 'auto'} onChange={(e) => updateProp('gridRows', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-brand-500" placeholder="auto, 2, 3..." />
            ))}
            {renderStyleRow('Khoảng cách cột (px)', (
              <input type="text" value={props.gridColumnGap || '20px'} onChange={(e) => updateProp('gridColumnGap', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow('Khoảng cách hàng (px)', (
              <input type="text" value={props.gridRowGap || '20px'} onChange={(e) => updateProp('gridRowGap', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow('Auto Flow', (
              <select value={props.gridAutoFlow || 'row'} onChange={(e) => updateProp('gridAutoFlow', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="row">Row</option>
                <option value="column">Column</option>
                <option value="row dense">Row Dense</option>
                <option value="column dense">Column Dense</option>
              </select>
            ))}
            {renderStyleRow('Căn ngang (Justify Items)', (
              <select value={props.justifyItems || 'stretch'} onChange={(e) => updateProp('justifyItems', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            ))}
            {renderStyleRow('Căn dọc (Align Items)', (
              <select value={props.alignItems || 'stretch'} onChange={(e) => updateProp('alignItems', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            ))}
            {renderStyleRow('Hiển thị khung ô (Outline)', (
              <input type="checkbox" checked={props.showGridOutline !== false} onChange={(e) => updateProp('showGridOutline', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
          </>
        ))}
      </div>
    )}

    {(name === 'Form' || name === 'Biểu mẫu' || name === 'FormBlock') && (
      <div className="space-y-4">
        {renderAccordionSection('form_fields', 'Trường dữ liệu', (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tên Form</label>
              <input
                type="text"
                value={props.formName || 'New Form'}
                onChange={(e) => updateProp('formName', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Danh sách trường</label>
              {(props.fields || [
                { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true, columnWidth: '100%' },
                { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, columnWidth: '100%' },
                { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false, columnWidth: '100%' }
              ]).map((field: any, idx: number) => {
                const isExpanded = expandedFormFieldIdx === idx;
                return (
                  <div 
                    key={field.id} 
                    draggable
                    onDragStart={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedFormFieldIdx(idx);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnter={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedFormFieldIdx === null || draggedFormFieldIdx === idx) return;
                      const newFields = [...(props.fields || [])];
                      const draggedField = newFields[draggedFormFieldIdx];
                      newFields.splice(draggedFormFieldIdx, 1);
                      newFields.splice(idx, 0, draggedField);
                      updateProp('fields', newFields);
                      setDraggedFormFieldIdx(null);
                      if (expandedFormFieldIdx === draggedFormFieldIdx) setExpandedFormFieldIdx(idx);
                      else if (expandedFormFieldIdx === idx) setExpandedFormFieldIdx(draggedFormFieldIdx);
                    }}
                    onDragEnd={() => setDraggedFormFieldIdx(null)}
                    className={`bg-white rounded-lg border transition-all ${isExpanded ? 'border-brand-300 shadow-sm' : 'border-slate-200'} overflow-hidden group/item cursor-grab active:cursor-grabbing ${draggedFormFieldIdx === idx ? 'opacity-50' : ''}`}
                  >
                    <div 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 transition-colors select-none"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button')) {
                          setExpandedFormFieldIdx(isExpanded ? null : idx);
                        }
                      }}
                    >
                      <div className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing px-1.5 flex-shrink-0">
                        <GripVertical size={13} />
                      </div>
                      <div className="flex-1 truncate text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        {field.type === 'step' ? (
                          <span className="bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded text-[10px]">Step</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">[{field.type}]</span>
                        )}
                        {field.label || 'Mục mới'}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFields = [...(props.fields || [])];
                            newFields.splice(idx + 1, 0, { ...field, id: Math.random().toString(36).substring(7) });
                            updateProp('fields', newFields);
                            setExpandedFormFieldIdx(idx + 1);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-500 transition-colors"
                          title="Nhân bản"
                        >
                          <Lucide.Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFields = (props.fields || []).filter((_: any, i: number) => i !== idx);
                            updateProp('fields', newFields);
                            if (isExpanded) setExpandedFormFieldIdx(null);
                            else if (expandedFormFieldIdx && expandedFormFieldIdx > idx) setExpandedFormFieldIdx(expandedFormFieldIdx - 1);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-3 cursor-default">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600">Loại (Type)</label>
                          <select
                            value={field.type || 'text'}
                            onChange={(e) => {
                              const newFields = [...(props.fields || [])];
                              newFields[idx] = { ...newFields[idx], type: e.target.value };
                              if (e.target.value === 'step') {
                                newFields[idx].label = 'Step';
                                newFields[idx].required = false;
                              }
                              updateProp('fields', newFields);
                            }}
                            className="w-full h-7 px-2 border border-slate-200 rounded text-xs text-slate-700 font-semibold bg-white outline-none focus:border-brand-500"
                          >
                            <option value="text">Văn bản (Text)</option>
                            <option value="email">Email</option>
                            <option value="textarea">Văn bản nhiều dòng (Textarea)</option>
                            <option value="url">Đường dẫn (URL)</option>
                            <option value="tel">Số điện thoại (Tel)</option>
                            <option value="radio">Radio</option>
                            <option value="select">Lựa chọn (Select)</option>
                            <option value="checkbox">Hộp kiểm (Checkbox)</option>
                            <option value="acceptance">Chấp nhận (Acceptance)</option>
                            <option value="date">Ngày (Date)</option>
                            <option value="time">Giờ (Time)</option>
                            <option value="file">Tải lên tệp (File Upload)</option>
                            <option value="password">Mật khẩu (Password)</option>
                            <option value="html">Mã HTML</option>
                            <option value="hidden">Trường ẩn (Hidden)</option>
                            <option value="step">Bước chia form (Step)</option>
                          </select>
                        </div>

                        {field.type !== 'step' && (
                          <>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">Nhãn (Label)</label>
                              <input
                                type="text"
                                value={field.label || ''}
                                onChange={(e) => {
                                  const newFields = [...(props.fields || [])];
                                  newFields[idx] = { ...newFields[idx], label: e.target.value };
                                  updateProp('fields', newFields);
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs outline-none focus:border-brand-500"
                              />
                            </div>

                            {field.type !== 'html' && field.type !== 'hidden' && (
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-600">Gợi ý (Placeholder)</label>
                                <input
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(e) => {
                                    const newFields = [...(props.fields || [])];
                                    newFields[idx] = { ...newFields[idx], placeholder: e.target.value };
                                    updateProp('fields', newFields);
                                  }}
                                  className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs outline-none focus:border-brand-500"
                                />
                              </div>
                            )}

                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-600">Tùy chọn (Options) - mỗi dòng 1 lựa chọn</label>
                                <textarea
                                  value={field.options || ''}
                                  onChange={(e) => {
                                    const newFields = [...(props.fields || [])];
                                    newFields[idx] = { ...newFields[idx], options: e.target.value };
                                    updateProp('fields', newFields);
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-brand-500 min-h-[60px]"
                                />
                              </div>
                            )}

                            {field.type === 'html' && (
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-600">Nội dung HTML</label>
                                <textarea
                                  value={field.html || ''}
                                  onChange={(e) => {
                                    const newFields = [...(props.fields || [])];
                                    newFields[idx] = { ...newFields[idx], html: e.target.value };
                                    updateProp('fields', newFields);
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-brand-500 min-h-[80px] font-mono"
                                />
                              </div>
                            )}

                            {field.type === 'hidden' && (
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-600">Giá trị (Value)</label>
                                <input
                                  type="text"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const newFields = [...(props.fields || [])];
                                    newFields[idx] = { ...newFields[idx], value: e.target.value };
                                    updateProp('fields', newFields);
                                  }}
                                  className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-xs outline-none focus:border-brand-500"
                                />
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">Bắt buộc (Required)</label>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFields = [...(props.fields || [
                                      { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true, columnWidth: '100%' },
                                      { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, columnWidth: '100%' },
                                      { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false, columnWidth: '100%' }
                                    ])];
                                    newFields[idx] = { ...newFields[idx], required: !(field.required || false) };
                                    updateProp('fields', newFields);
                                  }}
                                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${field.required ? 'bg-brand-500' : 'bg-slate-200'}`}
                                >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${field.required ? 'translate-x-4' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-xs text-slate-600 font-medium">Bắt buộc nhập</span>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600">Chiều rộng cột (Column Width)</label>
                          <select
                            value={field.columnWidth || '100%'}
                            onChange={(e) => {
                              const newFields = [...(props.fields || [])];
                              newFields[idx] = { ...newFields[idx], columnWidth: e.target.value };
                              updateProp('fields', newFields);
                            }}
                            className="w-full h-7 px-2 border border-slate-200 rounded text-xs text-slate-700 font-semibold bg-white outline-none focus:border-brand-500"
                          >
                            <option value="100%">100%</option>
                            <option value="80%">80%</option>
                            <option value="75%">75%</option>
                            <option value="66%">66%</option>
                            <option value="60%">60%</option>
                            <option value="50%">50%</option>
                            <option value="40%">40%</option>
                            <option value="33%">33%</option>
                            <option value="25%">25%</option>
                            <option value="20%">20%</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  const newFields = [...(props.fields || []), {
                    id: Math.random().toString(36).substring(7),
                    type: 'text',
                    label: 'Mục mới',
                    placeholder: '',
                    required: false,
                    width: '100'
                  }];
                  updateProp('fields', newFields);
                  setExpandedFormFieldIdx(newFields.length - 1);
                }}
                className="w-full h-8 mt-2 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition-colors"
              >
                <Lucide.Plus size={14} /> Thêm trường
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tùy chọn hiển thị Input</label>
              {renderStyleRow(renderResponsiveLabel('Kích thước nhập liệu', 'inputSize'), renderSegmentedControl(props.inputSize || 'sm',
                'sm',
                [
                  { value: 'sm', label: 'Nhỏ' },
                  { value: 'md', label: 'Vừa' },
                  { value: 'lg', label: 'Lớn' }
                ] as const,
                (value: string) => {
                  const paddingVal = value === 'sm' ? '8px 12px' : value === 'md' ? '10px 16px' : '12px 20px';
                  const fontSizeVal = value === 'sm' ? '13px' : value === 'md' ? '15px' : '17px';
                  updateProps({ 
                    inputSize: value,
                    fieldPadding: paddingVal,
                    fieldFontSize: fontSizeVal
                  });
                }
              ))}
              {renderStyleRow('Hiển thị Nhãn', (
                <button
                  type="button"
                  onClick={() => updateProp('showLabel', props.showLabel === false ? true : false)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${props.showLabel !== false ? 'bg-brand-500' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${props.showLabel !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              ))}
              {renderStyleRow('Hiển thị dấu (*)', (
                <button
                  type="button"
                  onClick={() => updateProp('showRequiredMark', props.showRequiredMark === false ? true : false)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${props.showRequiredMark !== false ? 'bg-brand-500' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${props.showRequiredMark !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {renderAccordionSection('form_buttons', 'Nút bấm', (
          <div className="space-y-3">
            {renderStyleRow(renderResponsiveLabel('Kích thước nút', 'buttonSize'), renderSegmentedControl(props.buttonSize || 'sm',
              'sm',
              [
                { value: 'sm', label: 'Nhỏ' },
                { value: 'md', label: 'Vừa' },
                { value: 'lg', label: 'Lớn' }
              ] as const,
              (value: string) => {
                const paddingVal = value === 'sm' ? '8px 16px' : value === 'md' ? '10px 20px' : '12px 24px';
                const fontSizeVal = value === 'sm' ? '13px' : value === 'md' ? '15px' : '17px';
                updateProps({ 
                  buttonSize: value,
                  btnPadding: paddingVal,
                  btnFontSize: fontSizeVal
                });
              }
            ))}
            {renderStyleRow('Chiều rộng nút', (
              <select value={props.buttonColumnWidth || '100%'} onChange={(e) => updateProp('buttonColumnWidth', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="100%">100%</option>
                <option value="80%">80%</option>
                <option value="75%">75%</option>
                <option value="66%">66%</option>
                <option value="60%">60%</option>
                <option value="50%">50%</option>
                <option value="40%">40%</option>
                <option value="33%">33%</option>
                <option value="25%">25%</option>
                <option value="20%">20%</option>
                <option value="auto">Auto</option>
              </select>
            ))}
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <label className="block text-[10px] font-bold text-slate-600">Chữ nút gửi (Submit)</label>
              <input type="text" value={props.buttonText || 'Gửi ngay'} onChange={(e) => updateProp('buttonText', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Chữ nút Tiếp (Next - cho Multi-step)</label>
              <input type="text" value={props.nextButtonText || 'Tiếp tục'} onChange={(e) => updateProp('nextButtonText', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Chữ nút Lùi (Previous - cho Multi-step)</label>
              <input type="text" value={props.prevButtonText || 'Quay lại'} onChange={(e) => updateProp('prevButtonText', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <label className="block text-[10px] font-bold text-slate-600">ID của nút bấm</label>
              <input type="text" value={props.buttonId || ''} onChange={(e) => updateProp('buttonId', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" placeholder="my-submit-btn" />
            </div>
          </div>
        ))}

        {renderAccordionSection('form_actions', 'Hành động sau khi gửi', (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Thêm hành động</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={(props.actionsAfterSubmit || ['collect', 'email']).includes('collect')} onChange={(e) => {
                    let actions = [...(props.actionsAfterSubmit || ['collect', 'email'])];
                    if (e.target.checked) actions.push('collect');
                    else actions = actions.filter(a => a !== 'collect');
                    updateProp('actionsAfterSubmit', actions);
                  }} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Lưu dữ liệu</span>
                </label>
                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={(props.actionsAfterSubmit || ['collect', 'email']).includes('email')} onChange={(e) => {
                    let actions = [...(props.actionsAfterSubmit || ['collect', 'email'])];
                    if (e.target.checked) actions.push('email');
                    else actions = actions.filter(a => a !== 'email');
                    updateProp('actionsAfterSubmit', actions);
                  }} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Gửi Email</span>
                </label>
                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={(props.actionsAfterSubmit || ['collect', 'email']).includes('redirect')} onChange={(e) => {
                    let actions = [...(props.actionsAfterSubmit || ['collect', 'email'])];
                    if (e.target.checked) actions.push('redirect');
                    else actions = actions.filter(a => a !== 'redirect');
                    updateProp('actionsAfterSubmit', actions);
                  }} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Chuyển hướng</span>
                </label>
                <label className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={(props.actionsAfterSubmit || ['collect', 'email']).includes('webhook')} onChange={(e) => {
                    let actions = [...(props.actionsAfterSubmit || ['collect', 'email'])];
                    if (e.target.checked) actions.push('webhook');
                    else actions = actions.filter(a => a !== 'webhook');
                    updateProp('actionsAfterSubmit', actions);
                  }} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-bold text-slate-700">Webhook</span>
                </label>
              </div>
            </div>

            {(props.actionsAfterSubmit || ['collect', 'email']).includes('collect') && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Lưu dữ liệu (Collect Submissions)</label>
                {renderStyleRow('Lưu Meta Data', (
                  <input type="checkbox" checked={props.collectMetaData !== false} onChange={(e) => updateProp('collectMetaData', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                ))}
                <span className="text-[10px] text-slate-400 block mt-1">(Lưu IP, User Agent của người gửi)</span>
              </div>
            )}

            {(props.actionsAfterSubmit || ['collect', 'email']).includes('email') && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Gửi Email</label>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Đến (To)</label>
                  <input type="text" value={props.emailTo || '[admin-email]'} onChange={(e) => updateProp('emailTo', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Tiêu đề (Subject)</label>
                  <input type="text" value={props.emailSubject || 'Phản hồi mới từ [form-name]'} onChange={(e) => updateProp('emailSubject', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Nội dung (Message)</label>
                  <textarea value={props.emailMessage || '[all-fields]'} onChange={(e) => updateProp('emailMessage', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-slate-700 outline-none focus:border-brand-500 min-h-[100px]" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Từ Email (From Email)</label>
                  <input type="text" value={props.emailFrom || '[admin-email]'} onChange={(e) => updateProp('emailFrom', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Từ Tên (From Name)</label>
                  <input type="text" value={props.emailFromName || '[site-title]'} onChange={(e) => updateProp('emailFromName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Reply-To</label>
                  <input type="text" value={props.emailReplyTo || ''} onChange={(e) => updateProp('emailReplyTo', e.target.value)} placeholder="[field id='email']" className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" />
                </div>
              </div>
            )}

            {(props.actionsAfterSubmit || ['collect', 'email']).includes('redirect') && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Chuyển hướng (Redirect)</label>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Redirect To (URL)</label>
                  <input type="text" value={props.redirectUrl || ''} onChange={(e) => updateProp('redirectUrl', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" placeholder="https://..." />
                </div>
              </div>
            )}

            {(props.actionsAfterSubmit || ['collect', 'email']).includes('webhook') && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Webhook</label>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600">Webhook URL</label>
                  <input type="text" value={props.webhookUrl || ''} onChange={(e) => updateProp('webhookUrl', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none focus:border-brand-500" placeholder="https://..." />
                </div>
              </div>
            )}
          </div>
        ))}

        {((props.fields || [
          { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true, columnWidth: '100%' },
          { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, columnWidth: '100%' },
          { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false, columnWidth: '100%' }
        ]).some((f: any) => f.type === 'step')) && renderAccordionSection('form_steps', 'Cài đặt Bước (Steps)', (
          <div className="space-y-3">
            {renderStyleRow('Loại (Type)', (
              <select value={props.stepType || 'number_text'} onChange={(e) => updateProp('stepType', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="none">Không hiển thị</option>
                <option value="number_text">Số & Chữ (Number & Text)</option>
                <option value="number">Số (Number)</option>
                <option value="text">Chữ (Text)</option>
                <option value="icon">Biểu tượng (Icon)</option>
                <option value="progress_bar">Thanh tiến độ (Progress Bar)</option>
              </select>
            ))}
            {props.stepType !== 'progress_bar' && props.stepType !== 'none' && renderStyleRow('Hình dáng (Shape)', (
              <select value={props.stepShape || 'circle'} onChange={(e) => updateProp('stepShape', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="circle">Hình tròn (Circle)</option>
                <option value="square">Hình vuông (Square)</option>
                <option value="rounded">Bo góc (Rounded)</option>
                <option value="none">Không viền (None)</option>
              </select>
            ))}
          </div>
        ))}

        {renderAccordionSection('form_options', 'Tùy chọn bổ sung', (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Form ID</label>
              <input type="text" value={props.customFormId || ''} onChange={(e) => updateProp('customFormId', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" placeholder="my-form" />
            </div>
            
            {renderStyleRow('Cách xác thực dữ liệu', (
              <select value={props.formValidation || 'browser'} onChange={(e) => updateProp('formValidation', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="browser">Mặc định trình duyệt</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            ))}

            <div className="space-y-2 border-t border-slate-100 pt-3">
              {renderStyleRow('Tùy chỉnh thông báo', (
                <input type="checkbox" checked={props.customMessagesEnabled || false} onChange={(e) => updateProp('customMessagesEnabled', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
              ))}
              
              {props.customMessagesEnabled && (
                <div className="space-y-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Thành công</label>
                    <input type="text" value={props.successMessage || 'Gửi form thành công!'} onChange={(e) => updateProp('successMessage', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Có lỗi</label>
                    <input type="text" value={props.errorMessage || 'Có lỗi xảy ra khi gửi form.'} onChange={(e) => updateProp('errorMessage', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Chưa nhập bắt buộc</label>
                    <input type="text" value={props.requiredMessage || 'Trường này là bắt buộc.'} onChange={(e) => updateProp('requiredMessage', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600">Dữ liệu không hợp lệ</label>
                    <input type="text" value={props.invalidMessage || 'Dữ liệu không hợp lệ.'} onChange={(e) => updateProp('invalidMessage', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {(name === 'Danh sách bài viết' || name === 'PostGridBlock') && (
      <div className="space-y-4">
        {renderAccordionSection('postgrid_layout', 'Layout', (
          <div className="space-y-3">
            {renderStyleRow('Màu sắc', (
              <select value={props.colorPreset || 'Classic'} onChange={(e) => updateProp('colorPreset', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="Classic">Classic</option>
                <option value="Cards">Cards</option>
                <option value="Full Content">Full Content</option>
              </select>
            ))}
            {renderStyleRow(renderResponsiveLabel('Columns', 'columns'), (
              <input type="number" min="1" max="6" value={responsiveValue('columns', 3) as any} onChange={(e) => updateProp('columns', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow('Posts Per Page', (
              <input type="number" min="1" value={props.postsPerPage || 6} onChange={(e) => updateProp('postsPerPage', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow(renderResponsiveLabel('Image Position', 'imagePosition'), (
              <select value={responsiveValue('imagePosition', 'Top') as any} onChange={(e) => updateProp('imagePosition', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="Top">Top</option>
                <option value="Left">Left</option>
                <option value="Right">Right</option>
                <option value="None">None</option>
              </select>
            ))}
            {renderStyleRow('Masonry', (
              <input type="checkbox" checked={props.masonry || false} onChange={(e) => updateProp('masonry', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
            {renderStyleRow('Độ phân giải', (
              <select value={props.imageResolution || 'Medium - 300 x 300'} onChange={(e) => updateProp('imageResolution', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="Thumbnail - 150 x 150">Thumbnail - 150 x 150</option>
                <option value="Medium - 300 x 300">Medium - 300 x 300</option>
                <option value="Large - 1024 x 1024">Large - 1024 x 1024</option>
                <option value="Full">Full</option>
              </select>
            ))}
            {renderStyleRow(renderResponsiveLabel('Image Ratio', 'imageRatio'), (
              <input type="number" step="0.01" value={responsiveValue('imageRatio', 1.5) as any} onChange={(e) => updateProp('imageRatio', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
            ))}
            {renderStyleRow(renderResponsiveLabel('Image Width', 'imageWidth'), (
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="100" value={responsiveValue('imageWidth', 100) as any} onChange={(e) => updateProp('imageWidth', e.target.value)} className="elementor-slider" />
                <span className="text-[10px] font-mono w-8 text-right">{responsiveValue('imageWidth', 100) as any}%</span>
              </div>
            ))}
            <hr className="border-slate-100" />
            {renderStyleRow('Title', (
              <input type="checkbox" checked={props.showTitle ?? true} onChange={(e) => updateProp('showTitle', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
            {props.showTitle !== false && renderStyleRow('Title HTML Tag', (
              <select value={props.titleHtmlTag || 'H3'} onChange={(e) => updateProp('titleHtmlTag', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                {['H1','H2','H3','H4','H5','H6','div','span','p'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ))}
            <hr className="border-slate-100" />
            {renderStyleRow('Excerpt', (
              <input type="checkbox" checked={props.showExcerpt ?? true} onChange={(e) => updateProp('showExcerpt', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
            {props.showExcerpt !== false && (
              <>
                {renderStyleRow('Excerpt Length', (
                  <input type="number" value={props.excerptLength || 101} onChange={(e) => updateProp('excerptLength', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
                ))}
                {renderStyleRow('Apply custom Excerpt', (
                  <input type="checkbox" checked={props.customExcerpt || false} onChange={(e) => updateProp('customExcerpt', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
                ))}
              </>
            )}
            <hr className="border-slate-100" />
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-600">Meta Data</label>
              <div className="grid grid-cols-3 gap-2">
                {['Date', 'Author', 'Comments'].map((metaItem) => {
                  const currentMeta = (props.metaData || 'Date,Comments').split(',').map((item: string) => item.trim()).filter(Boolean);
                  const checked = currentMeta.includes(metaItem);
                  return (
                    <label key={metaItem} className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const nextMeta = e.target.checked
                            ? Array.from(new Set([...currentMeta, metaItem]))
                            : currentMeta.filter((item: string) => item !== metaItem);
                          updateProp('metaData', nextMeta.join(','));
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {metaItem}
                    </label>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-400">Lưu tương thích dạng chuỗi: {props.metaData || 'Date,Comments'}</p>
            </div>
            {renderStyleRow('Separator Between', (
              <input type="text" value={props.separatorBetween || '///'} onChange={(e) => updateProp('separatorBetween', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
            ))}
            <hr className="border-slate-100" />
            {renderStyleRow('Read More', (
              <input type="checkbox" checked={props.showReadMore ?? true} onChange={(e) => updateProp('showReadMore', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
            {props.showReadMore !== false && renderStyleRow('Read More Text', (
              <input type="text" value={props.readMoreText || 'Read More »'} onChange={(e) => updateProp('readMoreText', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] text-center outline-none focus:border-brand-500" />
            ))}
          </div>
        ))}
        {renderAccordionSection('postgrid_query', 'Query', (
          <div className="space-y-3">
            {renderStyleRow('Source', (
              <select value={props.querySource || 'Bài viết'} onChange={(e) => updateProp('querySource', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="Bài viết">Bài viết</option>
                <option value="Trang">Trang</option>
                <option value="Manual Selection">Manual Selection</option>
                <option value="Current Query">Current Query</option>
                <option value="Related">Related</option>
              </select>
            ))}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Include By</label>
              <input type="text" value={props.queryInclude || ''} onChange={(e) => updateProp('queryInclude', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" placeholder="Term, Author..." />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Exclude By</label>
              <input type="text" value={props.queryExclude || ''} onChange={(e) => updateProp('queryExclude', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" placeholder="Term, Author..." />
            </div>
            {renderStyleRow('Date', (
              <select value={props.queryDate || 'All'} onChange={(e) => updateProp('queryDate', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="All">All</option>
                <option value="Past Day">Past Day</option>
                <option value="Past Week">Past Week</option>
                <option value="Past Month">Past Month</option>
                <option value="Past Quarter">Past Quarter</option>
                <option value="Past Year">Past Year</option>
              </select>
            ))}
            {renderStyleRow('Order By', (
              <select value={props.queryOrderBy || 'Date'} onChange={(e) => updateProp('queryOrderBy', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="Date">Date</option>
                <option value="Title">Title</option>
                <option value="Menu Order">Menu Order</option>
                <option value="Random">Random</option>
              </select>
            ))}
            {renderStyleRow('Order', (
              <select value={props.queryOrder || 'DESC'} onChange={(e) => updateProp('queryOrder', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="DESC">DESC</option>
                <option value="ASC">ASC</option>
              </select>
            ))}
            {renderStyleRow('Ignore Sticky', (
              <input type="checkbox" checked={props.ignoreStickyPosts ?? true} onChange={(e) => updateProp('ignoreStickyPosts', e.target.checked)} className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500" />
            ))}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Query ID</label>
              <input type="text" value={props.queryId || ''} onChange={(e) => updateProp('queryId', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 outline-none focus:border-brand-500" />
              <p className="text-[9px] text-slate-400 italic">Unique ID for server filtering</p>
            </div>
          </div>
        ))}
        {renderAccordionSection('postgrid_pagination', 'Pagination', (
          <div className="space-y-3">
            {renderStyleRow('Pagination', (
              <select value={props.paginationType || 'None'} onChange={(e) => updateProp('paginationType', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                <option value="None">None</option>
                <option value="Numbers">Numbers</option>
                <option value="Previous/Next">Previous/Next</option>
                <option value="Numbers + Previous/Next">Numbers + Previous/Next</option>
                <option value="Load on Click">Load on Click</option>
                <option value="Infinite Scroll">Infinite Scroll</option>
              </select>
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
  );
}
