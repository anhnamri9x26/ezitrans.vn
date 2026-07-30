"use client";

import React, { useState, useEffect } from 'react';
import {
  Layers, Plus, Search, Trash2, Edit, Copy, Check, X,
  Eye, Filter, AlertCircle, RefreshCw, Star, Info,
  Settings, ToggleLeft, ToggleRight, Layout, HelpCircle,
  Home, FileText, ChevronRight, Sparkles
} from 'lucide-react';
import GrapesEditor from '@/components/GrapesEditor';
import { useRouter } from 'next/navigation';
import CapabilityGuard from '@/components/CapabilityGuard';

interface Condition {
  id?: number;
  conditionType: 'INCLUDE' | 'EXCLUDE';
  targetType: 'ENTIRE_SITE' | 'ALL_POSTS' | 'ALL_PAGES' | 'ALL_PRODUCTS' | 'SPECIFIC_POST' | 'SPECIFIC_PAGE' | 'SPECIFIC_PRODUCT' | 'CATEGORY' | 'TAG' | 'AUTHOR' | 'CATEGORY_ARCHIVE' | 'TAG_ARCHIVE' | 'AUTHOR_ARCHIVE' | 'SEARCH_PAGE' | 'FOUR_O_FOUR_PAGE' | 'POST_TYPE';
  targetId?: number | null;
  targetSlug?: string | null;
}

interface Template {
  id: number;
  name: string;
  type: 'HEADER' | 'FOOTER' | 'SINGLE_POST' | 'SINGLE_PAGE' | 'SINGLE_PRODUCT' | 'ARCHIVE' | 'TAG_ARCHIVE' | 'HOMEPAGE' | 'FOUR_O_FOUR' | 'SEARCH' | 'LANDING_PAGE';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  componentFile?: string | null;
  htmlContent?: string | null;
  cssContent?: string | null;
  builderData?: string | null;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  conditions: Condition[];
}

