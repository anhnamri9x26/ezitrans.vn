"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWidget } from './SortableWidget';
import { useTranslation } from "@/lib/i18n/AdminI18nProvider";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Settings, Image as ImageIcon, X, ExternalLink, Eye, Sparkles, History } from 'lucide-react';
import { generatePostUrl } from '@/lib/permalink';
import MediaModal from '@/components/MediaModal';
import RevisionsModal from '@/components/RevisionsModal';
import RichTextEditor from '@/components/RichTextEditor';
import SeoMetaBox from '@/components/SeoMetaBox';
import GrapesEditor from '@/components/GrapesEditor';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useRevisions } from '@/hooks/useRevisions';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useSeoAnalyzer } from '@/hooks/useSeoAnalyzer';

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

interface PostEditorCoreProps {
  postType: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
  editId?: number;
  backUrl: string;
  backLabel: string;
  createTitle: string;
  editTitle: string;
  showCategories?: boolean;
  showTags?: boolean;
  showParent?: boolean;
  customPanels?: {
    main?: React.ReactNode;
    mainWidgets?: Array<{ id: string; title: string; content: React.ReactNode }>;
  };
  customWidgets?: Array<{ id: string; title: string; content: React.ReactNode }>;
  customData?: any;
}

export default function PostEditorCore({
  postType,
  editId,
  backUrl,
  backLabel,
  createTitle,
  editTitle,
  showCategories = true,
  showTags = true,
  showParent = false,
  customPanels,
  customWidgets,
  customData,
}: PostEditorCoreProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
  const [mainWidgetOrder, setMainWidgetOrder] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const defaultWidgetIds = ['publish'];
    if (customWidgets) {
      customWidgets.forEach(w => defaultWidgetIds.push(w.id));
    }
    if (showCategories) defaultWidgetIds.push('categories');
    if (showTags) defaultWidgetIds.push('tags');
    defaultWidgetIds.push('featured-image');

    const savedOrder = localStorage.getItem(`editor_widget_order_${postType}`);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const validOrder = parsed.filter((id: string) => defaultWidgetIds.includes(id));
        const missing = defaultWidgetIds.filter((id: string) => !validOrder.includes(id));
        setWidgetOrder([...validOrder, ...missing]);
      } catch (e) {
        setWidgetOrder(defaultWidgetIds);
      }
    } else {
      setWidgetOrder(defaultWidgetIds);
    }
  }, [postType, showCategories, showTags, customWidgets?.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(`editor_widget_order_${postType}`, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  useEffect(() => {
    const defaultMainWidgetIds = ['seo'];
    if (customPanels?.mainWidgets?.length) {
      customPanels.mainWidgets.forEach((widget) => defaultMainWidgetIds.push(widget.id));
    } else if (customPanels?.main) {
      defaultMainWidgetIds.push('custom-main');
    }

    const savedOrder = localStorage.getItem(`editor_main_widget_order_${postType}`);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const validOrder = parsed.filter((id: string) => defaultMainWidgetIds.includes(id));
        const missing = defaultMainWidgetIds.filter((id: string) => !validOrder.includes(id));
        setMainWidgetOrder([...validOrder, ...missing]);
      } catch (e) {
        setMainWidgetOrder(defaultMainWidgetIds);
      }
    } else {
      setMainWidgetOrder(defaultMainWidgetIds);
    }
  }, [postType, Boolean(customPanels?.main), customPanels?.mainWidgets?.length]);

  const handleMainDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMainWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(`editor_main_widget_order_${postType}`, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const router = useRouter();
  const [postId, setPostId] = useState<number | null>(editId || null);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [hasManualSlug, setHasManualSlug] = useState(!!editId);
  const [hasSaved, setHasSaved] = useState(!!editId);
  const [content, setContent] = useState('');
  
  // GrapesJS states
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);
  const [grapesjsData, setGrapesjsData] = useState('');
  const [isGrapesjsEnabled, setIsGrapesjsEnabled] = useState(true);
  
  // Post Status
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('draft');

  // Publish states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Auto Save states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autosaveToRestore, setAutosaveToRestore] = useState<any>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Publish configuration states
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [publishedAt, setPublishedAt] = useState<string>(new Date().toISOString());

  const {
    categories,
    setCategories,
    showCategoryInput,
    setShowCategoryInput,
    newCategoryName,
    setNewCategoryName,
    newCategoryParentId,
    setNewCategoryParentId,
    activeCategoryTab,
    setActiveCategoryTab,
    loadCategories,
    handleAddCategory,
    toggleCategory,
    getHierarchicalCategoriesWithDepth
  } = useCategories({ type: postType, setHasUnsavedChanges });

  const {
    tagInput,
    setTagInput,
    tags,
    setTags,
    tagSuggestions,
    activeSuggestionIdx,
    setActiveSuggestionIdx,
    loadAllTags,
    handleAddTags,
    handleSelectSuggestion,
    handleRemoveTag
  } = useTags({ type: postType, setHasUnsavedChanges });

  // Revisions hooks
  const {
    revisionsCount,
    isRevisionsModalOpen,
    setIsRevisionsModalOpen,
    fetchRevisionsCount,
    handleRestoreRevision,
  } = useRevisions({
    postId,
    setTitle,
    setContent,
    setSlug,
    setHasUnsavedChanges,
  });

  // SEO Plugin states
  const [isSeoPluginEnabled, setIsSeoPluginEnabled] = useState(true);
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');
  const [permalinkProductBase, setPermalinkProductBase] = useState('/san-pham/');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');

  // Premium SEO and Readability content analysis
  const { seoScore, readabilityScore, seoChecks, readabilityChecks } = useSeoAnalyzer({
    title,
    content,
    seoTitle,
    seoDescription,
    seoKeywords,
    slug
  });

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [featuredImageId, setFeaturedImageId] = useState<number | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Load post details, settings, categories, and tags on mount/id change
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setIsSeoPluginEnabled(data.settings.plugin_seo_enabled !== 'false');
          setIsGrapesjsEnabled((data.settings.plugin_lexi_page_builder_enabled ?? data.settings.plugin_grapesjs_enabled) !== 'false');
          if (data.settings.permalink_structure) {
            setPermalinkStructure(data.settings.permalink_structure);
          }
          if (data.settings.permalink_product_base) {
            setPermalinkProductBase(data.settings.permalink_product_base);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    const loadPostAndCategories = async () => {
      try {
        setIsLoading(true);
        const [categoriesRes, postRes] = await Promise.all([
          fetch(`/api/categories?type=${postType}`),
          fetch(`/api/posts/${postId}`)
        ]);

        const categoriesData = await categoriesRes.json();
        const postData = await postRes.json();

        if (postData.success && postData.post) {
          const post = postData.post;
          setTitle(post.title || '');
          setSlug(post.slug || '');
          setHasManualSlug(true);
          setContent(post.content || '');
          setGrapesjsData(post.builderData || '');
          setPostStatus(post.status === 'PUBLISHED' ? 'published' : 'draft');
          setVisibility(post.visibility || 'PUBLIC');
          setPublishedAt(post.publishedAt || '');

          if (post.featuredImage) {
            setFeaturedImage(post.featuredImage.url);
            setFeaturedImageId(post.featuredImage.id);
          }

          setSeoTitle(post.seoTitle || '');
          setSeoDescription(post.seoDescription || '');
          setSeoKeywords(post.seoKeywords || '');

          const selectedCategoryIds = (post.categories || []).map((c: any) => c.id);
          const mappedCats = (categoriesData.categories || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
            checked: selectedCategoryIds.includes(c.id)
          }));
          setCategories(mappedCats);

          if (post.tags) {
            setTags(post.tags.map((t: any) => t.name));
          }

          if (post.builderData) {
            setIsGrapesjsEnabled(true);
          }

          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('editor') === 'grapesjs' || searchParams.get('builder') === 'true' || searchParams.get('visual') === 'true') {
            setIsVisualEditorOpen(true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi load bài viết:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    if (postId) {
      loadPostAndCategories();
      loadAllTags();
    } else {
      loadCategories();
      loadAllTags();
    }
  }, [postId, loadCategories, loadAllTags]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    
    if (!hasManualSlug && !hasSaved && !postId) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    setHasUnsavedChanges(true);
    const cleanSlug = newSlug.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    setSlug(cleanSlug);
    
    if (cleanSlug.trim() !== '') {
      setHasManualSlug(true);
    } else {
      setHasManualSlug(false);
      if (!hasSaved && !postId) {
        setSlug(generateSlug(title));
      }
    }
  };

  // Check for autosave on mount
  useEffect(() => {
    async function checkAutosave() {
      try {
        const url = postId ? `/api/autosave?postId=${postId}` : '/api/autosave';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.hasAutosave && data.autosave) {
          setAutosaveToRestore(data.autosave);
        }
      } catch (e) {
        console.error('Error fetching autosave', e);
      }
    }
    checkAutosave();
  }, [postId]);

  const handleRestoreDraft = () => {
    if (!autosaveToRestore) return;
    if (autosaveToRestore.title) setTitle(autosaveToRestore.title);
    if (autosaveToRestore.slug) setSlug(autosaveToRestore.slug);
    if (autosaveToRestore.content) setContent(autosaveToRestore.content);
    if (autosaveToRestore.visibility) setVisibility(autosaveToRestore.visibility as 'PUBLIC' | 'PRIVATE');
    if (autosaveToRestore.publishedAt) setPublishedAt(autosaveToRestore.publishedAt);
    if (autosaveToRestore.builderData) setGrapesjsData(autosaveToRestore.builderData);
    setHasUnsavedChanges(true);
    setAutosaveToRestore(null);
  };

  const handleDiscardDraft = async () => {
    setAutosaveToRestore(null);
    try {
      const url = postId ? `/api/autosave?postId=${postId}` : '/api/autosave';
      await fetch(url, { method: 'DELETE' });
    } catch(e) {
      console.error(e);
    }
  };

  useNavigationGuard(hasUnsavedChanges);

  // Auto-save logic
  useEffect(() => {
    if (!hasUnsavedChanges || isPublishing || isSavingDraft) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const payload = {
          postId: postId || undefined,
          title,
          slug,
          content,
          visibility,
          publishedAt,
          savedAt: new Date().toISOString()
        };
        await fetch('/api/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, builderData: grapesjsData, htmlContent: content || '<div></div>' })
        });
        setLastSavedAt(new Date());
        setHasSaved(true);
      } catch (error) {
        console.error("Local auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 4000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, slug, visibility, publishedAt, hasUnsavedChanges, isPublishing, isSavingDraft, grapesjsData, postId]);

  const simulateAction = async (actionType: 'publish' | 'draft') => {
    const isPublish = actionType === 'publish';
    if (isPublish) setIsPublishing(true);
    else setIsSavingDraft(true);

    try {
      const currentSlug = slug.trim() === '' ? generateSlug(title) : slug;
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          title: title || '(Không có tiêu đề)',
          slug: currentSlug,
          content,
          status: isPublish ? 'published' : 'draft',
          featuredImageId,
          visibility,
          publishedAt,
          categoryIds: showCategories ? categories.filter(c => c.checked).map(c => c.id) : [],
          tags: showTags ? tags : [],
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          seoKeywords: seoKeywords || undefined,
          builderData: grapesjsData || undefined,
          type: postType,
          ...(customData || {})
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSlug(data.post.slug);
        setPostId(data.post.id);
        setPostStatus(isPublish ? 'published' : 'draft');
        setHasSaved(true);
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        const deleteUrl = `/api/autosave?postId=${data.post.id}`;
        fetch(deleteUrl, { method: 'DELETE' }).catch(() => {});
        alert(`Đã ${isPublish ? 'xuất bản' : 'lưu bản nháp'} thành công! (Slug: /${data.post.slug})`);
        
        // Redirect dynamically
        const editRoute = postType === 'PAGE'
          ? `/admin/pages/edit/${data.post.id}`
          : postType === 'PRODUCT'
            ? `/admin/products/edit/${data.post.id}`
            : `/admin/posts/edit/${data.post.id}`;
            
        if (!editId) {
          router.push(editRoute);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } else {
        alert('Có lỗi xảy ra: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      if (isPublish) setIsPublishing(false);
      else setIsSavingDraft(false);
    }
  };

  const handlePreview = async () => {
    let currentPostId = postId;
    let currentSlug = slug;
    
    if (!currentPostId) {
      setIsSavingDraft(true);
      try {
        const generatedSlug = slug.trim() === '' ? generateSlug(title) : slug;
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || '(Không có tiêu đề)',
            slug: generatedSlug,
            content,
            status: 'draft',
            featuredImageId,
            visibility,
            publishedAt,
            categoryIds: showCategories ? categories.filter(c => c.checked).map(c => c.id) : [],
            tags: showTags ? tags : [],
            seoTitle: seoTitle || undefined,
            seoDescription: seoDescription || undefined,
            seoKeywords: seoKeywords || undefined,
            builderData: grapesjsData || undefined,
            type: postType,
            ...(customData || {})
          })
        });
        const data = await response.json();
        if (data.success) {
          currentPostId = data.post.id;
          currentSlug = data.post.slug;
          setPostId(data.post.id);
          setSlug(data.post.slug);
          setPostStatus('draft');
          setHasSaved(true);
          setHasUnsavedChanges(false);
          setLastSavedAt(new Date());
          fetch(`/api/autosave?postId=${data.post.id}`, { method: 'DELETE' }).catch(() => {});
        } else {
          alert('Không thể tự động lưu nháp để xem trước: ' + data.error);
          return;
        }
      } catch (error) {
        alert('Lỗi kết nối máy chủ khi lưu nháp!');
        console.error(error);
        return;
      } finally {
        setIsSavingDraft(false);
      }
    }
    
    const previewUrl = generatePostUrl({
      id: postId || 0,
      slug: slug || generateSlug(title),
      createdAt: new Date(),
      legacyId: null,
      type: postType
    }, permalinkStructure, permalinkProductBase);
    window.open(previewUrl, '_blank');
  };

  const handleMoveToTrash = async () => {
    if (!confirm('Bạn có chắc chắn muốn chuyển mục này vào thùng rác? Bạn có thể khôi phục lại từ Thùng rác.')) {
      return;
    }
    if (postId) {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          alert('Đã chuyển vào thùng rác!');
          window.location.href = backUrl;
        } else {
          alert(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        alert('Lỗi kết nối máy chủ!');
        console.error(error);
      }
    } else {
      window.location.href = backUrl;
    }
  };

  const selectFeaturedImage = () => {
    setIsMediaModalOpen(true);
  };

  const removeFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImageId(null);
    setHasUnsavedChanges(true);
  };

  const formatDatetimeLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const tzoffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
  };

  const getStatusBadge = () => {
    if (postStatus !== 'published') {
      return {
        text: 'Bản nháp',
        classes: 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800/55'
      };
    }
    const isFuture = publishedAt ? new Date(publishedAt) > new Date() : false;
    if (isFuture) {
      return {
        text: 'Hẹn giờ',
        classes: 'bg-blue-50 text-brand-600 border border-brand-200/55'
      };
    }
    return {
      text: 'Đã xuất bản',
      classes: 'bg-emerald-50 text-emerald-600 border border-emerald-200/55'
    };
  };
  const badge = getStatusBadge();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={backUrl} className="text-slate-500 hover:text-brand-600 transition-colors bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:border-brand-200">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {editId ? editTitle : createTitle}
            </h1>
            {editId && revisionsCount > 0 && (
              <button
                onClick={() => setIsRevisionsModalOpen(true)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200 dark:border-slate-800"
              >
                <History size={12} /> Lịch sử bản nháp ({revisionsCount})
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {autosaveToRestore && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between text-sm shadow-sm">
              <span className="text-amber-800">
                Có một bản nháp chưa lưu lúc {new Date(autosaveToRestore.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}.
              </span>
              <div className="flex gap-2">
                <button onClick={handleRestoreDraft} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer">Khôi phục</button>
                <button onClick={handleDiscardDraft} className="bg-white dark:bg-slate-900 hover:bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer">Bỏ qua</button>
              </div>
            </div>
          )}
          {/* Title Input */}
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder={`Thêm tiêu đề ${backLabel.toLowerCase()}`}
              value={title}
              onChange={handleTitleChange}
              className="w-full text-xl font-semibold px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all shadow-sm"
            />
            {/* Slug display/editor */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[12px] px-2 text-slate-500">
              <span className="font-semibold text-slate-600 shrink-0">{t("Đường dẫn:")}</span>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-slate-400 select-none">
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                </span>
                {postType === 'PRODUCT' ? (
                  <>
                    <span className="text-slate-400 select-none">
                      {permalinkProductBase}
                    </span>
                    <input 
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 rounded px-1.5 py-0.5 text-xs outline-none text-brand-600 font-semibold transition-all min-w-[120px]"
                      placeholder="slug"
                    />
                  </>
                ) : permalinkStructure.includes('%postname%') ? (
                  <>
                    <span className="text-slate-400 select-none">
                      {permalinkStructure.split('%postname%')[0]}
                    </span>
                    <input 
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 rounded px-1.5 py-0.5 text-xs outline-none text-brand-600 font-semibold transition-all min-w-[120px]"
                      placeholder="slug"
                    />
                    <span className="text-slate-400 select-none">
                      {permalinkStructure.split('%postname%')[1] || ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 select-none">
                      {generatePostUrl({
                        id: postId || 0,
                        slug: slug || generateSlug(title),
                        createdAt: new Date(),
                        legacyId: null,
                        type: postType
                      }, permalinkStructure, permalinkProductBase)}
                    </span>
                    <span className="text-slate-400 select-none">|</span>
                    <span className="font-semibold text-slate-600 shrink-0">Slug:</span>
                    <input 
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brand-500 rounded px-1.5 py-0.5 text-xs outline-none text-brand-600 font-semibold transition-all min-w-[120px]"
                      placeholder="slug"
                    />
                  </>
                )}
                {postId && (
                  <a 
                    href={generatePostUrl({
                      id: postId || 0,
                      slug: slug || generateSlug(title),
                      createdAt: new Date(),
                      legacyId: null,
                      type: postType
                    }, permalinkStructure, permalinkProductBase)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    Xem <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Rich Text Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Nội dung</label>
              {isGrapesjsEnabled && (
                <button
                  type="button"
                  onClick={() => setIsVisualEditorOpen(true)}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Sparkles size={12} /> Thiết kế trực quan bằng GrapesJS
                </button>
              )}
            </div>
            <RichTextEditor
              content={content}
              setContent={setContent}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          </div>

          {/* Main Editor Widgets: SEO + Custom Main Panels */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
            <SortableContext items={mainWidgetOrder} strategy={verticalListSortingStrategy}>
              {mainWidgetOrder.map((widgetId) => {
                if (widgetId === 'seo') {
                  return (
                    <SortableWidget key="seo" id="seo" title="Tối ưu SEO & Readability (Yoast Premium)">
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
                    </SortableWidget>
                  );
                }

                const customMainWidget = customPanels?.mainWidgets?.find((widget) => widget.id === widgetId);
                if (customMainWidget) {
                  return (
                    <SortableWidget key={customMainWidget.id} id={customMainWidget.id} title={customMainWidget.title}>
                      {customMainWidget.content}
                    </SortableWidget>
                  );
                }

                if (widgetId === 'custom-main' && customPanels?.main) {
                  return (
                    <SortableWidget key="custom-main" id="custom-main" title={postType === 'PRODUCT' ? 'Thông tin sản phẩm' : 'Thông tin bổ sung'}>
                      {customPanels.main}
                    </SortableWidget>
                  );
                }

                return null;
              })}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 space-y-4 text-[13px]">

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            {widgetOrder.map(widgetId => {
              
              if (widgetId === 'publish') {
                return (
                  <SortableWidget key="publish" id="publish" title={t("Xuất bản")}>
                    {/* Top Actions Row: Save Draft & Preview */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                      <button 
                        onClick={() => simulateAction('draft')}
                        disabled={isSavingDraft || isPublishing || isAutoSaving}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
                      >
                        {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                      </button>
                      <button 
                        onClick={handlePreview}
                        className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 text-brand-600 font-semibold py-2 px-3 border border-brand-200 hover:border-brand-300 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
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

                    {/* Metadata Rows */}
                    <div className="space-y-3.5 text-slate-600 mb-5">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{t("Trạng thái:")}</span>
                        <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{t("Hiển thị:")}</span>
                        <select
                          value={visibility}
                          onChange={(e) => {
                            setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE');
                            setHasUnsavedChanges(true);
                          }}
                          className="font-medium text-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800/80 rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-[100px]"
                        >
                          <option value="PUBLIC">Công khai</option>
                          <option value="PRIVATE">Riêng tư</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <span className="font-medium">{t("Đăng lúc:")}</span>
                        <input
                          type="datetime-local"
                          value={formatDatetimeLocal(publishedAt)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              setPublishedAt(new Date(val).toISOString());
                              setHasUnsavedChanges(true);
                            }
                          }}
                          className="font-medium text-[11px] bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800/80 rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Bottom Actions Row: Delete & Publish */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={handleMoveToTrash}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Bỏ vào thùng rác
                      </button>
                      <button 
                        onClick={() => simulateAction('publish')}
                        disabled={isPublishing || isSavingDraft || isAutoSaving}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all hover:shadow-brand-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer"
                      >
                        <Save size={14} /> {isPublishing ? 'Đang xử lý...' : (postStatus === 'published' ? 'Cập nhật' : 'Xuất bản')}
                      </button>
                    </div>
                  </SortableWidget>
                );
              }

              if (widgetId === 'categories' && showCategories) {
                return (
                  <SortableWidget key="categories" id="categories" title={postType === 'PRODUCT' ? 'Danh mục sản phẩm' : 'Danh mục'}>
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab('all')}
                        className={`py-1.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${activeCategoryTab === 'all' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200'}`}
                      >
                        Tất cả danh mục
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab('most-used')}
                        className={`py-1.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${activeCategoryTab === 'most-used' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200'}`}
                      >
                        Dùng nhiều nhất
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1 mb-2">
                      {categories.length > 0 ? (
                        (activeCategoryTab === 'all' 
                          ? getHierarchicalCategoriesWithDepth(categories) 
                          : [...categories].sort((a, b) => a.id - b.id).slice(0, 5)
                        ).map(cat => (
                          <label 
                            key={cat.id} 
                            className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer group"
                            style={{ paddingLeft: activeCategoryTab === 'all' ? `${(cat as any).depth * 14}px` : '0px' }}
                          >
                            <input 
                              type="checkbox" 
                              checked={cat.checked}
                              onChange={() => toggleCategory(cat.id)}
                              className="rounded text-brand-500 focus:ring-brand-500/30 border-slate-300 w-3.5 h-3.5 cursor-pointer" 
                            /> 
                            <span className="group-hover:text-brand-600 transition-colors flex items-center">
                              {activeCategoryTab === 'all' && (cat as any).depth > 0 && <span className="text-slate-300 mr-1">—</span>}
                              {cat.name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Đang tải danh mục...</p>
                      )}
                    </div>
                    
                    {/* Add New Category Toggle */}
                    {!showCategoryInput ? (
                      <button 
                        onClick={() => setShowCategoryInput(true)}
                        className="text-brand-600 font-medium hover:underline flex items-center gap-1 w-full text-left"
                      >
                        + Thêm Danh Mục mới
                      </button>
                    ) : (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-2">
                        <input 
                          type="text" 
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Tên danh mục..." 
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-[12px] focus:outline-none focus:border-brand-500 bg-white dark:bg-slate-900"
                          autoFocus
                        />
                        
                        {/* Parent category dropdown */}
                        <select
                          value={newCategoryParentId}
                          onChange={(e) => setNewCategoryParentId(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-[12px] focus:outline-none focus:border-brand-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        >
                          <option value="">— Danh mục cha —</option>
                          {getHierarchicalCategoriesWithDepth(categories).map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.depth > 0 ? '— '.repeat(cat.depth) : ''}{cat.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <button 
                            onClick={handleAddCategory}
                            className="bg-slate-800 text-white px-3 py-1 rounded text-[11px] font-medium hover:bg-slate-700 transition-colors flex-1"
                          >
                            Thêm mới
                          </button>
                          <button 
                            onClick={() => {
                              setShowCategoryInput(false);
                              setNewCategoryName('');
                              setNewCategoryParentId('');
                            }}
                            className="bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </SortableWidget>
                );
              }

              if (widgetId === 'tags' && showTags) {
                return (
                  <SortableWidget key="tags" id="tags" title={postType === 'PRODUCT' ? 'Thẻ sản phẩm' : 'Thẻ'}>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' && tagSuggestions.length > 0) {
                                e.preventDefault();
                                setActiveSuggestionIdx(prev => (prev + 1) % tagSuggestions.length);
                              } else if (e.key === 'ArrowUp' && tagSuggestions.length > 0) {
                                e.preventDefault();
                                setActiveSuggestionIdx(prev => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (tagSuggestions.length > 0) {
                                  handleSelectSuggestion(tagSuggestions[activeSuggestionIdx]);
                                } else {
                                  handleAddTags();
                                }
                              }
                            }}
                            placeholder="Nhập thẻ..." 
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-[12px] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-sans"
                          />

                          {/* Autocomplete suggestions popup */}
                          {tagSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                              {tagSuggestions.map((suggestion, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectSuggestion(suggestion)}
                                  className={`px-3 py-2 text-[12px] cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900 transition-colors flex items-center justify-between ${
                                    idx === activeSuggestionIdx ? 'bg-indigo-50/70 hover:bg-indigo-50/70 font-semibold' : ''
                                  }`}
                                >
                                  <span>{suggestion}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Dùng lại</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={handleAddTags}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer"
                        >
                          Thêm
                        </button>
                      </div>
                      
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-medium group hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              {tag}
                              <X size={10} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">{t("Chưa có thẻ nào.")}</p>
                      )}
                      <p className="text-[10px] text-slate-400">Gợi ý: Nhập thẻ và ấn phím Enter hoặc phẩy để thêm nhanh.</p>
                    </div>
                  </SortableWidget>
                );
              }

              if (widgetId === 'featured-image') {
                return (
                  <SortableWidget key="featured-image" id="featured-image" title={t("Ảnh đại diện")}>
                    {featuredImage ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm aspect-video">
                        <img src={featuredImage} alt="Featured Image" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                          <button 
                            onClick={() => setIsMediaModalOpen(true)}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            Thay đổi ảnh
                          </button>
                          <button 
                            onClick={removeFeaturedImage}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            Xoá ảnh đại diện
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={selectFeaturedImage}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-colors group"
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full mb-2 group-hover:bg-brand-100 group-hover:text-brand-600 text-slate-400 transition-colors">
                          <ImageIcon size={20} />
                        </div>
                        <p className="font-medium text-slate-600 group-hover:text-brand-600">{t("Đặt ảnh đại diện")}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </SortableWidget>
                );
              }

              // Custom Widgets from plugins
              if (customWidgets) {
                const cw = customWidgets.find(w => w.id === widgetId);
                if (cw) {
                  return (
                    <SortableWidget key={cw.id} id={cw.id} title={cw.title}>
                      {cw.content}
                    </SortableWidget>
                  );
                }
              }

              return null;
            })}
          </SortableContext>
        </DndContext>

      </div>

      <MediaModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(image) => {
          setFeaturedImage(image.url);
          setFeaturedImageId(image.id);
          setHasUnsavedChanges(true);
        }}
        selectedId={featuredImageId}
      />

      {postId && (
        <RevisionsModal
          isOpen={isRevisionsModalOpen}
          onClose={() => setIsRevisionsModalOpen(false)}
          postId={postId}
          currentTitle={title}
          currentContent={content}
          currentSlug={slug}
          onRestore={handleRestoreRevision}
        />
      )}

      {/* GrapesJS Workspace Portal */}
      {isVisualEditorOpen && (
        <GrapesEditor
          initialContent={content}
          initialData={grapesjsData}
          pageTitle={title || 'Không có tiêu đề'}
          onSave={async (compiledHtml, projectDataJson) => {
            setContent(compiledHtml);
            setGrapesjsData(projectDataJson);
            
            const currentSlug = slug.trim() === '' ? generateSlug(title) : slug;
            const response = await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: postId,
                title: title || '(Không có tiêu đề)',
                slug: currentSlug,
                content: compiledHtml,
                status: postStatus === 'published' ? 'published' : 'draft',
                featuredImageId,
                visibility,
                publishedAt,
                categoryIds: showCategories ? categories.filter(c => c.checked).map(c => c.id) : [],
                tags: showTags ? tags : [],
                seoTitle: seoTitle || undefined,
                seoDescription: seoDescription || undefined,
                seoKeywords: seoKeywords || undefined,
                builderData: projectDataJson,
                type: postType,
                ...(customData || {})
              })
            });
            
            const data = await response.json();
            if (data.success) {
              setPostId(data.post.id);
              setHasSaved(true);
              setHasUnsavedChanges(false);
              setLastSavedAt(new Date());
              
              if (!editId) {
                // If this was a new post, update URL silently without reloading
                const editRoute = postType === 'PAGE'
                  ? `/admin/pages/edit/${data.post.id}?builder=true`
                  : postType === 'PRODUCT'
                    ? `/admin/products/edit/${data.post.id}?builder=true`
                    : `/admin/posts/edit/${data.post.id}?builder=true`;
                window.history.replaceState(null, '', editRoute);
              }
            } else {
              throw new Error(data.error || 'Lỗi khi lưu bài viết');
            }
          }}
          onPreview={handlePreview}
          onClose={() => setIsVisualEditorOpen(false)}
        />
      )}
    </div>
  );
}
