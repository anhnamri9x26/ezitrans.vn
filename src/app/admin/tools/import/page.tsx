"use client";

import React, { useState, useEffect, useRef } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import { 
  Database, 
  Sparkles, 
  HelpCircle, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play, 
  X,
  FileText,
  Users,
  FolderOpen,
  Tag as TagIcon,
  RefreshCw,
  Info,
  Trash2
} from 'lucide-react';

interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
}

interface SqlFileItem {
  name: string;
  path: string;
  sizeMb: number;
  format?: 'sql' | 'xml';
}

interface AnalyzerResponse {
  success: boolean;
  exists: boolean;
  sqlFiles: SqlFileItem[];
  defaultFile: SqlFileItem | null;
  schemas: {
    wordpress: {
      wp_posts: SchemaField[];
      wp_users: SchemaField[];
    };
    system: {
      Post: SchemaField[];
      User: SchemaField[];
    };
  };
}

interface ProgressState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  processedLines: number;
  totalLinesEstimated: number;
  usersImported: number;
  postsImported: number;
  categoriesImported: number;
  tagsImported: number;
  commentsImported: number;
  error?: string;
  logs: string[];
  startTime?: string;
  endTime?: string;
}

export default function DatabaseImportPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [analysis, setAnalysis] = useState<AnalyzerResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(true);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);

  // SQL selection
  const [selectedSqlFile, setSelectedSqlFile] = useState<string>('');

  // Field mappings states
  const [postMapping, setPostMapping] = useState<Record<string, string>>({
    title: 'post_title',
    content: 'post_content',
    excerpt: 'post_excerpt',
    status: 'post_status',
    slug: 'post_name',
    type: 'post_type',
    legacyId: 'ID',
    publishedAt: 'post_date'
  });

  const [userMapping, setUserMapping] = useState<Record<string, string>>({
    username: 'user_login',
    email: 'user_email',
    name: 'display_name',
    password: 'user_pass',
    createdAt: 'user_registered'
  });

  // Drag states
  const [draggedField, setDraggedField] = useState<{
    tableName: string;
    fieldName: string;
  } | null>(null);

  // Options
  const [cleanElementorHtml, setCleanElementorHtml] = useState<boolean>(true);
  const [onlyPublished, setOnlyPublished] = useState<boolean>(false);
  const [defaultAuthorId, setDefaultAuthorId] = useState<number>(1);
  const [convertLinks, setConvertLinks] = useState<boolean>(true);
  const [downloadImages, setDownloadImages] = useState<boolean>(true);
  const [importPosts, setImportPosts] = useState<boolean>(true);
  const [importPages, setImportPages] = useState<boolean>(true);
  const [importUsers, setImportUsers] = useState<boolean>(true);
  const [importCategories, setImportCategories] = useState<boolean>(true);

  // Strategy options
  const [strategy, setStrategy] = useState<'merge' | 'replace' | 'skip'>('merge');
  const [skipBrokenMedia, setSkipBrokenMedia] = useState<boolean>(true);
  const [dryRunRows, setDryRunRows] = useState<number>(10);

  // Migration summary states
  const [migrationSummary, setMigrationSummary] = useState<{
    posts: number;
    pages: number;
    users: number;
    categories: number;
    tags: number;
    images: number;
    totalTerms: number;
    format?: 'sql' | 'xml';
    wxrVersion?: string;
    baseSiteUrl?: string;
    comments?: number;
    attachments?: number;
    metadata?: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  // Progress polling
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Link clean-up states
  const [isCleaningLinks, setIsCleaningLinks] = useState<boolean>(false);
  const [cleanLinksMessage, setCleanLinksMessage] = useState<string | null>(null);
  const [cleanAbsoluteLinks, setCleanAbsoluteLinks] = useState<boolean>(true);
  const [cleanShortcodes, setCleanShortcodes] = useState<boolean>(true);
  const [downloadImagesState, setDownloadImagesState] = useState<boolean>(true);

  // File Drag & Drop upload states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image scanning states
  const [loadingImagesScan, setLoadingImagesScan] = useState<boolean>(true);
  const [scanStats, setScanStats] = useState<{ totalImages: number; missingImagesCount: number; missingImages: string[] } | null>(null);
  const [showMissingImagesList, setShowMissingImagesList] = useState<boolean>(false);

  // WordPress REST taxonomy recovery
  const [restBaseUrl, setRestBaseUrl] = useState<string>('');
  const [restLoading, setRestLoading] = useState<boolean>(false);
  const [restError, setRestError] = useState<string | null>(null);
  const [restPreview, setRestPreview] = useState<{ baseUrl: string; categories: number; tags: number; posts: number } | null>(null);
  const [restResult, setRestResult] = useState<{
    dryRun: boolean; matched: number; matchedByLegacyId: number; matchedBySlug: number;
    unmatched: number; updated: number; categories: number; tags: number; posts: number; logs: string[];
  } | null>(null);

  const checkRestTaxonomy = async () => {
    setRestLoading(true); setRestError(null); setRestResult(null);
    try {
      const res = await fetch(`/api/tools/import/rest-taxonomy?baseUrl=${encodeURIComponent(restBaseUrl)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Không thể kết nối WordPress REST API.');
      setRestPreview(data.preview);
    } catch (error: any) { setRestError(error.message); setRestPreview(null); }
    finally { setRestLoading(false); }
  };

  const runRestTaxonomySync = async (dryRun: boolean) => {
    if (!dryRun && !confirm('Đồng bộ danh mục sẽ thay thế quan hệ danh mục/tag hiện tại của các bài khớp. Tiếp tục?')) return;
    setRestLoading(true); setRestError(null);
    try {
      const res = await fetch('/api/tools/import/rest-taxonomy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: restBaseUrl, dryRun })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Không thể đồng bộ taxonomy.');
      setRestResult(data.result);
      setRestPreview({ baseUrl: data.result.baseUrl, categories: data.result.categories, tags: data.result.tags, posts: data.result.posts });
    } catch (error: any) { setRestError(error.message); }
    finally { setRestLoading(false); }
  };

  // Fetch migration summary for the selected file
  const loadMigrationSummary = async (fileName: string) => {
    if (!fileName) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/tools/import?summary=true&file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.success && data.summary) {
        setMigrationSummary(data.summary);
      } else {
        setMigrationSummary(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải báo cáo tổng quan import:', err);
      setMigrationSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Load SQL Analysis definition
  const loadAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/api/tools/import');
      const data = await res.json();
      if (data.success) {
        setAnalysis(data);
      } else {
        setErrorAnalysis(data.error || 'Lỗi không xác định.');
      }
    } catch (err: any) {
      setErrorAnalysis('Không thể kết nối đến API phân tích SQL.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Scan for missing images in imported posts
  const scanMissingImages = async () => {
    setLoadingImagesScan(true);
    try {
      const res = await fetch('/api/tools/import?scan-images=true');
      const data = await res.json();
      if (data.success) {
        setScanStats({
          totalImages: data.totalImagesFound,
          missingImagesCount: data.missingImagesCount,
          missingImages: data.missingImages
        });
      }
    } catch (e) {
      console.error('Lỗi quét ảnh:', e);
    } finally {
      setLoadingImagesScan(false);
    }
  };

  const handleCleanExistingLinks = async () => {
    if (!confirm('Bạn có muốn thực hiện các tùy chọn dọn dẹp dữ liệu đã chọn không?')) {
      return;
    }
    setIsCleaningLinks(true);
    setCleanLinksMessage(null);
    try {
      const res = await fetch('/api/tools/import', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cleanAbsoluteLinks,
          cleanShortcodes,
          downloadImages: downloadImagesState
        })
      });
      const data = await res.json();
      if (data.success) {
        setCleanLinksMessage(`Thành công! Đã hoàn thành xử lý cho ${data.updatedCount} bài viết.`);
        // Re-scan to update visual statistics
        await scanMissingImages();
      } else {
        setCleanLinksMessage(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      setCleanLinksMessage(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsCleaningLinks(false);
    }
  };

  // Upload handlers
  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeaveFile = () => {
    setIsDragging(false);
  };

  const uploadFileStream = (file: File) => {
    if (!/\.(sql|xml)$/i.test(file.name)) {
      setUploadError('Chỉ hỗ trợ file .sql hoặc WordPress WXR .xml');
      return;
    }
    setUploadError(null);
    setUploadPercent(0);
    setUploadingFileName(file.name);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      const total = event.total || file.size;
      if (total) {
        const percent = Math.round((event.loaded / total) * 100);
        setUploadPercent(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          // Re-load root directory SQLs
          await loadAnalysis();
          setSelectedSqlFile(res.filename);
          setUploadPercent(null);
          setUploadingFileName('');
        } else {
          setUploadError(res.error || 'Lỗi không xác định khi tải lên.');
          setUploadPercent(null);
        }
      } else {
        setUploadError(`Lỗi tải lên: Mã trạng thái ${xhr.status}`);
        setUploadPercent(null);
      }
    };

    xhr.onerror = () => {
      setUploadError('Lỗi kết nối khi tải lên tệp tin.');
      setUploadPercent(null);
    };

    xhr.open('POST', `/api/tools/import/upload?filename=${encodeURIComponent(file.name)}`);
    xhr.send(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFileStream(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFileStream(files[0]);
    }
  };

  // Load initial SQL analysis & scan images on mount
  useEffect(() => {
    loadAnalysis();
    scanMissingImages();
    checkBackgroundImport();

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedSqlFile) {
      loadMigrationSummary(selectedSqlFile);
    }
  }, [selectedSqlFile]);

  // Check if an import is currently running on server
  async function checkBackgroundImport() {
    try {
      const res = await fetch('/api/tools/import?status=true');
      const data = await res.json();
      if (data.success && data.progress && data.progress.status === 'running') {
        setProgress(data.progress);
        setActiveStep(3); // Jump straight to tracking
        startPolling();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progress?.logs]);

  // Start polling progress from server
  function startPolling() {
    setIsPolling(true);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/tools/import?status=true');
        const data = await res.json();
        if (data.success && data.progress) {
          setProgress(data.progress);
          
          if (data.progress.status === 'completed' || data.progress.status === 'failed') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);
  }

  // Start import execution
  const handleStartImport = async (isTestRun: boolean = false) => {
    try {
      setActiveStep(3);
      setProgress({
        status: 'running',
        processedLines: 0,
        totalLinesEstimated: isTestRun ? 1000 : 600000,
        usersImported: 0,
        postsImported: 0,
        categoriesImported: 0,
        tagsImported: 0,
        commentsImported: 0,
        logs: [isTestRun ? 'Khởi chạy tiến trình Dry Run thử nghiệm...' : 'Khởi chạy tiến trình import...']
      });
      
      const res = await fetch('/api/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldMapping: {
            wp_posts: postMapping,
            wp_users: userMapping
          },
          options: {
            selectedSqlFile,
            cleanElementorHtml,
            importComments: true,
            importMedia: true,
            importSeoMeta: true,
            cleanShortcodes: true,
            onlyPublished,
            defaultAuthorId,
            convertLinks,
            downloadImages,
            importPosts,
            importPages,
            importUsers,
            importCategories,
            strategy,
            skipBrokenMedia,
            dryRun: isTestRun,
            dryRunRows
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        startPolling();
      } else {
        setProgress(prev => prev ? {
          ...prev,
          status: 'failed',
          error: data.error || 'Không thể khởi chạy import.'
        } : null);
      }
    } catch (err: any) {
      setProgress(prev => prev ? {
        ...prev,
        status: 'failed',
        error: err.message || 'Kết nối máy chủ bị lỗi.'
      } : null);
    }
  };

  // Reset progress state
  const handleResetImport = async () => {
    if (confirm('Bạn có muốn reset trạng thái tiến trình import không?')) {
      await fetch('/api/tools/import', { method: 'DELETE' });
      setProgress(null);
      setActiveStep(1);
    }
  };

  // Delete SQL backup file from storage
  const handleDeleteSqlFile = async (fileName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file SQL "${fileName}" khỏi máy chủ không?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tools/import/upload?filename=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (selectedSqlFile === fileName) {
          setSelectedSqlFile('');
          setMigrationSummary(null);
        }
        await loadAnalysis();
      } else {
        alert(`Lỗi khi xóa: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, tableName: string, fieldName: string) => {
    setDraggedField({ tableName, fieldName });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetTable: 'Post' | 'User', targetField: string) => {
    e.preventDefault();
    if (!draggedField) return;

    // Check if source matches table group
    if (targetTable === 'Post' && draggedField.tableName === 'wp_posts') {
      setPostMapping(prev => ({
        ...prev,
        [targetField]: draggedField.fieldName
      }));
    } else if (targetTable === 'User' && draggedField.tableName === 'wp_users') {
      setUserMapping(prev => ({
        ...prev,
        [targetField]: draggedField.fieldName
      }));
    }

    setDraggedField(null);
  };

  // Preset Mapping helpers
  const applyDefaultMapping = () => {
    setPostMapping({
      title: 'post_title',
      content: 'post_content',
      excerpt: 'post_excerpt',
      status: 'post_status',
      slug: 'post_name',
      type: 'post_type',
      legacyId: 'ID',
      publishedAt: 'post_date'
    });
    setUserMapping({
      username: 'user_login',
      email: 'user_email',
      name: 'display_name',
      password: 'user_pass',
      createdAt: 'user_registered'
    });
  };

  const clearMappings = (table: 'Post' | 'User') => {
    if (table === 'Post') {
      setPostMapping({
        title: '', content: '', excerpt: '', status: '', slug: '', type: '', legacyId: '', publishedAt: ''
      });
    } else {
      setUserMapping({
        username: '', email: '', name: '', password: '', createdAt: ''
      });
    }
  };

  if (loadingAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="animate-spin text-brand-500 w-10 h-10" />
        <div className="text-slate-500 font-bold text-xs tracking-wider uppercase animate-pulse">
          Đang quét hệ thống & phân tích SQL backups...
        </div>
      </div>
    );
  }

  if (errorAnalysis || !analysis) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <AlertTriangle className="text-rose-500 w-16 h-16 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-800">Lỗi phân tích cơ sở dữ liệu!</h2>
        <p className="text-slate-500 text-xs mt-2 max-w-lg mx-auto">
          {errorAnalysis || 'Không tìm thấy tệp tin SQL backup nào trong root của website.'}
        </p>
        <div className="mt-6">
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Quét lại hệ thống
          </button>
        </div>
      </div>
    );
  }

  const { exists, sqlFiles, schemas } = analysis;
  const activeFile = sqlFiles.find(f => f.name === selectedSqlFile) || null;

  const progressPercent = progress 
    ? Math.min(Math.round((progress.processedLines / progress.totalLinesEstimated) * 100), 99) 
    : 0;

  const needPostMapping = importPosts || importPages;
  const needUserMapping = importUsers;
  const isXmlFile = activeFile?.format === 'xml' || selectedSqlFile.toLowerCase().endsWith('.xml');
  const needManualMapping = !isXmlFile && (needPostMapping || needUserMapping);

  return (
    <CapabilityGuard capability="manage_tools">
      <div className="max-w-6xl mx-auto font-sans pb-16 text-xs text-slate-600">
      
      {/* ──── HEADER ──── */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Database className="text-brand-500" size={26} /> Import dữ liệu WordPress
          </h1>
          <p className="text-slate-500 mt-1 text-[12px] font-medium">
            Import bài viết, trang, ảnh, metadata và taxonomy từ SQL hoặc WordPress WXR/XML.
          </p>
        </div>
        
        {/* Active status pulse */}
        {progress?.status === 'running' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ĐANG IMPORT TRONG NỀN
          </div>
        )}
      </div>

      {/* ──── STEP WIZARD INDICATOR ──── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { step: 1, title: 'B1: Cấu hình', desc: 'Chọn SQL/XML & Tùy chọn' },
          { step: 2, title: 'B2: Ánh xạ trường', desc: 'Ánh xạ dữ liệu' },
          { step: 3, title: 'B3: Nhập dữ liệu', desc: 'Theo dõi tiến trình' }
        ].map((item) => {
          const isDisabled = progress?.status === 'running' || (item.step > 1 && !selectedSqlFile);
          return (
            <button
              key={item.step}
              disabled={isDisabled}
              onClick={() => setActiveStep(item.step)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                activeStep === item.step
                  ? 'bg-brand-500/5 border-brand-500/40 text-brand-700 shadow-sm shadow-brand-500/5'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              } ${
                isDisabled
                  ? 'opacity-45 cursor-not-allowed border-slate-100 bg-slate-50/50'
                  : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  activeStep === item.step ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.step}
                </span>
                <span className="font-extrabold text-[12.5px] tracking-tight">{item.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1 pl-7">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ──── STEP 1: SETUP ──── */}
      {activeStep === 1 && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Info size={16} className="text-brand-500" />
                Chọn file SQL
              </h3>

              <div
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeaveFile}
                onDrop={handleDropFile}
                className={`rounded-xl border-2 border-dashed p-6 text-center ${
                  isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Database size={20} className="text-brand-500" />
                </div>
                <p className="text-slate-800 font-bold text-xs">
                  Kéo thả file .sql hoặc WordPress .xml vào đây
                </p>
                <p className="text-slate-500 text-[11px] mt-1">hoặc click để chọn file</p>

                <label className="inline-flex mt-4 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer">
                  Chọn file .sql / .xml
                  <input type="file" accept=".sql,.xml" onChange={handleFileSelect} className="hidden" />
                </label>

                {uploadingFileName && (
                  <div className="mt-4 text-left rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-2">
                      <span>Đang tải lên: {uploadingFileName}</span>
                      <span>{uploadPercent !== null ? `${uploadPercent}%` : '0%'}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${uploadPercent !== null ? uploadPercent : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] px-3 py-2 font-semibold flex items-center gap-1.5 text-left">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {activeFile ? (
                <div className="rounded-lg border border-brand-500/30 bg-brand-500/[0.02] p-3 flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0">
                      <FileText size={17} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{activeFile.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{activeFile.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-2">
                      <p className="text-xs font-bold text-slate-800">{activeFile.sizeMb} MB</p>
                      <p className="text-[10px] font-semibold text-emerald-600">Sẵn sàng</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedSqlFile(''); setMigrationSummary(null); }}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors border-none cursor-pointer flex items-center justify-center"
                      title="Bỏ chọn tệp"
                    >
                      <X size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSqlFile(activeFile.name)}
                      className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-none cursor-pointer flex items-center justify-center"
                      title="Xóa tệp khỏi máy chủ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                sqlFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-slate-700 text-xs font-bold">
                      Hoặc chọn file có sẵn trên máy chủ:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sqlFiles.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-500 transition-all gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedSqlFile(file.name)}
                            className="flex-1 text-left flex items-center gap-2 min-w-0 bg-transparent border-none p-0 cursor-pointer"
                          >
                            <FileText size={15} className="text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-450">{file.sizeMb} MB</p>
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedSqlFile(file.name)}
                              className="text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100/85 px-2.5 py-1 rounded border-none cursor-pointer transition-colors"
                            >
                              Chọn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSqlFile(file.name)}
                              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none cursor-pointer flex items-center justify-center transition-colors"
                              title="Xóa tệp"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </section>

            {/* ──── RISK COMMUNICATION PANEL ──── */}
            <section className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" />
                Lưu ý an toàn dữ liệu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                <div className="flex gap-1.5 text-slate-650">
                  <span>🔒</span>
                  <span><strong>Không ghi đè:</strong> Giữ nguyên bài viết hiện tại trên hệ thống.</span>
                </div>
                <div className="flex gap-1.5 text-slate-650">
                  <span>🔗</span>
                  <span><strong>Đổi slug trùng:</strong> Tránh trùng lặp đường dẫn tĩnh.</span>
                </div>
                <div className="flex gap-1.5 text-slate-650">
                  <span>🖼️</span>
                  <span><strong>Tải ảnh local:</strong> Tải ảnh bài viết về local.</span>
                </div>
                <div className="flex gap-1.5 text-slate-650">
                  <span>🛠️</span>
                  <span><strong>Bỏ qua lỗi:</strong> Log chi tiết, không dừng đột ngột.</span>
                </div>
              </div>
            </section>

            {/* ──── MIGRATION SUMMARY CARD ──── */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Database size={16} className="text-brand-500" />
                Thống kê file SQL
              </h3>
              
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <RefreshCw className="animate-spin text-brand-500 w-8 h-8" />
                  <span className="text-[11px] text-slate-500 font-bold tracking-wider animate-pulse uppercase">Đang quét cấu trúc file SQL...</span>
                </div>
              ) : migrationSummary ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Cấu trúc file SQL phát hiện:</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Bài viết (Posts)</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.posts.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Trang tĩnh (Pages)</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.pages.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Users size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Thành viên (Users)</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.users.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <FolderOpen size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Danh mục (Categories)</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.categories.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <TagIcon size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Thẻ (Tags)</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.tags.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                        <Sparkles size={15} />
                      </div>
                      <div>
                        <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Hình ảnh tìm thấy</span>
                        <span className="text-[13px] font-black text-slate-800 block mt-0.5 leading-none">{migrationSummary.images.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-center italic text-[11px]">
                  Chọn file SQL ở trên để phân tích dữ liệu.
                </div>
              )}
            </section>

             <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Settings size={16} className="text-brand-500" />
                Cấu hình import
              </h3>

              <div className="space-y-4">
                {/* Dữ liệu import */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Dữ liệu import:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importPosts}
                        onChange={(e) => setImportPosts(e.target.checked)}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <FileText size={14} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Bài viết (Posts)</span>
                    </label>

                    <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importPages}
                        onChange={(e) => setImportPages(e.target.checked)}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <FileText size={14} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Trang tĩnh (Pages)</span>
                    </label>

                    <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importUsers}
                        onChange={(e) => setImportUsers(e.target.checked)}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <Users size={14} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Thành viên (Users)</span>
                    </label>

                    <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importCategories}
                        onChange={(e) => setImportCategories(e.target.checked)}
                        className="h-4 w-4 accent-brand-500"
                      />
                      <FolderOpen size={14} className="text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Chuyên mục & Thẻ</span>
                    </label>
                  </div>
                </div>

                {/* Tùy chọn nâng cao */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-2">Tùy chọn nâng cao:</p>
                  <div className="space-y-2.5">
                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanElementorHtml}
                        onChange={(e) => setCleanElementorHtml(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-800">Dọn dẹp mã Elementor</span>
                        <span className="block text-[10.5px] text-slate-500">Lọc bỏ CSS/HTML dư thừa trong bài viết.</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyPublished}
                        onChange={(e) => setOnlyPublished(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-800">Chỉ lấy bài viết xuất bản</span>
                        <span className="block text-[10.5px] text-slate-500">Bỏ qua các bản nháp (draft).</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={convertLinks}
                        onChange={(e) => setConvertLinks(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-800">Chuyển link tuyệt đối sang tương đối</span>
                        <span className="block text-[10.5px] text-slate-500">Tránh lỗi liên kết khi đổi tên miền.</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={downloadImages}
                        onChange={(e) => setDownloadImages(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-800">Tải ảnh về máy chủ (Local)</span>
                        <span className="block text-[10.5px] text-slate-500">Tải toàn bộ hình ảnh trong bài viết.</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tác giả mặc định */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-slate-750 text-xs font-bold mb-2">Tác giả mặc định</label>
                  <select
                    value={defaultAuthorId}
                    onChange={(e) => setDefaultAuthorId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold outline-none focus:border-brand-500"
                  >
                    <option value={1}>Tài khoản Administrator gốc (ID: 1)</option>
                    <option value={2}>Biên tập viên Editor (ID: 2)</option>
                  </select>
                  <p className="mt-1 text-[10.5px] text-slate-500">Sử dụng nếu không tìm thấy tác giả gốc.</p>
                </div>
              </div>
            </section>

            {/* ──── IMPORT STRATEGY PANEL ──── */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Settings size={16} className="text-brand-500" />
                Xử lý trùng lặp
              </h3>
              
              <div className="space-y-4">
                {/* Duplicate Strategy Selector */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-2">
                    Khi trùng bài viết:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { 
                        value: 'merge', 
                        title: 'Merge (Cập nhật / Đổi slug)', 
                        desc: 'Cập nhật nội dung theo ID, đổi slug nếu trùng.' 
                      },
                      { 
                        value: 'replace', 
                        title: 'Replace (Ghi đè dữ liệu)', 
                        desc: 'Thay thế bài cũ nếu trùng ID hoặc trùng slug.' 
                      },
                      { 
                        value: 'skip', 
                        title: 'Skip (Bỏ qua bản ghi)', 
                        desc: 'Không làm gì nếu đã tồn tại.' 
                      }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStrategy(opt.value as any)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          strategy === opt.value
                            ? 'bg-brand-500/5 border-brand-500 text-brand-700 font-semibold'
                            : 'bg-white border-slate-200 hover:border-slate-355'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-800">{opt.title}</span>
                        <span className="block text-[10px] text-slate-400 font-medium leading-normal mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-1">
              <button
                disabled={!selectedSqlFile}
                onClick={() => setActiveStep(2)}
                className={`w-full rounded-lg font-bold py-3 px-6 flex items-center justify-center gap-2 text-xs border-none cursor-pointer transition-all ${
                  selectedSqlFile
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Tiếp tục <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-amber-500" />
                Hướng dẫn nhanh
              </h3>
              <ul className="space-y-2 text-[11px] text-slate-650 list-decimal pl-4">
                <li>Chọn file SQL và cấu hình.</li>
                <li>Ánh xạ các trường dữ liệu ở Bước 2.</li>
                <li>Xem tiến trình và nhật ký ở Bước 3.</li>
              </ul>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-brand-500" />
                  Dọn dẹp liên kết & ảnh
                </span>
                <button
                  type="button"
                  title="Quét lại hình ảnh bài viết"
                  disabled={loadingImagesScan}
                  onClick={scanMissingImages}
                  className="p-1 hover:bg-slate-105 rounded text-slate-500 hover:text-slate-850 cursor-pointer border-none bg-transparent flex items-center transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loadingImagesScan ? 'animate-spin' : ''} />
                </button>
              </h3>

              <p className="text-[11px] text-slate-650 leading-relaxed font-medium">
                Chuyển link tuyệt đối sang tương đối và tải ảnh còn thiếu.
              </p>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-700">Tình trạng ảnh bài viết:</p>

                {loadingImagesScan ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <RefreshCw size={12} className="animate-spin" />
                    Đang quét ảnh hỏng...
                  </div>
                ) : scanStats ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-semibold">Tổng số ảnh tìm thấy:</span>
                      <span className="text-slate-800 font-bold">{scanStats.totalImages}</span>
                    </div>

                    {scanStats.missingImagesCount > 0 ? (
                      <>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} /> Ảnh bị hỏng/lỗi
                          </span>
                          <span>{scanStats.missingImagesCount}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowMissingImagesList(!showMissingImagesList)}
                          className="text-[10px] text-brand-600 font-bold bg-transparent border-none cursor-pointer p-0"
                        >
                          {showMissingImagesList ? 'Ẩn danh sách' : 'Xem danh sách'}
                        </button>

                        {showMissingImagesList && (
                          <div className="max-h-[120px] overflow-y-auto rounded border border-slate-200 bg-white divide-y divide-slate-100 font-mono text-[9.5px] text-slate-600">
                            {scanStats.missingImages.slice(0, 15).map((img, idx) => (
                              <div key={idx} className="px-2 py-1 break-all hover:bg-slate-50" title={img}>
                                {img}
                              </div>
                            ))}
                            {scanStats.missingImages.length > 15 && (
                              <div className="px-2 py-1 text-center italic text-slate-400 font-sans">
                                ...còn {scanStats.missingImages.length - 15} ảnh nữa
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 size={12} />
                        Tất cả ảnh đã tải về
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] italic text-slate-500">Chưa có dữ liệu ảnh bài viết.</div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-700">Tùy chọn dọn dẹp dữ liệu:</p>
                
                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={cleanAbsoluteLinks}
                    onChange={(e) => setCleanAbsoluteLinks(e.target.checked)}
                  />
                  <span>Chuyển link tuyệt đối thành tương đối (<code>lexi.vn</code> sang <code>/</code>)</span>
                </label>

                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={cleanShortcodes}
                    onChange={(e) => setCleanShortcodes(e.target.checked)}
                  />
                  <span>Xử lý Shortcodes WordPress (<code>[caption]</code>, <code>[gallery]</code>...)</span>
                </label>

                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={downloadImagesState}
                    onChange={(e) => setDownloadImagesState(e.target.checked)}
                  />
                  <span>Tự động kiểm tra và tải lại các ảnh bị lỗi/thiếu</span>
                </label>
              </div>

              {cleanLinksMessage && (
                <div
                  className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${
                    cleanLinksMessage.startsWith('Thành công')
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {cleanLinksMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleCleanExistingLinks}
                disabled={isCleaningLinks}
                className="w-full rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-[11px] py-2.5 px-3 cursor-pointer disabled:opacity-50"
              >
                {isCleaningLinks ? 'Đang xử lý...' : 'Sửa liên kết & Tải lại ảnh hỏng'}
              </button>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><RefreshCw size={16} className="text-indigo-600" /> Khôi phục danh mục qua WordPress REST API</h3>
              <p className="text-[10.5px] text-slate-500 mt-1 max-w-2xl">Tạo category/tag và nối lại bài viết bằng WordPress ID cũ. Không thay đổi nội dung, SEO hoặc ảnh.</p>
            </div>
            {restPreview && <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[10px]">REST API HOẠT ĐỘNG</span>}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <input id="wordpress-rest-base-url" value={restBaseUrl} onChange={e => { setRestBaseUrl(e.target.value); setRestPreview(null); setRestResult(null); }} placeholder="https://example.com" className="flex-1 min-w-[260px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-400" />
            <button id="check-wordpress-rest" onClick={checkRestTaxonomy} disabled={restLoading} className="rounded-xl bg-white border border-indigo-200 text-indigo-700 px-5 py-2.5 font-extrabold cursor-pointer disabled:opacity-50">{restLoading ? 'Đang xử lý...' : 'Kiểm tra kết nối'}</button>
          </div>
          {restError && <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700 font-semibold">{restError}</div>}
          {restPreview && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">{[['Danh mục',restPreview.categories],['Tags',restPreview.tags],['Bài viết',restPreview.posts]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-3 text-center"><div className="text-lg font-black text-slate-800">{value}</div><div className="text-[9px] uppercase font-bold text-slate-400">{label}</div></div>)}</div>
              <div className="flex gap-3 flex-wrap">
                <button id="dry-run-rest-taxonomy" onClick={() => runRestTaxonomySync(true)} disabled={restLoading} className="rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 px-5 py-2.5 font-extrabold cursor-pointer disabled:opacity-50">Chạy thử</button>
                <button id="sync-rest-taxonomy" onClick={() => runRestTaxonomySync(false)} disabled={restLoading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-extrabold border-none cursor-pointer disabled:opacity-50">Đồng bộ danh mục</button>
              </div>
            </div>
          )}
          {restResult && <div className={`mt-4 rounded-xl border p-4 ${restResult.dryRun?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}><div className="font-black text-slate-800">{restResult.dryRun?'Kết quả chạy thử':'Đồng bộ hoàn tất'}</div><div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]"><span>Khớp: <b>{restResult.matched}</b></span><span>Qua ID: <b>{restResult.matchedByLegacyId}</b></span><span>Qua slug: <b>{restResult.matchedBySlug}</b></span><span>Không tìm thấy: <b>{restResult.unmatched}</b></span></div>{restResult.logs.length>0&&<div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-slate-900 p-3 font-mono text-[9px] text-slate-200 space-y-1">{restResult.logs.map((log,i)=><div key={i}>{log}</div>)}</div>}</div>}
        </section>
        </>
      )}

      {/* ──── STEP 2: DRAG & DROP MAPPING ──── */}
      {activeStep === 2 && (
        <div className="space-y-8">
          
          {/* Explanatory glassmorphic banner */}
          <div className="bg-brand-500/[0.03] border border-brand-500/20 rounded-xl p-4 shadow-sm text-xs leading-relaxed space-y-1.5">
            <h4 className="font-extrabold text-brand-700 flex items-center gap-1.5 text-[12px]">
              <Info size={15} /> Lưu ý về ánh xạ (Schema Mapping)
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 font-medium text-[10.5px]">
              <li><strong>Bài viết & Trang (Posts/Pages):</strong> Dùng chung bảng nguồn <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">wp_posts</code> ánh xạ sang bảng <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">Post</code>.</li>
              <li><strong>Thành viên (Users):</strong> Ánh xạ từ <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">wp_users</code> sang <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">User</code>.</li>
              <li><strong>Chuyên mục & Thẻ (Categories/Tags):</strong> Được đồng bộ hoàn toàn tự động, không cần cấu hình kéo thả.</li>
            </ul>
          </div>

          {needManualMapping ? (
            <>
              {/* Quick Actions Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-amber-500" />
                  <div>
                    <span className="block font-black text-slate-800 text-[12.5px]">Ánh xạ nhanh</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Tự động nối các trường WordPress mặc định.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={applyDefaultMapping}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-4 py-2 rounded-lg border-none cursor-pointer transition-colors"
                  >
                    Tự động ánh xạ
                  </button>
                  <button
                    onClick={() => { clearMappings('Post'); clearMappings('User'); }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-4 py-2 rounded-lg border-none cursor-pointer transition-colors"
                  >
                    Xóa ánh xạ
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-8 ${needPostMapping && needUserMapping ? 'lg:grid-cols-2' : ''}`}>
                {needPostMapping && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={16} className="text-brand-500" /> Bài viết (wp_posts ➔ Post)
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">Kéo từ Trái qua Phải</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Left Side: Source WordPress Fields (Draggable) */}
                      <div className="space-y-2">
                        <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trường WordPress (Nguồn)</span>
                        <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200 max-h-[350px] overflow-y-auto">
                          {schemas.wordpress.wp_posts.map((f) => (
                            <div
                              key={f.name}
                              draggable
                              onDragStart={(e) => handleDragStart(e, 'wp_posts', f.name)}
                              className="p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-brand-400 text-slate-700 font-mono font-semibold text-[11px] flex items-center justify-between shadow-sm cursor-grab active:cursor-grabbing hover:bg-brand-50/20 transition-all select-none"
                            >
                              <span>{f.name}</span>
                              <span className="text-[8.5px] font-bold uppercase text-slate-400">{f.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Destination System Fields (Drop Targets) */}
                      <div className="space-y-3">
                        <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ thống mới (Đích)</span>
                        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                          {schemas.system.Post.map((f) => (
                            <div 
                              key={f.name}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, 'Post', f.name)}
                              className={`p-3 rounded-xl border transition-all duration-300 ${
                                postMapping[f.name] 
                                  ? 'bg-brand-500/[0.02] border-brand-500/30' 
                                  : 'bg-slate-50/30 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-extrabold text-slate-800">
                                  {f.name}
                                  {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{f.type}</span>
                              </div>
                              
                              {/* Drop Box Indicator */}
                              <div className={`p-2.5 rounded-lg border border-dashed flex items-center justify-between font-mono text-[11px] font-semibold transition-all ${
                                postMapping[f.name]
                                  ? 'bg-white border-brand-500/40 text-brand-700 shadow-sm'
                                  : 'bg-slate-100/50 border-slate-300 text-slate-400 text-[10.5px] text-center justify-center py-3'
                              }`}>
                                {postMapping[f.name] ? (
                                  <>
                                    <span>{postMapping[f.name]}</span>
                                    <button 
                                      onClick={() => setPostMapping(p => ({ ...p, [f.name]: '' }))}
                                      className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center border-none cursor-pointer transition-colors"
                                    >
                                      <X size={10} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="italic">Kéo thả trường WP vào đây...</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {needUserMapping && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Users size={16} className="text-brand-500" /> Thành viên (wp_users ➔ User)
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">Kéo từ Trái qua Phải</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Left Side: Source WordPress Fields (Draggable) */}
                      <div className="space-y-2">
                        <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trường WordPress (Nguồn)</span>
                        <div className="space-y-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200 max-h-[350px] overflow-y-auto">
                          {schemas.wordpress.wp_users.map((f) => (
                            <div
                              key={f.name}
                              draggable
                              onDragStart={(e) => handleDragStart(e, 'wp_users', f.name)}
                              className="p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-brand-400 text-slate-700 font-mono font-semibold text-[11px] flex items-center justify-between shadow-sm cursor-grab active:cursor-grabbing hover:bg-brand-50/20 transition-all select-none"
                            >
                              <span>{f.name}</span>
                              <span className="text-[8.5px] font-bold uppercase text-slate-400">{f.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Destination System Fields (Drop Targets) */}
                      <div className="space-y-3">
                        <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ thống mới (Đích)</span>
                        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                          {schemas.system.User.map((f) => (
                            <div 
                              key={f.name}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, 'User', f.name)}
                              className={`p-3 rounded-xl border transition-all duration-300 ${
                                userMapping[f.name] 
                                  ? 'bg-brand-500/[0.02] border-brand-500/30' 
                                  : 'bg-slate-50/30 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-extrabold text-slate-800">
                                  {f.name}
                                  {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{f.type}</span>
                              </div>
                              
                              {/* Drop Box Indicator */}
                              <div className={`p-2.5 rounded-lg border border-dashed flex items-center justify-between font-mono text-[11px] font-semibold transition-all ${
                                userMapping[f.name]
                                  ? 'bg-white border-brand-500/40 text-brand-700 shadow-sm'
                                  : 'bg-slate-100/50 border-slate-300 text-slate-400 text-[10.5px] text-center justify-center py-3'
                              }`}>
                                {userMapping[f.name] ? (
                                  <>
                                    <span>{userMapping[f.name]}</span>
                                    <button 
                                      onClick={() => setUserMapping(p => ({ ...p, [f.name]: '' }))}
                                      className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center border-none cursor-pointer transition-colors"
                                    >
                                      <X size={10} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="italic">Kéo thả trường WP vào đây...</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-slate-700">
              <h3 className="text-sm font-black text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} /> Tự động ánh xạ
              </h3>
              <p className="text-[11px] mt-2 leading-relaxed">
                Chuyên mục & Thẻ được đồng bộ tự động. Nhấn "Bắt đầu" để tiến hành.
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 flex-wrap gap-3">
            <button
              onClick={() => setActiveStep(1)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-6 py-3 rounded-xl border-none cursor-pointer transition-colors"
            >
              Quay lại
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartImport(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:translate-y-0.5 border-none cursor-pointer transition-all"
              >
                <Play size={14} fill="white" /> Bắt đầu Import
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ──── STEP 3: READY / RUNNING PROGRESS & TRACKING ──── */}
      {activeStep === 3 && !progress && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Play size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">Sẵn sàng nhập dữ liệu</h3>
            <p className="text-[11px] text-slate-500 mt-2">
              {isXmlFile
                ? 'File WXR/XML đã được tự động ánh xạ. Hãy chạy thử trước để kiểm tra dữ liệu.'
                : 'Hãy quay lại bước ánh xạ nếu bạn cần kiểm tra các trường trước khi nhập.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setActiveStep(2)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-6 py-3 rounded-xl border-none cursor-pointer"
            >
              Quay lại kiểm tra
            </button>
            <button
              onClick={() => handleStartImport(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-6 py-3 rounded-xl border border-indigo-200 cursor-pointer"
            >
              Chạy thử {dryRunRows} bản ghi
            </button>
            <button
              onClick={() => handleStartImport(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 border-none cursor-pointer"
            >
              <Play size={14} fill="white" /> Bắt đầu Import
            </button>
          </div>
        </div>
      )}

      {activeStep === 3 && progress && (
        <div className="space-y-6">
          
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className={`text-brand-500 ${progress.status === 'running' ? 'animate-spin' : ''}`} size={16} /> 
                  Tiến trình Import {progress.logs[0]?.includes('[Dry Run]') && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200/50">CHẠY THỬ</span>
                  )}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái: {progress.status}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {progress.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-black tracking-wider text-[10px]">
                    <CheckCircle2 size={11} /> THÀNH CÔNG
                  </span>
                )}
                {progress.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-black tracking-wider text-[10px]">
                    <AlertTriangle size={11} /> LỖI
                  </span>
                )}
                {progress.status === 'running' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-black tracking-wider text-[10px] animate-pulse">
                    ĐANG CHẠY...
                  </span>
                )}

                <button 
                  onClick={handleResetImport}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold border-none cursor-pointer transition-colors"
                >
                  Làm lại
                </button>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Đã xử lý: {progress.processedLines.toLocaleString()} / {progress.totalLinesEstimated.toLocaleString()} dòng</span>
                <span className="text-brand-500 font-extrabold text-[13px]">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    progress.status === 'completed' 
                      ? 'bg-emerald-500' 
                      : progress.status === 'failed' 
                        ? 'bg-rose-500' 
                        : 'bg-gradient-to-r from-brand-400 to-brand-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Imported entities counter metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { title: 'Bài viết', count: progress.postsImported, icon: <FileText size={14} />, color: 'bg-blue-50 text-blue-600' },
                { title: 'User', count: progress.usersImported, icon: <Users size={14} />, color: 'bg-indigo-50 text-indigo-600' },
                { title: 'Chuyên mục', count: progress.categoriesImported, icon: <FolderOpen size={14} />, color: 'bg-amber-50 text-amber-600' },
                { title: 'Thẻ', count: progress.tagsImported, icon: <TagIcon size={14} />, color: 'bg-emerald-50 text-emerald-600' },
                { title: 'Comment', count: progress.commentsImported, icon: <HelpCircle size={14} />, color: 'bg-slate-50 text-slate-600' }
              ].map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
                    {m.icon}
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{m.title}</span>
                    <span className="text-[15px] font-black text-slate-800 mt-0.5 block leading-none">{m.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error banner if any */}
            {progress.error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed flex gap-2">
                <AlertTriangle className="shrink-0 text-rose-500 mt-0.5" size={16} />
                <div>
                  <strong className="block mb-0.5">Chi tiết lỗi:</strong>
                  {progress.error}
                </div>
              </div>
            )}

            {/* ──── REAL-TIME STREAMING LOGS ──── */}
            <div className="space-y-2">
              <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Nhật ký tiến trình</span>
              <div 
                ref={logContainerRef}
                className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] leading-relaxed h-[220px] overflow-y-auto border border-slate-900 select-text scroll-smooth"
              >
                {progress.logs.length === 0 ? (
                  <div className="text-slate-600 italic">Đang chờ logs...</div>
                ) : (
                  progress.logs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-900/30 pb-0.5 last:border-0 hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action buttons on finish */}
            {(progress.status === 'completed' || progress.status === 'failed') && (
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 justify-end flex-wrap">
                <a 
                  href="/admin/posts"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl shadow-md shadow-brand-500/20 active:translate-y-0.5 transition-all text-xs text-center border-none cursor-pointer no-underline"
                >
                  Xem bài viết
                </a>
                <button
                  onClick={() => { setActiveStep(2); setProgress(null); }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl border-none cursor-pointer transition-colors"
                >
                  Quay lại
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      </div>
    </CapabilityGuard>
  );
}
