"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { ArrowLeft, Save, Settings, Image as ImageIcon, X, Eye, Sparkles } from 'lucide-react';
import MediaModal from '@/components/MediaModal';
import RichTextEditor from '@/components/RichTextEditor';
import SeoMetaBox from '@/components/SeoMetaBox';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useSeoAnalyzer } from '@/hooks/useSeoAnalyzer';
import { useRouter } from 'next/navigation';

const generateSlug = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

interface ParentOption {
  id: number;
  title: string;
}

export default function CreatePageEditor() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [hasManualSlug, setHasManualSlug] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  
  const router = useRouter();
  
  // GrapesJS states
  const [grapesjsData, setGrapesjsData] = useState('');
  
  // Page Layout & Content Width
  const [pageLayout, setPageLayout] = useState<'THEME_DEFAULT' | 'FULL_WIDTH' | 'CANVAS'>('THEME_DEFAULT');
  const [contentWidthSetting, setContentWidthSetting] = useState<'BOXED' | 'FULL_WIDTH' | 'CUSTOM'>('BOXED');
  const [contentMaxWidth, setContentMaxWidth] = useState('1200px');
  
  // Page Status
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('draft');


  
  // Parent Page State
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  
  // Publish states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Auto Save states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Publish configuration states
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [publishedAt, setPublishedAt] = useState<string>(new Date().toISOString());
  
  // SEO Plugin states
  const [isSeoPluginEnabled, setIsSeoPluginEnabled] = useState(true);
  const [isGrapesjsEnabled, setIsGrapesjsEnabled] = useState(true);
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');

  const [activeSeoTab, setActiveSeoTab] = useState<'seo' | 'readability' | 'preview'>('seo');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');

  // Premium SEO and Readability content analysis
  const { seoScore, readabilityScore, seoChecks, readabilityChecks } = useSeoAnalyzer({
    title,
    content,
    seoTitle,
    seoDescription,
    seoKeywords,
    slug
  });

  // Load parent options and settings on mount
  useEffect(() => {
    async function loadParentsAndSettings() {
      try {
        // Load parent pages list
        const pageRes = await fetch('/api/posts?type=PAGE');
        const pageData = await pageRes.json();
        if (pageData.success) {
          setParentOptions(pageData.posts || []);
        }

        // Load settings
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setIsSeoPluginEnabled(data.settings.plugin_seo_enabled !== 'false');
          setIsGrapesjsEnabled((data.settings.plugin_lexi_page_builder_enabled ?? data.settings.plugin_grapesjs_enabled) !== 'false');
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    }
    loadParentsAndSettings();
  }, []);

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageId, setFeaturedImageId] = useState<number | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Unsaved changes alert
  useNavigationGuard(hasUnsavedChanges);

  // Auto Save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim()) return;

    const timer = setTimeout(() => {
      autoSaveToServer();
    }, 4000); // Trigger auto save after 4 seconds of idle

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, title, slug, content, parentId, featuredImageId, visibility, publishedAt, seoTitle, seoDescription, seoKeywords, grapesjsData]);

  const autoSaveToServer = async () => {
    if (isAutoSaving) return;
    setIsAutoSaving(true);
    
    try {
      const payload = {
        id: postId || undefined,
        title: title || '(Không có tiêu đề)',
        slug: slug || generateSlug(title),
        content,
        status: 'DRAFT',
        type: 'PAGE',
        parentId: parentId || null,
        featuredImageId,
        visibility,
        publishedAt,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        seoKeywords: seoKeywords || undefined,
        builderData: grapesjsData || undefined,
        pageLayout,
        contentWidth: contentWidthSetting,
        contentMaxWidth,
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success && data.post) {
        setPostId(data.post.id);
        setHasSaved(true);
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      }
    } catch (err) {
      console.error('Auto save failed:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setHasUnsavedChanges(true);
    if (!hasManualSlug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setHasUnsavedChanges(true);
    setHasManualSlug(true);
  };

  const handleSelectFeaturedImage = (image: { id: number; url: string }) => {
    setFeaturedImage(image.url);
    setFeaturedImageId(image.id);
    setHasUnsavedChanges(true);
    setIsMediaModalOpen(false);
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageId(null);
    setHasUnsavedChanges(true);
  };

  const savePost = async (isPublish: boolean) => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề trang!');
      return;
    }

    if (isPublish) setIsPublishing(true);
    else setIsSavingDraft(true);

    const currentSlug = slug.trim() || generateSlug(title);

    try {
      const payload = {
        id: postId || undefined,
        title,
        slug: currentSlug,
        content,
        status: isPublish ? 'PUBLISHED' : 'DRAFT',
        type: 'PAGE',
        parentId: parentId || null,
        featuredImageId,
        visibility,
        publishedAt,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        seoKeywords: seoKeywords || undefined,
        builderData: grapesjsData || undefined,
        pageLayout,
        contentWidth: contentWidthSetting,
        contentMaxWidth,
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        setPostId(data.post.id);
        setSlug(data.post.slug);
        setHasSaved(true);
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        setPostStatus(isPublish ? 'published' : 'draft');
        alert(isPublish ? 'Đã xuất bản trang thành công!' : 'Đã lưu bản nháp thành công!');
        window.location.href = `/admin/pages/edit/${data.post.id}`;
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsPublishing(false);
      setIsSavingDraft(false);
    }
  };

  const badge = (() => {
    if (postStatus === 'published') {
      if (new Date(publishedAt) > new Date()) {
        return { text: 'Hẹn giờ', classes: 'bg-blue-50 text-brand-600 border border-brand-200/55' };
      }
      return { text: 'Đã xuất bản', classes: 'bg-emerald-50 text-emerald-600 border border-emerald-200/55' };
    }
    return { text: 'Bản nháp', classes: 'bg-slate-50 text-slate-500 border border-slate-200/55' };
  })();

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <CapabilityGuard capability="edit_pages">
      <div className="max-w-6xl mx-auto font-sans">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/pages" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Thêm Trang Mới</h1>
          <p className="text-xs text-slate-400 font-medium">Tạo trang tĩnh mới cho website</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tiêu đề trang</label>
              <input 
                type="text" 
                placeholder="Nhập tiêu đề trang tĩnh (ví dụ: Giới thiệu)..."
                value={title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Đường dẫn tĩnh (Slug)</label>
              <input 
                type="text" 
                placeholder="duong-dan-tinh"
                value={slug}
                onChange={handleSlugChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-brand-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Nội dung trang</label>
                {isGrapesjsEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!postId) {
                        alert("Vui lòng Lưu Nháp trang ít nhất 1 lần trước khi mở Page Builder!");
                        return;
                      }
                      window.location.href = `/admin/pages/builder/${postId}`;
                    }}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Sparkles size={12} /> Thiết kế trực quan bằng Page Builder
                  </button>
                )}
              </div>
              <RichTextEditor
                content={content}
                setContent={setContent}
                setHasUnsavedChanges={setHasUnsavedChanges}
                className="h-[400px]"
              />
            </div>
          </div>

          {/* Premium SEO Meta Box */}
          <SeoMetaBox
            isSeoPluginEnabled={isSeoPluginEnabled}
            seoScore={seoScore}
            readabilityScore={readabilityScore}
            seoChecks={seoChecks}
            readabilityChecks={readabilityChecks}
            seoKeywords={seoKeywords}
            setSeoKeywords={setSeoKeywords}
            seoTitle={seoTitle}
            setSeoTitle={setSeoTitle}
            title={title}
            seoDescription={seoDescription}
            setSeoDescription={setSeoDescription}
            slug={slug}
          />
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Action Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold mb-4 border-b border-slate-100 pb-2 text-slate-800">
              Đăng Trang Tĩnh
            </h3>
            
            <div className="flex gap-2.5 mb-4">
              <button 
                onClick={() => savePost(false)}
                disabled={isSavingDraft || isPublishing}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-2 px-3 border border-slate-200 hover:border-slate-300 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer text-center disabled:opacity-50"
              >
                {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              <button 
                onClick={() => {
                  if (postId) {
                    window.open(`/${slug}`, '_blank');
                  } else {
                    alert('Vui lòng lưu nháp trước khi xem!');
                  }
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-brand-600 font-semibold py-2 px-3 border border-brand-200 hover:border-brand-300 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                Xem trước
              </button>
            </div>

            {/* Auto-Save Notification */}
            {(lastSavedAt || isAutoSaving) && (
              <div className="text-[10px] text-slate-400 mb-4 px-1 animate-fade-up font-medium">
                {isAutoSaving ? 'Đang tự động lưu...' : `Đã lưu tạm: ${lastSavedAt?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
              </div>
            )}

            <div className="space-y-3.5 text-slate-600 mb-5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span>Trạng thái:</span>
                <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] ${badge.classes}`}>
                  {badge.text}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Hiển thị:</span>
                <select
                  value={visibility}
                  onChange={(e) => {
                    setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE');
                    setHasUnsavedChanges(true);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/10 transition-all w-[100px]"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>
              <div className="flex justify-between items-center gap-1">
                <span>Thời gian:</span>
                <input 
                  type="datetime-local" 
                  value={publishedAt.substring(0, 16)} 
                  onChange={(e) => {
                    setPublishedAt(new Date(e.target.value).toISOString());
                    setHasUnsavedChanges(true);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/10 transition-all text-[11px] w-[140px]"
                />
              </div>
            </div>

            <button 
              onClick={() => savePost(true)}
              disabled={isSavingDraft || isPublishing}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-brand-500/25 hover:shadow-lg disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              <Save size={15} />
              {isPublishing ? 'Đang xuất bản...' : postStatus === 'published' ? 'Cập nhật' : 'Xuất bản'}
            </button>
          </div>

          {/* Hierarchy Option (Parent Page) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 text-slate-800">
              Thuộc tính Trang
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trang cha</label>
              <select
                value={parentId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setParentId(val ? Number(val) : null);
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all font-semibold text-slate-700"
              >
                <option value="">(Không có trang cha - Cấp cao nhất)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Giúp cấu hình phân cấp đường dẫn cho Website (ví dụ: Dịch vụ &gt; Vận chuyển Trung Quốc).</p>
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 text-slate-800">
              Ảnh đại diện
            </h3>
            
            {featuredImage ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                <img 
                  src={featuredImage} 
                  alt="Ảnh đại diện trang" 
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setIsMediaModalOpen(true)}
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-md font-semibold text-[10px] transition-colors cursor-pointer"
                  >
                    Thay đổi
                  </button>
                  <button 
                    onClick={handleRemoveFeaturedImage}
                    className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-md font-semibold text-[10px] transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsMediaModalOpen(true)}
                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-lg hover:border-brand-500 hover:bg-slate-50/50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-500 transition-all cursor-pointer outline-none"
              >
                <ImageIcon size={22} className="opacity-70" />
                <span className="text-[11px] font-bold">Đặt ảnh đại diện</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Media Library Dialog */}
      <MediaModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleSelectFeaturedImage}
      />

    </div>
    </CapabilityGuard>
  );
}