const TEMPLATE_TYPES = [
  { value: 'HEADER', label: 'Header', desc: 'Đầu trang', icon: <Layout className="w-4 h-4 text-emerald-500" /> },
  { value: 'FOOTER', label: 'Footer', desc: 'Chân trang', icon: <Layout className="w-4 h-4 text-emerald-500 rotate-180" /> },
  { value: 'SINGLE_POST', label: 'Single Post', desc: 'Chi tiết bài viết', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
  { value: 'SINGLE_PAGE', label: 'Single Page', desc: 'Trang đơn tĩnh', icon: <FileText className="w-4 h-4 text-sky-500" /> },
  { value: 'SINGLE_PRODUCT', label: 'Single Product', desc: 'Chi tiết sản phẩm', icon: <FileText className="w-4 h-4 text-teal-500" /> },
  { value: 'HOMEPAGE', label: 'Homepage', desc: 'Trang chủ', icon: <Home className="w-4 h-4 text-rose-500" /> },
  { value: 'ARCHIVE', label: 'Category Archive', desc: 'Trang chuyên mục', icon: <Layers className="w-4 h-4 text-amber-500" /> },
  { value: 'TAG_ARCHIVE', label: 'Tag Archive', desc: 'Trang lưu trữ thẻ', icon: <Layers className="w-4 h-4 text-purple-500" /> },
  { value: 'SEARCH', label: 'Search Results', desc: 'Trang tìm kiếm', icon: <Search className="w-4 h-4 text-blue-500" /> },
  { value: 'FOUR_O_FOUR', label: '404 Page', desc: 'Trang lỗi 404', icon: <HelpCircle className="w-4 h-4 text-orange-500" /> },
  { value: 'LANDING_PAGE', label: 'Landing Page', desc: 'Trang đích độc lập', icon: <Layers className="w-4 h-4 text-pink-500" /> }
];

const TARGET_TYPE_LABELS: Record<string, string> = {
  ENTIRE_SITE: 'Toàn bộ trang web',
  ALL_POSTS: 'Tất cả bài viết',
  ALL_PAGES: 'Tất cả trang tĩnh',
  ALL_PRODUCTS: 'Tất cả sản phẩm',
  SPECIFIC_POST: 'Bài viết cụ thể',
  SPECIFIC_PAGE: 'Trang cụ thể',
  SPECIFIC_PRODUCT: 'Sản phẩm cụ thể',
  CATEGORY: 'Trong chuyên mục',
  TAG: 'Trong thẻ',
  AUTHOR: 'Bởi tác giả',
  CATEGORY_ARCHIVE: 'Lưu trữ chuyên mục',
  TAG_ARCHIVE: 'Lưu trữ thẻ',
  AUTHOR_ARCHIVE: 'Lưu trữ tác giả',
  SEARCH_PAGE: 'Trang tìm kiếm',
  FOUR_O_FOUR_PAGE: 'Trang lỗi 404',
  POST_TYPE: 'Post type',
};

function getConditionGroup(targetType: string): string {
  if (targetType === 'ENTIRE_SITE') return 'ENTIRE_SITE';
  if (['ALL_POSTS', 'CATEGORY', 'TAG', 'AUTHOR', 'SPECIFIC_POST'].includes(targetType)) return 'POSTS';
  if (['ALL_PAGES', 'SPECIFIC_PAGE'].includes(targetType)) return 'PAGES';
  if (['ALL_PRODUCTS', 'SPECIFIC_PRODUCT'].includes(targetType)) return 'PRODUCTS';
  if (['CATEGORY_ARCHIVE', 'TAG_ARCHIVE', 'AUTHOR_ARCHIVE'].includes(targetType)) return 'ARCHIVE';
  if (targetType === 'SEARCH_PAGE') return 'SEARCH';
  if (targetType === 'FOUR_O_FOUR_PAGE') return 'FOUR_O_FOUR';
  return 'ENTIRE_SITE';
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPluginActive, setIsPluginActive] = useState(true);
  const [themeComponents, setThemeComponents] = useState<string[]>([]);
  const [allThemeComponents, setAllThemeComponents] = useState<string[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>('default');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data for Autocomplete conditions selection
  const [posts, setPosts] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'source' | 'conditions'>('general');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Template['type']>('SINGLE_POST');
  const [formStatus, setFormStatus] = useState<Template['status']>('ACTIVE');
  const [formSourceType, setFormSourceType] = useState<'file' | 'builder'>('file');
  const [formComponentFile, setFormComponentFile] = useState('');
  const [formHtmlContent, setFormHtmlContent] = useState('');
  const [formCssContent, setFormCssContent] = useState('');
  const [formGrapesjsData, setFormGrapesjsData] = useState('');
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);
  const [isQuickVisualEdit, setIsQuickVisualEdit] = useState(false);
  const [formConditions, setFormConditions] = useState<Condition[]>([]);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchMetadataOptions();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      fetchThemeComponents(formType);
    }
  }, [formType, modalOpen]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  async function fetchTemplates() {
    setLoading(true);
    try {
      // Check plugin status first
      const pluginsRes = await fetch('/api/plugins');
      const pluginsData = await pluginsRes.json();
      if (pluginsData.success && pluginsData.plugins) {
        const plugin = pluginsData.plugins.find((p: any) => p.id === 'lexi-page-builder');
        setIsPluginActive(plugin ? plugin.isActive !== false : true);
      }

      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }

      // Fetch all theme components to count built-in templates
      try {
        const compRes = await fetch('/api/templates/components');
        const compData = await compRes.json();
        if (compData.success) {
          setAllThemeComponents(compData.allComponents || []);
        }
      } catch (err) {
        console.error('Failed to load theme components:', err);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      showAlert('error', 'Lỗi kết nối máy chủ khi lấy danh sách templates');
    } finally {
      setLoading(false);
    }
  }

  async function fetchThemeComponents(type: string) {
    try {
      const res = await fetch(`/api/templates/components?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setThemeComponents(data.components);
        setActiveThemeId(data.themeId);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    }
  }

  async function fetchMetadataOptions() {
    try {
      const [resPosts, resCats, resTags, resAuthors] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/categories'),
        fetch('/api/tags'),
        fetch('/api/users')
      ]);

      const dataPosts = await resPosts.json();
      const dataCats = await resCats.json();
      const dataTags = await resTags.json();
      const dataAuthors = await resAuthors.json();

      if (dataPosts.success) {
        setPosts(dataPosts.posts.filter((p: any) => p.type === 'POST'));
        setPages(dataPosts.posts.filter((p: any) => p.type === 'PAGE'));
        setProducts(dataPosts.posts.filter((p: any) => p.type === 'PRODUCT'));
      }
      if (dataCats.success) {
        setCategories(dataCats.categories || dataCats.data || []);
      }
      if (dataTags.success) {
        setTags(dataTags.tags || dataTags.data || []);
      }
      if (dataAuthors.success) {
        setAuthors(dataAuthors.users || dataAuthors.data || []);
      }
    } catch (err) {
      console.error('Error fetching metadata autocomplete options:', err);
    }
  }

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormType('SINGLE_POST');
    setFormStatus('ACTIVE');
    setFormSourceType('file');
    setFormComponentFile('');
    setFormHtmlContent('');
    setFormCssContent('');
    setFormGrapesjsData('');
    setFormConditions([]);
    setActiveTab('general');
    setIsQuickVisualEdit(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tpl: Template) => {
    setEditingId(tpl.id);
    setFormName(tpl.name);
    setFormType(tpl.type);
    setFormStatus(tpl.status);
    setFormSourceType(tpl.htmlContent ? 'builder' : 'file');
    setFormComponentFile(tpl.componentFile || '');
    setFormHtmlContent(tpl.htmlContent || '');
    setFormCssContent(tpl.cssContent || '');
    setFormGrapesjsData(tpl.builderData || '');
    setFormConditions(tpl.conditions.map(c => ({
      conditionType: c.conditionType,
      targetType: c.targetType,
      targetId: c.targetId,
      targetSlug: c.targetSlug
    })));
    setActiveTab('general');
    setIsQuickVisualEdit(false);
    setModalOpen(true);
  };

  const handleOpenQuickVisualEditor = (tpl: Template) => {
    setEditingId(tpl.id);
    setFormName(tpl.name);
    setFormHtmlContent(tpl.htmlContent || '');
    setFormGrapesjsData(tpl.builderData || '');
    setIsQuickVisualEdit(true);
    setIsVisualEditorOpen(true);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.warning) {
          showAlert('success', `${data.message} ${data.warning}`);
        } else {
          showAlert('success', data.message);
        }
        fetchTemplates();
      } else {
        showAlert('error', data.error);
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối máy chủ');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', id }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => [...prev, data.template]);
        showAlert('success', data.message);
      } else {
        showAlert('error', data.error);
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối máy chủ');
    }
  };



  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa template này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        showAlert('success', data.message);
      } else {
        showAlert('error', data.error);
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối máy chủ');
    }
  };

  const handleAddCondition = (condType: 'INCLUDE' | 'EXCLUDE') => {
    setFormConditions(prev => [
      ...prev,
      { conditionType: condType, targetType: 'ENTIRE_SITE', targetId: null, targetSlug: null }
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setFormConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: any) => {
    setFormConditions(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, [field]: value };
      
      // Auto reset targetId/Slug when changing targetType
      if (field === 'targetType') {
        updated.targetId = null;
        updated.targetSlug = null;
      }
      return updated;
    }));
  };

  const handleGroupChange = (index: number, group: string) => {
    let defaultTargetType = 'ENTIRE_SITE';
    if (group === 'POSTS') defaultTargetType = 'ALL_POSTS';
    else if (group === 'PAGES') defaultTargetType = 'ALL_PAGES';
    else if (group === 'PRODUCTS') defaultTargetType = 'ALL_PRODUCTS';
    else if (group === 'ARCHIVE') defaultTargetType = 'CATEGORY_ARCHIVE';
    else if (group === 'SEARCH') defaultTargetType = 'SEARCH_PAGE';
    else if (group === 'FOUR_O_FOUR') defaultTargetType = 'FOUR_O_FOUR_PAGE';

    setFormConditions(prev => prev.map((c, i) => {
      if (i !== index) return c;
      return { ...c, targetType: defaultTargetType as any, targetId: null, targetSlug: null };
    }));
  };

  const handleSubtypeChange = (index: number, subtype: string) => {
    setFormConditions(prev => prev.map((c, i) => {
      if (i !== index) return c;
      return { ...c, targetType: subtype as any, targetId: null, targetSlug: null };
    }));
  };

  const handleItemChange = (index: number, itemId: number | null) => {
    setFormConditions(prev => prev.map((c, i) => {
      if (i !== index) return c;
      return { ...c, targetId: itemId };
    }));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showAlert('error', 'Vui lòng nhập tên Template');
      return;
    }

    const payload = {
      action: editingId ? 'update' : 'create',
      id: editingId,
      name: formName,
      type: formType,
      status: formStatus,
      priority: 10,
      isDefault: false,
      componentFile: null,
      htmlContent: formHtmlContent || null,
      cssContent: formCssContent || null,
      builderData: formGrapesjsData || null,
      conditions: formConditions
    };

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (data.warning) {
          showAlert('success', `${data.message} ${data.warning}`);
        } else {
          showAlert('success', data.message);
        }
        setModalOpen(false);
        fetchTemplates();
      } else {
        showAlert('error', data.error);
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối máy chủ');
    }
  };

  // Inject Built-in Templates into filteredTemplates
  const builtInTemplates: Template[] = [];
  const f = allThemeComponents.map(x => x.toLowerCase());
  
  const addBuiltIn = (type: Template['type'], names: string[]) => {
    const matchedName = names.find(n => f.includes(n.toLowerCase()));
    if (matchedName) {
      const exactFile = allThemeComponents.find(x => x.toLowerCase() === matchedName.toLowerCase());
      builtInTemplates.push({
        id: -1 * (builtInTemplates.length + 1), // Negative ID to indicate virtual template
        name: `${TEMPLATE_TYPES.find(t => t.value === type)?.label || type} (Mặc định)`,
        type: type,
        status: 'ACTIVE',
        componentFile: exactFile + '.tsx',
        isDefault: true,
        priority: 0,
        createdAt: new Date().toISOString(),
        conditions: [{ conditionType: 'INCLUDE', targetType: 'ENTIRE_SITE' } as any]
      } as Template);
    }
  };

  addBuiltIn('HEADER', ['header']);
  addBuiltIn('FOOTER', ['footer']);
  addBuiltIn('HOMEPAGE', ['homepage']);
  addBuiltIn('SINGLE_POST', ['postpage', 'singlepost']);
  addBuiltIn('SINGLE_PAGE', ['page', 'singlepage']);
  addBuiltIn('SINGLE_PRODUCT', ['productpage', 'product']);
  addBuiltIn('ARCHIVE', ['categorypage', 'archive']);
  addBuiltIn('TAG_ARCHIVE', ['tagpage']);
  addBuiltIn('SEARCH', ['searchpage', 'search']);
  addBuiltIn('FOUR_O_FOUR', ['notfound', '404']);

  // UI Filtering
  const filteredTemplates = [...templates, ...builtInTemplates].filter(t => {
    const matchesFilter = filterType === 'ALL' || t.type === filterType;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.componentFile && t.componentFile.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Analytics for Slots
  const getSlotStats = (type: string) => {
    const slotTpls = templates.filter(t => t.type === type);
    let activeCount = slotTpls.filter(t => t.status === 'ACTIVE').length;
    let totalCount = slotTpls.length;

    const f = allThemeComponents.map(x => x.toLowerCase());
    let hasBuiltIn = false;
    switch(type) {
      case 'HEADER': hasBuiltIn = f.includes('header'); break;
      case 'FOOTER': hasBuiltIn = f.includes('footer'); break;
      case 'HOMEPAGE': hasBuiltIn = f.includes('homepage'); break;
      case 'SINGLE_POST': hasBuiltIn = f.includes('postpage') || f.includes('singlepost'); break;
      case 'SINGLE_PAGE': hasBuiltIn = f.includes('page') || f.includes('singlepage'); break;
      case 'SINGLE_PRODUCT': hasBuiltIn = f.includes('productpage') || f.includes('product'); break;
      case 'ARCHIVE': hasBuiltIn = f.includes('categorypage') || f.includes('archive'); break;
      case 'TAG_ARCHIVE': hasBuiltIn = f.includes('tagpage'); break;
      case 'SEARCH': hasBuiltIn = f.includes('searchpage') || f.includes('search'); break;
      case 'FOUR_O_FOUR': hasBuiltIn = f.includes('notfound') || f.includes('404'); break;
    }

    if (hasBuiltIn) {
      activeCount += 1;
      totalCount += 1;
    }

    return { total: totalCount, active: activeCount };
  };

  if (!isPluginActive) {
    return (
      <div className="max-w-2xl mx-auto font-sans pt-12 pb-24 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shrink-0 shadow-sm border border-indigo-100">
            <Layout size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Lexi Page Builder Chưa Kích Hoạt</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Trình dựng trang kéo thả và hệ thống Theme Builder hiện đang bị tắt. Vui lòng kích hoạt lại plugin trong Plugin Manager để sử dụng chức năng thiết kế giao diện động.
          </p>
          <a
            href="/admin/settings/plugins" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98 no-underline"
          >
            Kích hoạt Plugin ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_templates">
      <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Alert Component */}
      {alert && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{alert.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">
            <Layout className="w-3.5 h-3.5" />
            <span>Thiết kế giao diện</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Theme Builder
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase select-none">
              Elementor Style
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Tạo và quản lý các template động (Header, Footer, Single, Archive) kèm quy tắc điều kiện hiển thị thông minh.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm Template Mới
        </button>
      </div>

      {/* Section 1: Template Type Grid (Slots Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {TEMPLATE_TYPES.map(type => {
          const stats = getSlotStats(type.value);
          const isCurrentFilter = filterType === type.value;
          return (
            <div
              key={type.value}
              onClick={() => setFilterType(isCurrentFilter ? 'ALL' : type.value)}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 group select-none relative overflow-hidden ${
                isCurrentFilter ? 'ring-2 ring-indigo-600 border-indigo-200 shadow-sm shadow-indigo-600/5' : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 transition-colors">
                  {type.icon}
                </div>
                <div className="text-right">
                  <span className="block text-lg font-black text-slate-800 tracking-tight">
                    {stats.active}<span className="text-slate-300 font-normal">/{stats.total}</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {type.label}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{type.desc}</p>
              </div>

              {isCurrentFilter && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Section 2: Filters & Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Tất cả ({templates.length})
            </button>
            {TEMPLATE_TYPES.map(t => {
              const count = templates.filter(x => x.type === t.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    filterType === t.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-sm">Không tìm thấy template nào</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Không có template nào phù hợp với bộ lọc hiện tại. Nhấp vào "Thêm Template Mới" để tạo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5">Tên Template</th>
                  <th className="px-6 py-3.5">Loại</th>
                  <th className="px-6 py-3.5">Điều kiện hiển thị</th>
                  <th className="px-6 py-3.5 text-center">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTemplates.map((tpl) => {
                  const typeObj = TEMPLATE_TYPES.find(t => t.value === tpl.type);
                  return (
                    <tr key={tpl.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span>{tpl.name}</span>
                          {tpl.id < 0 ? (
                            <span className="text-[10px] text-indigo-500 font-bold mt-0.5">Code Tĩnh ({tpl.componentFile})</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {tpl.id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-bold text-[10px]">
                          {typeObj?.icon}
                          {typeObj?.label || tpl.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {tpl.conditions.length === 0 ? (
                          <span className="text-slate-400 italic">Không có quy tắc hiển thị</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {tpl.conditions.map((c, idx) => (
                              <span
                                key={idx}
                                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  c.conditionType === 'INCLUDE' 
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                    : 'bg-rose-50 border border-rose-100 text-rose-700'
                                }`}
                              >
                                {c.conditionType}: {TARGET_TYPE_LABELS[c.targetType] || c.targetType} {c.targetId ? `(ID: ${c.targetId})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {tpl.id < 0 ? (
                          <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Gốc (Code)
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(tpl.id)}
                            className="focus:outline-none cursor-pointer inline-block"
                          >
                            {tpl.status === 'ACTIVE' ? (
                              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </div>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tpl.id < 0 ? (
                          <button
                            onClick={() => {
                              handleOpenCreateModal();
                              setFormType(tpl.type);
                            }}
                            className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                          >
                            Thiết kế đè bằng Page Builder
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => router.push(`/admin/templates/builder/${tpl.id}`)}
                              className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                              title="Sửa trực quan với GrapesJS"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(tpl)}
                              className="p-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(tpl.id)}
                              className="p-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Nhân bản"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(tpl.id)}
                              className="p-1.5 bg-rose-50 border border-rose-100 hover:border-rose-300 text-rose-600 hover:bg-rose-100/50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit Template */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Theme Builder</span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingId ? `Chỉnh sửa Template: ${formName}` : 'Tạo Template Mới'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 flex select-none">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'general'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                Thông tin chung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('source')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'source'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-4 h-4" />
                Nguồn Giao diện
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('conditions')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'conditions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                Quy tắc hiển thị
                {formConditions.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                    {formConditions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body & Forms */}
            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6">
              
              {/* Tab 1: General Info */}
              {activeTab === 'general' && (
                <div className="space-y-5 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Template *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Header chính cho Blog, Single Post cho IELTS..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Template *</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as Template['type'])}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-semibold"
                      >
                        {TEMPLATE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label} ({t.desc})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Trạng thái kích hoạt</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as Template['status'])}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-semibold"
                      >
                        <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
                        <option value="INACTIVE">Không kích hoạt (INACTIVE)</option>
                        <option value="DRAFT">Bản nháp (DRAFT)</option>
                      </select>
                    </div>
                  </div>


                </div>
              )}

              {/* Tab 2: Visual Builder & Code Editors */}
              {activeTab === 'source' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100/60 shadow-sm" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                        Trình dựng giao diện trực quan kéo thả GrapesJS
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">
                        Thiết kế giao diện kéo thả cực kỳ chuyên nghiệp và trực quan với hàng chục khối giao diện mẫu của Lexi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVisualEditorOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      Thiết kế kéo thả (GrapesJS)
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">Nội dung HTML (Custom HTML)</label>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Hỗ trợ tags: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{"{{post.title}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{"{{post.content}}"}</code>
                          </span>
                        </div>
                        <textarea
                          rows={8}
                          placeholder="Nhập mã HTML tùy chỉnh tại đây..."
                          value={formHtmlContent}
                          onChange={(e) => setFormHtmlContent(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-950 text-emerald-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Custom CSS Stylesheet</label>
                        <textarea
                          rows={6}
                          placeholder="/* Viết CSS tùy chỉnh tại đây... */"
                          value={formCssContent}
                          onChange={(e) => setFormCssContent(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-950 text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                </div>
              )}

              {/* Tab 3: Display Conditions */}
              {activeTab === 'conditions' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Hệ thống điều kiện hiển thị
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Đặt điều kiện hiển thị cho template. Nếu có ít nhất 1 quy tắc INCLUDE đúng và KHÔNG CÓ quy tắc EXCLUDE nào đúng, template sẽ được hiển thị.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddCondition('INCLUDE')}
                      className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm điều kiện hiển thị (INCLUDE)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCondition('EXCLUDE')}
                      className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm điều kiện loại trừ (EXCLUDE)
                    </button>
                  </div>

                  {formConditions.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-400 block uppercase">Không có điều kiện hiển thị</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block max-w-xs mx-auto">
                        Template không có điều kiện hiển thị nào sẽ hoạt động như một fallback tuyệt đối hoặc phụ thuộc hoàn toàn vào cài đặt mặc định.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formConditions.map((cond, index) => (
                        <div
                          key={index}
                          className={`flex flex-wrap items-center gap-3 p-3.5 border rounded-xl shadow-sm transition-all ${
                            cond.conditionType === 'INCLUDE' 
                              ? 'bg-emerald-50/10 border-emerald-200/60' 
                              : 'bg-rose-50/10 border-rose-200/60'
                          }`}
                        >
                          {/* Type Label Indicator */}
                          <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                            cond.conditionType === 'INCLUDE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {cond.conditionType}
                          </div>

                           {/* Select 1: Main Group */}
                           <select
                             value={getConditionGroup(cond.targetType)}
                             onChange={(e) => handleGroupChange(index, e.target.value)}
                             className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold text-slate-800"
                           >
                             <option value="ENTIRE_SITE">Toàn bộ trang web</option>
                             <option value="POSTS">Bài viết (Posts)</option>
                             <option value="PAGES">Trang tĩnh (Pages)</option>
                             <option value="PRODUCTS">Sản phẩm (Products)</option>
                             <option value="ARCHIVE">Trang lưu trữ (Archives)</option>
                             <option value="SEARCH">Tìm kiếm (Search)</option>
                             <option value="FOUR_O_FOUR">Lỗi 404</option>
                           </select>

                           {/* Select 2: Sub-type (Cascading) */}
                           {getConditionGroup(cond.targetType) === 'POSTS' && (
                             <select
                               value={cond.targetType}
                               onChange={(e) => handleSubtypeChange(index, e.target.value)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold text-slate-700"
                             >
                               <option value="ALL_POSTS">Tất cả bài viết</option>
                               <option value="CATEGORY">Trong chuyên mục (In Category)</option>
                               <option value="TAG">Trong thẻ (In Tag)</option>
                               <option value="AUTHOR">Bởi tác giả (By Author)</option>
                               <option value="SPECIFIC_POST">Bài viết cụ thể</option>
                             </select>
                           )}

                           {getConditionGroup(cond.targetType) === 'PAGES' && (
                             <select
                               value={cond.targetType}
                               onChange={(e) => handleSubtypeChange(index, e.target.value)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold text-slate-700"
                             >
                               <option value="ALL_PAGES">Tất cả trang tĩnh</option>
                               <option value="SPECIFIC_PAGE">Trang cụ thể</option>
                             </select>
                           )}

                           {getConditionGroup(cond.targetType) === 'PRODUCTS' && (
                             <select
                               value={cond.targetType}
                               onChange={(e) => handleSubtypeChange(index, e.target.value)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold text-slate-700"
                             >
                               <option value="ALL_PRODUCTS">Tất cả sản phẩm</option>
                               <option value="SPECIFIC_PRODUCT">Sản phẩm cụ thể</option>
                             </select>
                           )}

                           {getConditionGroup(cond.targetType) === 'ARCHIVE' && (
                             <select
                               value={cond.targetType}
                               onChange={(e) => handleSubtypeChange(index, e.target.value)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold text-slate-700"
                             >
                               <option value="CATEGORY_ARCHIVE">Lưu trữ chuyên mục (Category Archive)</option>
                               <option value="TAG_ARCHIVE">Lưu trữ thẻ (Tag Archive)</option>
                               <option value="AUTHOR_ARCHIVE">Lưu trữ tác giả (Author Archive)</option>
                             </select>
                           )}

                           {/* Select 3: Target Item (Cascading) */}
                           {(cond.targetType === 'CATEGORY' || cond.targetType === 'CATEGORY_ARCHIVE') && (
                             <select
                               value={cond.targetId || ''}
                               required={cond.targetType === 'CATEGORY'}
                               onChange={(e) => handleItemChange(index, e.target.value ? Number(e.target.value) : null)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
                             >
                               <option value="">{cond.targetType === 'CATEGORY_ARCHIVE' ? '-- Tất cả chuyên mục --' : '-- Chọn chuyên mục --'}</option>
                               {categories.map(c => (
                                 <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>
                               ))}
                             </select>
                           )}

                           {(cond.targetType === 'TAG' || cond.targetType === 'TAG_ARCHIVE') && (
                             <select
                               value={cond.targetId || ''}
                               required={cond.targetType === 'TAG'}
                               onChange={(e) => handleItemChange(index, e.target.value ? Number(e.target.value) : null)}
                               className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
                             >
                               <option value="">{cond.targetType === 'TAG_ARCHIVE' ? '-- Tất cả thẻ --' : '-- Chọn thẻ --'}</option>
                               {tags.map(t => (
                                 <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                               ))}
                             </select>
                           )}

                            {(cond.targetType === 'AUTHOR' || cond.targetType === 'AUTHOR_ARCHIVE') && (
                              <select
                                value={cond.targetId || ''}
                                required={cond.targetType === 'AUTHOR'}
                                onChange={(e) => handleItemChange(index, e.target.value ? Number(e.target.value) : null)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-800"
                              >
                                <option value="">{cond.targetType === 'AUTHOR_ARCHIVE' ? '-- Tất cả tác giả --' : '-- Chọn tác giả --'}</option>
                                {authors.map(u => (
                                  <option key={u.id} value={u.id}>{u.name || u.username} (ID: {u.id})</option>
                                ))}
                              </select>
                            )}

                            {cond.targetType === 'SPECIFIC_POST' && (
                              <select
                                value={cond.targetId || ''}
                                required
                                onChange={(e) => handleItemChange(index, Number(e.target.value))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-855"
                              >
                                <option value="">-- Chọn bài viết --</option>
                                {posts.map(p => (
                                  <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>
                                ))}
                              </select>
                            )}

                            {cond.targetType === 'SPECIFIC_PAGE' && (
                              <select
                                value={cond.targetId || ''}
                                required
                                onChange={(e) => handleItemChange(index, Number(e.target.value))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-855"
                              >
                                <option value="">-- Chọn trang tĩnh --</option>
                                {pages.map(p => (
                                  <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>
                                ))}
                              </select>
                            )}

                            {cond.targetType === 'SPECIFIC_PRODUCT' && (
                              <select
                                value={cond.targetId || ''}
                                required
                                onChange={(e) => handleItemChange(index, Number(e.target.value))}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium text-slate-855"
                              >
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>
                                ))}
                              </select>
                            )}

                          {/* Trash Delete button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(index)}
                            className="ml-auto p-1.5 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Xóa dòng điều kiện"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                {activeTab !== 'general' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'source') setActiveTab('general');
                      else if (activeTab === 'conditions') setActiveTab('source');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Quay lại
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  {activeTab !== 'conditions' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'general') setActiveTab('source');
                        else if (activeTab === 'source') setActiveTab('conditions');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Tiếp tục
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {editingId ? 'Cập nhật Template' : 'Tạo Template Mới'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVisualEditorOpen && (
        <GrapesEditor
          initialContent={formHtmlContent}
          initialData={formGrapesjsData}
          pageTitle={formName || 'Template không có tiêu đề'}
          onSave={async (compiledHtml, projectDataJson) => {
            if (isQuickVisualEdit && editingId) {
              try {
                const res = await fetch('/api/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update',
                    id: editingId,
                    htmlContent: compiledHtml,
                    builderData: projectDataJson,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  showAlert('success', 'Đã lưu thiết kế Template trực quan thành công!');
                  fetchTemplates();
                } else {
                  showAlert('error', data.error || 'Lỗi khi lưu thiết kế');
                }
              } catch (err) {
                showAlert('error', 'Lỗi kết nối máy chủ');
              } finally {
                setIsVisualEditorOpen(false);
                setIsQuickVisualEdit(false);
              }
            } else {
              setFormHtmlContent(compiledHtml);
              setFormGrapesjsData(projectDataJson);
              setIsVisualEditorOpen(false);
            }
          }}
          onClose={() => {
            setIsVisualEditorOpen(false);
            setIsQuickVisualEdit(false);
          }}
          onAutoSave={async (compiledHtml, projectDataJson) => {
            if (editingId) {
              try {
                const res = await fetch('/api/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update',
                    id: editingId,
                    htmlContent: compiledHtml,
                    builderData: projectDataJson,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  setFormHtmlContent(compiledHtml);
                  setFormGrapesjsData(projectDataJson);
                  fetchTemplates();
                  return true;
                }
              } catch (err) {
                console.error('Modal autosave failed:', err);
              }
            } else {
              // Creating a new template, autosave to local state
              setFormHtmlContent(compiledHtml);
              setFormGrapesjsData(projectDataJson);
              return true;
            }
            return false;
          }}
        />
      )}
      </div>
    </CapabilityGuard>
  );
}
