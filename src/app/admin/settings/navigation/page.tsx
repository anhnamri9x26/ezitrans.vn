"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Menu, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Plus, 
  Link2, 
  Layers,
  ArrowLeft,
  ArrowRight,
  Settings,
  X,
  GripVertical,
  Package, 
  ShoppingBag, 
  Truck, 
  Plane, 
  Ship, 
  Globe, 
  TrendingUp, 
  ShieldCheck, 
  Calculator, 
  HelpCircle,
  FileText,
  Search
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  indent: number; // 0, 1, 2
  isMega?: boolean; // chỉ dành cho cấp cha (indent 0)
  description?: string; // dành cho cấp con/cháu
  icon?: string; // dành cho cấp con/cháu
}

const iconList = [
  { name: 'ShoppingBag', label: 'Mua sắm', component: ShoppingBag },
  { name: 'Package', label: 'Hàng hóa', component: Package },
  { name: 'Truck', label: 'Vận tải bộ', component: Truck },
  { name: 'Plane', label: 'Hàng không', component: Plane },
  { name: 'Ship', label: 'Đường thủy', component: Ship },
  { name: 'Globe', label: 'Quốc tế', component: Globe },
  { name: 'TrendingUp', label: 'Tỷ giá', component: TrendingUp },
  { name: 'ShieldCheck', label: 'Bảo hiểm', component: ShieldCheck },
  { name: 'Calculator', label: 'Tính cước', component: Calculator },
  { name: 'HelpCircle', label: 'Hỗ trợ', component: HelpCircle },
];

const getIconComponent = (iconName?: string) => {
  if (!iconName) return FileText;
  const match = iconList.find(i => i.name === iconName);
  return match ? match.component : FileText;
};

export default function AdminNavigationMenusPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');

  const [settings, setSettings] = useState<any>({});
  const [headerMenu, setHeaderMenu] = useState<MenuItem[]>([]);
  const [footerMenu, setFooterMenu] = useState<MenuItem[]>([]);

  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Dynamic link selector states
  const [searchTab, setSearchTab] = useState<'quick' | 'page' | 'post' | 'category'>('quick');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [pagesList, setPagesList] = useState<{ label: string; url: string }[]>([]);
  const [postsList, setPostsList] = useState<{ label: string; url: string }[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ label: string; url: string }[]>([]);

  // State phục vụ kéo thả (Drag and Drop)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const quickLinks = [
    { label: 'Trang chủ', url: '/' },
    { label: 'Dịch vụ Mua hộ', url: '/mua-ho' },
    { label: 'Dịch vụ Ship hộ', url: '/ship-ho' },
    { label: 'Bảng điều khiển', url: '/admin/dashboard' },
    { label: 'Ý kiến phản hồi', url: '/admin/comments' },
    { label: 'Trang Giới thiệu', url: '/gioi-thieu.html' },
    { label: 'Trang Liên hệ', url: '/lien-he.html' }
  ];

  const generateId = () => {
    return `menu_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  };

  const normalizeMenu = (menuJsonString: string): MenuItem[] => {
    if (!menuJsonString) return [];
    try {
      const raw = JSON.parse(menuJsonString);
      if (!Array.isArray(raw)) return [];
      
      return raw.map((item: any, index: number) => ({
        id: item.id || `menu_item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        label: item.label || '',
        url: item.url || '',
        indent: typeof item.indent === 'number' ? Math.min(2, Math.max(0, item.indent)) : 0,
        isMega: item.isMega === true || item.isMega === 'true',
        description: item.description || '',
        icon: item.icon || ''
      }));
    } catch (e) {
      console.error("Failed to parse menu:", e);
      return [];
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          
          if (data.settings.theme_menu_header) {
            setHeaderMenu(normalizeMenu(data.settings.theme_menu_header));
          }
          if (data.settings.theme_menu_footer) {
            setFooterMenu(normalizeMenu(data.settings.theme_menu_footer));
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);
  // Load dynamic data for linking (Posts, Pages, Categories)
  useEffect(() => {
    async function fetchSelectorData() {
      try {
        const postsRes = await fetch('/api/posts');
        const postsData = await postsRes.json();
        if (postsData.success && Array.isArray(postsData.posts)) {
          const rawPosts = postsData.posts;
          
          const pages = rawPosts
            .filter((p: any) => p.type === 'PAGE' && p.status === 'PUBLISHED')
            .map((p: any) => ({
              label: p.title,
              url: `/${p.slug}.html`
            }));
          setPagesList(pages);

          const posts = rawPosts
            .filter((p: any) => p.type === 'POST' && p.status === 'PUBLISHED')
            .map((p: any) => ({
              label: p.title,
              url: `/${p.slug}.html`
            }));
          setPostsList(posts);
        }

        const catsRes = await fetch('/api/categories');
        const catsData = await catsRes.json();
        if (catsData.success && Array.isArray(catsData.categories)) {
          const cats = catsData.categories.map((c: any) => ({
            label: c.name,
            url: `/category/${c.slug}`
          }));
          setCategoriesList(cats);
        }
      } catch (err) {
        console.error("Failed to load selector links:", err);
      }
    }
    fetchSelectorData();
  }, []);

  const getActiveItems = () => {
    let list: { label: string; url: string }[] = [];
    if (searchTab === 'quick') list = quickLinks;
    else if (searchTab === 'page') list = pagesList;
    else if (searchTab === 'post') list = postsList;
    else if (searchTab === 'category') list = categoriesList;

    if (!linkSearchQuery.trim()) return list;
    
    const q = linkSearchQuery.toLowerCase();
    return list.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.url.toLowerCase().includes(q)
    );
  };

  const handleAddQuickLinkDirectly = (label: string, url: string) => {
    const updated = [
      ...getActiveMenu(),
      {
        id: generateId(),
        label: label.trim(),
        url: url.trim(),
        indent: 0,
        isMega: false,
        description: '',
        icon: ''
      }
    ];
    setActiveMenu(updated);
  };
  const getActiveMenu = () => {
    return activeTab === 'header' ? headerMenu : footerMenu;
  };

  const setActiveMenu = (updated: MenuItem[]) => {
    if (activeTab === 'header') {
      setHeaderMenu(updated);
    } else {
      setFooterMenu(updated);
    }
  };

  // 1. Thêm mục menu mới
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newUrl) {
      alert('Vui lòng điền đầy đủ Nhãn hiển thị và Liên kết URL!');
      return;
    }
    const updated = [
      ...getActiveMenu(), 
      { 
        id: generateId(),
        label: newLabel.trim(), 
        url: newUrl.trim(),
        indent: 0,
        isMega: false,
        description: '',
        icon: ''
      }
    ];
    setActiveMenu(updated);
    setNewLabel('');
    setNewUrl('');
  };

  const handleQuickSelect = (label: string, url: string) => {
    setNewLabel(label);
    setNewUrl(url);
  };

  const handleDeleteItem = (id: string) => {
    if (editingItemId === id) setEditingItemId(null);
    const updated = getActiveMenu().filter(item => item.id !== id);
    setActiveMenu(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const current = [...getActiveMenu()];
    const temp = current[index];
    current[index] = current[index - 1];
    current[index - 1] = temp;
    setActiveMenu(current);
  };

  const handleMoveDown = (index: number) => {
    const current = [...getActiveMenu()];
    if (index === current.length - 1) return;
    const temp = current[index];
    current[index] = current[index + 1];
    current[index + 1] = temp;
    setActiveMenu(current);
  };

  // Tăng thụt lề (Arrow Right) -> Tối đa 2 cấp (0, 1, 2)
  const handleIndent = (index: number) => {
    if (index === 0) return;
    const current = [...getActiveMenu()];
    const prevItem = current[index - 1];
    
    // Giới hạn thụt dòng không quá previous.indent + 1
    const targetIndent = current[index].indent + 1;
    if (targetIndent <= 2 && targetIndent <= prevItem.indent + 1) {
      current[index].indent = targetIndent;
      setActiveMenu(current);
    } else if (targetIndent > 2) {
      alert("Hệ thống chỉ hỗ trợ tối đa 3 cấp menu phân tầng (0, 1, 2).");
    } else {
      alert("Không thể thụt lề sâu hơn mục phía trên quá 1 cấp.");
    }
  };

  // Giảm thụt lề (Arrow Left) -> Tối thiểu 0
  const handleOutdent = (index: number) => {
    const current = [...getActiveMenu()];
    if (current[index].indent > 0) {
      current[index].indent = current[index].indent - 1;
      setActiveMenu(current);
    }
  };

  const handleUpdateItemDetail = (id: string, fields: Partial<MenuItem>) => {
    const updated = getActiveMenu().map(item => {
      if (item.id === id) {
        return { ...item, ...fields };
      }
      return item;
    });
    setActiveMenu(updated);
  };

  // Xử lý kéo thả chuột (Drag & Drop)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const current = [...getActiveMenu()];
    const draggedItem = current[draggedIndex];

    // Xóa item ở vị trí cũ
    current.splice(draggedIndex, 1);
    // Chèn vào vị trí mới
    current.splice(index, 0, draggedItem);

    // Chuẩn hóa thụt lề sau khi kéo thả để đảm bảo không bị lỗi nhảy thụt lề
    // Ví dụ mục đầu tiên sau khi thả luôn phải có indent = 0
    if (current[0].indent !== 0) {
      current[0].indent = 0;
    }
    for (let i = 1; i < current.length; i++) {
      if (current[i].indent > current[i - 1].indent + 1) {
        current[i].indent = current[i - 1].indent + 1;
      }
    }

    setActiveMenu(current);
    handleDragEnd();
  };

  const handleSaveMenu = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          theme_menu_header: JSON.stringify(headerMenu),
          theme_menu_footer: JSON.stringify(footerMenu)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cấu hình Thanh Menu 3 cấp Kéo Thả thành công!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-semibold animate-pulse text-xs">Đang tải cấu hình thanh menu...</div>
      </div>
    );
  }

  const activeMenuList = getActiveMenu();

  return (
    <div className="max-w-5xl mx-auto font-sans pb-16 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Menu className="text-indigo-600" size={26} /> Quản lý Menu Đa Cấp & Kéo Thả
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Hỗ trợ kéo thả sắp xếp vị trí và điều hướng thụt lề 3 cấp để tạo Mega Menu chia cột tùy chỉnh linh hoạt.
          </p>
        </div>
        <button 
          onClick={handleSaveMenu}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none transition-all text-xs"
        >
          <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 mb-8 gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => {
            setActiveTab('header');
            setNewLabel('');
            setNewUrl('');
            setEditingItemId(null);
          }}
          className={`px-6 py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer border-none ${
            activeTab === 'header' 
              ? 'bg-white text-indigo-600 shadow-sm font-black' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          Menu Header (Đầu trang)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('footer');
            setNewLabel('');
            setNewUrl('');
            setEditingItemId(null);
          }}
          className={`px-6 py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer border-none ${
            activeTab === 'footer' 
              ? 'bg-white text-indigo-600 shadow-sm font-black' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          Menu Footer (Chân trang)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Menu Hierarchy Editor */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                Cấu trúc {activeTab === 'header' ? 'Menu Header' : 'Menu Footer'}
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-md">
                {activeMenuList.length} Mục
              </span>
            </div>

            {activeMenuList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-400 font-semibold text-xs">Thanh menu này chưa có mục nào. Hãy thêm ở bảng bên phải!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeMenuList.map((item, index) => {
                  const isEditing = editingItemId === item.id;
                  const ItemIcon = getIconComponent(item.icon);
                  const isDragged = draggedIndex === index;
                  const isOver = dragOverIndex === index;

                  // Tính toán độ thụt lề
                  const indentWidth = item.indent * 28;

                  return (
                    <div 
                      key={item.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`border rounded-xl transition-all duration-200 ${
                        isDragged ? 'opacity-30 border-dashed border-indigo-400 bg-slate-100' : ''
                      } ${
                        isOver ? 'border-t-4 border-t-indigo-600 bg-indigo-50/20' : ''
                      } ${
                        isEditing 
                          ? 'border-indigo-500 shadow-md shadow-indigo-500/5 bg-indigo-50/5' 
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/5 bg-slate-50/40'
                      }`}
                      style={{ marginLeft: `${indentWidth}px` }}
                    >
                      {/* Main Item Bar */}
                      <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-2.5 w-full min-w-0">
                          {/* Drag handle */}
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0">
                            <GripVertical size={14} />
                          </div>

                          {/* Visual hierarchy tree line prefix */}
                          {item.indent > 0 && (
                            <div className="flex items-center text-indigo-400 font-mono shrink-0 select-none">
                              <span>└─</span>
                              {item.icon && (
                                <ItemIcon size={13} className="text-indigo-500 ml-1.5" />
                              )}
                            </div>
                          )}

                          <div className="truncate">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-800 text-xs truncate">{item.label}</span>
                              {item.indent === 0 && item.isMega && (
                                <span className="bg-indigo-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-md tracking-wider uppercase">Mega</span>
                              )}
                              {item.indent === 0 && !item.isMega && activeMenuList.some((val, idx) => idx > index && val.indent > 0) && (
                                <span className="bg-slate-200 text-slate-600 font-extrabold text-[8px] px-1.5 py-0.5 rounded-md tracking-wider uppercase">Dropdown</span>
                              )}
                              <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                                Cấp {item.indent + 1}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">{item.url}</span>
                            {item.indent > 0 && item.description && (
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5 italic">"{item.description}"</span>
                            )}
                          </div>
                        </div>

                        {/* Controls Panel */}
                        <div className="flex items-center gap-1.5 ml-4 shrink-0">
                          {/* Indent / Outdent buttons */}
                          <button
                            type="button"
                            onClick={() => handleOutdent(index)}
                            disabled={item.indent === 0}
                            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                            title="Thụt ra ngoài (Tăng cấp)"
                          >
                            <ArrowLeft size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIndent(index)}
                            disabled={index === 0 || item.indent >= 2}
                            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                            title="Thụt vào trong (Giảm cấp)"
                          >
                            <ArrowRight size={13} />
                          </button>

                          {/* Reordering manual buttons */}
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                            title="Di chuyển lên"
                          >
                            <ChevronUp size={13} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === activeMenuList.length - 1}
                            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                            title="Di chuyển xuống"
                          >
                            <ChevronDown size={13} />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => setEditingItemId(isEditing ? null : item.id)}
                            className={`p-1 rounded border cursor-pointer flex items-center justify-center ${
                              isEditing 
                                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                            title="Cấu hình chi tiết"
                          >
                            <Settings size={13} />
                          </button>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer flex items-center justify-center"
                            title="Xóa mục"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Edit Details Form */}
                      {isEditing && (
                        <div className="border-t border-slate-200 bg-white p-4 rounded-b-xl space-y-4 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="font-extrabold text-slate-700">Tùy chỉnh: {item.label}</span>
                            <button 
                              type="button" 
                              onClick={() => setEditingItemId(null)}
                              className="text-slate-400 hover:text-slate-600 border-none bg-none cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1.5">Nhãn hiển thị</label>
                              <input 
                                type="text"
                                value={item.label}
                                onChange={(e) => handleUpdateItemDetail(item.id, { label: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-700 mb-1.5">Đường dẫn liên kết (URL)</label>
                              <input 
                                type="text"
                                value={item.url}
                                onChange={(e) => handleUpdateItemDetail(item.id, { url: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 text-xs bg-white font-mono"
                              />
                            </div>
                          </div>

                          {/* Chỉ bật Mega Menu cho mục cấp 1 */}
                          {item.indent === 0 && (
                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-slate-800 block">Kích hoạt chế độ Mega Menu</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Hiển thị các mục con dưới dạng cột và cháu dưới dạng liên kết trong cột đó.
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={!!item.isMega} 
                                  onChange={(e) => handleUpdateItemDetail(item.id, { isMega: e.target.checked })}
                                  className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          )}

                          {/* Cấu hình biểu tượng và mô tả cho các mục con/cháu (cấp 2 & 3) */}
                          {item.indent > 0 && (
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1.5">Mô tả ngắn (Hiển thị ở cột menu)</label>
                                <input 
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => handleUpdateItemDetail(item.id, { description: e.target.value })}
                                  placeholder="Ví dụ: Mua sắm Taobao, Yahoo Japan..."
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 text-xs bg-white"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-2">Biểu tượng (Icon)</label>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                  {iconList.map((ic) => {
                                    const SelectedIcon = ic.component;
                                    const isSelected = item.icon === ic.name;

                                    return (
                                      <button
                                        key={ic.name}
                                        type="button"
                                        onClick={() => handleUpdateItemDetail(item.id, { icon: ic.name })}
                                        className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/30'
                                        }`}
                                        title={ic.label}
                                      >
                                        <SelectedIcon size={16} />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
 
        {/* Right column: Add Item & Quick Select Links */}
        <div className="space-y-6">
          
          {/* Form Add Menu Item */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-indigo-500" />
              Thêm mục menu mới
            </h2>

            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nhãn hiển thị (Label)</label>
                <input 
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ví dụ: Châu Á, Trung Quốc"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Liên kết URL (Path)</label>
                <input 
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Ví dụ: /mua-ho, /ship-ho"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm active:translate-y-0.5"
              >
                <Plus size={14} /> Thêm vào menu
              </button>
            </form>
          </section>

          {/* Quick Links Suggestions */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3.5">
            <h2 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2 mb-0">
              <Link2 size={18} className="text-indigo-500" />
              Liên kết nhanh
            </h2>

            {/* 1. Real-time Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm trang, bài viết, chuyên mục..."
                value={linkSearchQuery}
                onChange={(e) => setLinkSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700 h-8"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* 2. Micro Tabs */}
            <div className="flex border-b border-slate-100 pb-1.5 gap-2 overflow-x-auto text-[10px] font-bold text-slate-400 scrollbar-none">
              <button
                type="button"
                onClick={() => { setSearchTab('quick'); setLinkSearchQuery(''); }}
                className={`pb-1 border-b-2 bg-transparent cursor-pointer transition-all border-none font-extrabold shrink-0 ${
                  searchTab === 'quick' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => { setSearchTab('page'); setLinkSearchQuery(''); }}
                className={`pb-1 border-b-2 bg-transparent cursor-pointer transition-all border-none font-extrabold shrink-0 ${
                  searchTab === 'page' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Trang ({pagesList.length})
              </button>
              <button
                type="button"
                onClick={() => { setSearchTab('post'); setLinkSearchQuery(''); }}
                className={`pb-1 border-b-2 bg-transparent cursor-pointer transition-all border-none font-extrabold shrink-0 ${
                  searchTab === 'post' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Bài viết ({postsList.length})
              </button>
              <button
                type="button"
                onClick={() => { setSearchTab('category'); setLinkSearchQuery(''); }}
                className={`pb-1 border-b-2 bg-transparent cursor-pointer transition-all border-none font-extrabold shrink-0 ${
                  searchTab === 'category' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                Chuyên mục ({categoriesList.length})
              </button>
            </div>

            <p className="text-[10.5px] text-slate-400 font-medium leading-normal mt-0">
              Bấm chữ để điền nhanh form. Bấm nút <kbd className="bg-slate-100 border rounded px-1 font-bold text-slate-600">+</kbd> để thêm thẳng vào menu:
            </p>

            {/* 3. Filtered Items List */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {getActiveItems().map((link, idx) => (
                <div
                  key={idx}
                  className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/50 flex justify-between items-center text-[11px] transition-all"
                >
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(link.label, link.url)}
                    className="flex-1 text-left border-none bg-transparent cursor-pointer font-bold truncate flex flex-col justify-center min-w-0"
                    title="Bấm để điền thông tin vào biểu mẫu trên"
                  >
                    <span className="truncate text-slate-700 font-extrabold">{link.label}</span>
                    <span className="text-[9px] font-mono text-slate-400 font-normal block truncate mt-0.5">{link.url}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAddQuickLinkDirectly(link.label, link.url)}
                    className="ml-2 p-1.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 cursor-pointer flex items-center justify-center shrink-0 transition-all active:scale-95"
                    title="Thêm thẳng vào menu (1-click)"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              ))}
              {getActiveItems().length === 0 && (
                <div className="text-center py-8 text-slate-400 font-semibold text-[10px]">
                  Không tìm thấy liên kết phù hợp.
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
