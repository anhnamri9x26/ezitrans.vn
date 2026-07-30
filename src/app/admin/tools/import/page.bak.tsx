"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Info
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
  const [selectedSqlFile, setSelectedSqlFile] = useState<string>('ezitrans.sql');

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

  // Progress polling
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Link clean-up states
  const [isCleaningLinks, setIsCleaningLinks] = useState<boolean>(false);
  const [cleanLinksMessage, setCleanLinksMessage] = useState<string | null>(null);

  // File Drag & Drop upload states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image scanning states
  const [loadingImagesScan, setLoadingImagesScan] = useState<boolean>(true);
  const [scanStats, setScanStats] = useState<{ totalImages: number; missingImagesCount: number; missingImages: string[] } | null>(null);
  const [showMissingImagesList, setShowMissingImagesList] = useState<boolean>(false);

  // Load SQL Analysis definition
  const loadAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/api/tools/import');
      const data = await res.json();
      if (data.success) {
        setAnalysis(data);
        if (data.defaultFile) {
          setSelectedSqlFile(data.defaultFile.name);
        }
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
    if (!confirm('Bạn có muốn tự động dọn dẹp đường dẫn tuyệt đối và tải toàn bộ hình ảnh WordPress bị thiếu từ máy chủ cũ về không?')) {
      return;
    }
    setIsCleaningLinks(true);
    setCleanLinksMessage(null);
    try {
      const res = await fetch('/api/tools/import', { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setCleanLinksMessage(`Thành công! Đã dọn dẹp liên kết và tải lại ảnh cho ${data.updatedCount} bài viết.`);
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
    if (!file.name.toLowerCase().endsWith('.sql')) {
      setUploadError('Chỉ hỗ trợ tệp tin database định dạng .sql');
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
  const handleStartImport = async () => {
    try {
      setActiveStep(3);
      setProgress({
        status: 'running',
        processedLines: 0,
        totalLinesEstimated: 600000,
        usersImported: 0,
        postsImported: 0,
        categoriesImported: 0,
        tagsImported: 0,
        commentsImported: 0,
        logs: ['Khởi chạy tiến trình import...']
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
            onlyPublished,
            defaultAuthorId,
            convertLinks,
            downloadImages,
            importPosts,
            importPages,
            importUsers,
            importCategories
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
  const activeFile = sqlFiles.find(f => f.name === selectedSqlFile) || sqlFiles[0] || null;

  const progressPercent = progress 
    ? Math.min(Math.round((progress.processedLines / progress.totalLinesEstimated) * 100), 99) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto font-sans pb-16 text-xs text-slate-600">
      
      {/* ──── HEADER ──── */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Database className="text-brand-500" size={26} /> Import & Migration database từ WordPress
          </h1>
          <p className="text-slate-500 mt-1 text-[12px] font-medium">
            Phân tích tự động, mapping kéo thả trường tùy biến và nhập dữ liệu dòng stream tốc độ cao cho tệp tin database SQL.
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
          { step: 1, title: 'Bước 1: Tệp tin & Cài đặt', desc: 'Kiểm tra file SQL và tham số' },
          { step: 2, title: 'Bước 2: Mapping Kéo Thả', desc: 'Ánh xạ các trường dữ liệu' },
          { step: 3, title: 'Bước 3: Nhập & Theo dõi', desc: 'Tiến trình thực thi và logs' }
        ].map((item) => (
          <button
            key={item.step}
            disabled={progress?.status === 'running'}
            onClick={() => setActiveStep(item.step)}
            className={`text-left p-4 rounded-xl border transition-all duration-300 ${
              activeStep === item.step
                ? 'bg-brand-500/5 border-brand-500/40 text-brand-700 shadow-sm shadow-brand-500/5'
                : 'bg-white border-slate-200 hover:border-slate-300'
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
        ))}
      </div>

      {/* ──── STEP 1: SETUP ──── */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Info size={16} className="text-brand-500" /> Chọn Tệp tin Backup SQL để xử lý
              </h3>

              <div className="space-y-6">
                {/* 1. Drag & Drop Upload Zone */}
                <div 
                  onDragOver={handleDragOverFile}
                  onDragLeave={handleDragLeaveFile}
                  onDrop={handleDropFile}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-brand-500 bg-brand-500/5 shadow-inner' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/15'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shadow-sm">
                      <Database size={22} className={isDragging ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-xs">
                        Kéo thả file backup <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.sql</code> vào đây để tải lên trực tiếp
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Hoặc bấm chọn tệp tin từ máy tính của bạn
                      </span>
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 shadow-sm cursor-pointer inline-block text-[11px] hover:border-slate-350 transition-colors">
                        Chọn tệp tin .sql
                        <input 
                          type="file" 
                          accept=".sql" 
                          onChange={handleFileSelect} 
                          className="sr-only" 
                        />
                      </label>
                    </div>
                  </div>

                  {uploadingFileName && (
                    <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-left">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-slate-700">
                        <span>Đang tải lên: {uploadingFileName}</span>
                        <span>{uploadPercent !== null ? `${uploadPercent}%` : '0%'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all duration-150" 
                          style={{ width: `${uploadPercent !== null ? uploadPercent : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10.5px] text-left font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* 2. Choose Existing Local SQL Dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-2 text-xs">
                    Hoặc chọn tệp tin SQL đã có sẵn trong máy chủ:
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedSqlFile}
                      onChange={(e) => setSelectedSqlFile(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-slate-700 bg-white font-bold shadow-sm focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer text-xs"
                    >
                      {sqlFiles.map((file) => (
                        <option key={file.name} value={file.name}>
                          {file.name} ({file.sizeMb} MB)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <FolderOpen size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                    💡 Hệ thống tự động quét và phát hiện các tệp tin SQL nằm trong thư mục gốc. Bạn có thể kéo thả để tải lên file mới hoặc chọn tệp đã có ở đây để import trực tiếp mà không cần tải lên lại.
                  </p>
                </div>

                {activeFile && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="truncate">
                        <span className="block font-black text-slate-800 text-[12.5px] truncate">{activeFile.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate">Đường dẫn: {activeFile.path}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-extrabold text-slate-800 text-[13px]">{activeFile.sizeMb} MB</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                        <CheckCircle2 size={10} /> ĐÃ SẴN SÀNG
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* General configurations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings size={16} className="text-brand-500" /> Cấu hình & Tùy chọn Nhập
              </h3>

              <div className="space-y-4 font-semibold">
                
                {/* 1. Elementor HTML cleanup */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cleanElementorHtml}
                    onChange={(e) => setCleanElementorHtml(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-slate-800 font-bold text-xs">Loại bỏ CSS/HTML rác của Elementor</span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Tự động dọn sạch các thẻ `style`, `elementor-widget` để bài viết sạch sẽ, dễ dàng hiển thị theo theme Modern.</span>
                  </div>
                </label>

                {/* 2. ONLY PUBLISHED */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={onlyPublished}
                    onChange={(e) => setOnlyPublished(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-slate-800 font-bold text-xs">Chỉ import các bài viết ở trạng thái Xuất Bản (Publish)</span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Lọc bỏ các bản nháp, bài viết rác, hoặc các bản lưu nháp tự động của WordPress.</span>
                  </div>
                </label>

                {/* 3. CONVERT LINKS OPTION */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={convertLinks}
                    onChange={(e) => setConvertLinks(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-slate-800 font-bold text-xs">Tự động xử lý liên kết thành tương đối (Khuyên dùng)</span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Tự động chuyển đổi các đường link tuyệt đối `https://ezitrans.vn/...` thành `/...` để tránh lỗi liên kết khi chạy ở host khác.</span>
                  </div>
                </label>

                {/* 4. DOWNLOAD IMAGES OPTION */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={downloadImages}
                    onChange={(e) => setDownloadImages(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-slate-800 font-bold text-xs">Tự động xử lý và tải hình ảnh WordPress về local (Khuyên dùng)</span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Tự động quét nội dung, tải ảnh từ server WordPress cũ về thư mục `public` cục bộ và đồng bộ vào Thư viện phương tiện.</span>
                  </div>
                </label>

                {/* 5. GRANULAR ENTITY TOGGLES */}
                <div className="pt-4 border-t border-slate-100/80 space-y-3">
                  <span className="block text-slate-700 font-bold text-xs">Đối tượng dữ liệu sẽ nhập vào hệ thống:</span>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Checkbox 1 */}
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer font-bold text-slate-800 text-xs bg-white ${
                      importPosts 
                        ? 'border-brand-500 bg-brand-500/[0.02] shadow-sm' 
                        : 'border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={importPosts}
                        onChange={(e) => setImportPosts(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        importPosts 
                          ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        {importPosts && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className={importPosts ? 'text-brand-500' : 'text-slate-400'} />
                        <span>Nhập Bài viết (Posts)</span>
                      </div>
                    </label>

                    {/* Checkbox 2 */}
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer font-bold text-slate-800 text-xs bg-white ${
                      importPages 
                        ? 'border-brand-500 bg-brand-500/[0.02] shadow-sm' 
                        : 'border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={importPages}
                        onChange={(e) => setImportPages(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        importPages 
                          ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        {importPages && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className={importPages ? 'text-brand-500' : 'text-slate-400'} />
                        <span>Nhập Trang tĩnh (Pages)</span>
                      </div>
                    </label>

                    {/* Checkbox 3 */}
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer font-bold text-slate-800 text-xs bg-white ${
                      importUsers 
                        ? 'border-brand-500 bg-brand-500/[0.02] shadow-sm' 
                        : 'border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={importUsers}
                        onChange={(e) => setImportUsers(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        importUsers 
                          ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        {importUsers && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className={importUsers ? 'text-brand-500' : 'text-slate-400'} />
                        <span>Nhập Thành viên (Users)</span>
                      </div>
                    </label>

                    {/* Checkbox 4 */}
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors duration-200 cursor-pointer font-bold text-slate-800 text-xs bg-white ${
                      importCategories 
                        ? 'border-brand-500 bg-brand-500/[0.02] shadow-sm' 
                        : 'border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={importCategories}
                        onChange={(e) => setImportCategories(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        importCategories 
                          ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                        {importCategories && <span className="text-[9px] font-bold">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen size={14} className={importCategories ? 'text-brand-500' : 'text-slate-400'} />
                        <span>Nhập Chuyên mục & Thẻ</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-2">Tác giả mặc định cho các bài viết</label>
                  <select 
                    value={defaultAuthorId}
                    onChange={(e) => setDefaultAuthorId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-medium"
                  >
                    <option value={1}>Tài khoản Administrator gốc (ID: 1)</option>
                    <option value={2}>Biên tập viên Editor (ID: 2)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Sử dụng tài khoản này nếu tác giả gốc của bài viết trên WordPress không tồn tại trong hệ thống.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveStep(2)}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 active:translate-y-0.5 transition-all text-xs border-none cursor-pointer"
              >
                Tiếp tục sang Mapping <ArrowRight size={14} />
              </button>
            </div>
          </div> {/* Closes lg:col-span-2 Main Info Column */}
          {/* Sidebar Guidelines & Tools */}
          <div className="space-y-6">
            {/* Guidelines Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-amber-500" /> Hướng dẫn Import
              </h3>
              <ul className="space-y-3 text-[11px] leading-relaxed text-slate-500 font-medium">
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold">1</span>
                  <span>Chọn tệp tin SQL backup hoặc kéo thả tệp mới tải lên, sau đó bật cấu hình bộ lọc ở Bước 1.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold">2</span>
                  <span>Sử dụng <strong>Kéo Thả</strong> ở Bước 2 để ánh xạ các trường WordPress cũ vào cấu trúc PostgreSQL mới (hoặc bấm <strong>Preset Auto-Map</strong> để tự động điền nhanh).</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold">3</span>
                  <span>Nhấn <strong>Khởi chạy Import</strong> để bắt đầu quá trình chạy nền. Bạn có thể đóng trình duyệt, tiến trình vẫn sẽ tiếp tục chạy an toàn trên máy chủ.</span>
                </li>
              </ul>
            </div>

            {/* Redesigned Link and Image Clean-up card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Sparkles size={16} className="text-brand-500" />
                Sửa liên kết & Tải ảnh bài viết
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                Công cụ tự động quét toàn bộ bài viết đã nhập trước đó để chuyển đổi link tuyệt đối <code className="bg-slate-100 px-1 rounded font-bold text-brand-600 text-[10px]">https://ezitrans.vn/...</code> thành tương đối <code className="bg-slate-100 px-1 rounded font-bold text-brand-600 text-[10px]">/...</code>, đồng thời quét tìm và tải toàn bộ hình ảnh WordPress bị thiếu về local để sửa lỗi hiển thị.
              </p>

              {/* Real-time missing image scan container */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                <span className="block font-bold text-slate-700 text-[10.5px]">Trạng thái hình ảnh bài viết:</span>
                
                {loadingImagesScan ? (
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10.5px]">
                    <RefreshCw size={11} className="animate-spin" /> Đang quét ảnh lỗi hiển thị...
                  </div>
                ) : scanStats ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Tổng số ảnh quét được:</span>
                      <span className="text-slate-800">{scanStats.totalImages}</span>
                    </div>

                    {scanStats.missingImagesCount > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 bg-amber-500/[0.04] px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-500" /> Phát hiện ảnh lỗi:
                          </span>
                          <span>{scanStats.missingImagesCount} ảnh</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setShowMissingImagesList(!showMissingImagesList)}
                          className="text-[9.5px] font-black text-brand-600 hover:text-brand-700 bg-transparent border-none outline-none cursor-pointer flex items-center gap-0.5"
                        >
                          {showMissingImagesList ? 'Ẩn danh sách ảnh lỗi' : 'Xem danh sách ảnh lỗi'}
                        </button>

                        {showMissingImagesList && (
                          <div className="bg-white border border-slate-200 rounded-lg p-2 max-h-[120px] overflow-y-auto font-mono text-[9px] text-slate-500 divide-y divide-slate-100 shadow-inner">
                            {scanStats.missingImages.slice(0, 15).map((img, idx) => (
                              <div key={idx} className="py-1 break-all select-all hover:bg-slate-50 px-1 rounded transition-colors" title={img}>
                                {img}
                              </div>
                            ))}
                            {scanStats.missingImages.length > 15 && (
                              <div className="py-1 text-center italic text-slate-400 font-sans">
                                ...và {scanStats.missingImages.length - 15} ảnh khác
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-500/[0.04] px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Tất cả ảnh đã sẵn sàng trên local!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[10.5px]">Không thể quét ảnh bài viết.</div>
                )}
              </div>
              
              {cleanLinksMessage && (
                <div className={`p-3 rounded-xl border text-[10.5px] font-bold leading-relaxed ${
                  cleanLinksMessage.startsWith('Thành công')
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {cleanLinksMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleCleanExistingLinks}
                disabled={isCleaningLinks}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 text-indigo-700 font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCleaningLinks ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Đang xử lý dọn dẹp & tải ảnh...
                  </>
                ) : (
                  <>
                    Sửa liên kết & Tải toàn bộ ảnh lỗi
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ──── STEP 2: DRAG & DROP MAPPING ──── */}
      {activeStep === 2 && (
        <div className="space-y-8">
          
          {/* Explanatory glassmorphic banner */}
          <div className="bg-brand-500/[0.03] border border-brand-500/20 rounded-2xl p-5 shadow-sm text-xs leading-relaxed space-y-2.5">
            <h4 className="font-extrabold text-brand-700 flex items-center gap-1.5 text-[12.5px]">
              <Info size={16} /> Giải thích cấu trúc ánh xạ (WordPress Schema Mapping)
            </h4>
            <p className="text-slate-600 font-medium text-[11px]">
              Tại sao bạn chọn 4 đối tượng nhập liệu ở Bước 1 nhưng ở đây chỉ hiển thị 2 bảng mapping?
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-500 font-medium text-[11px]">
              <li>
                <strong className="text-slate-700">Bài viết (Posts) & Trang tĩnh (Pages)</strong> đều sử dụng chung bảng dữ liệu gốc <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">wp_posts</code> của WordPress và được nhập vào cùng cấu trúc bảng đích <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">Post</code> trên hệ thống mới (với phân loại khác nhau bằng cột <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">type</code>). Do đó, hai đối tượng này chia sẻ chung một giao diện cấu hình mapping kéo thả trường dữ liệu.
              </li>
              <li>
                <strong className="text-slate-700">Thành viên (Users)</strong> sử dụng bảng dữ liệu gốc <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">wp_users</code> và được ánh xạ trực tiếp sang bảng đích <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">User</code> mới.
              </li>
              <li>
                <strong className="text-slate-700">Chuyên mục & Thẻ (Categories & Tags)</strong> được đồng bộ hoàn toàn <strong className="text-brand-650 font-bold">tự động thông minh</strong> bằng cách đối chiếu tên và slug từ taxonomy của WordPress, không yêu cầu cấu hình kéo thả thủ công để tránh sự phức tạp không cần thiết.
              </li>
            </ul>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" />
              <div>
                <span className="block font-black text-slate-800 text-[12.5px]">Mẫu ánh xạ sẵn có (Mapping presets)</span>
                <span className="block text-[10px] text-slate-400 font-medium">Bấm để tự động mapping thông minh toàn bộ các trường WordPress mặc định ngay lập tức.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={applyDefaultMapping}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-4 py-2 rounded-lg border-none cursor-pointer transition-colors"
              >
                Auto-Map (Wordpress)
              </button>
              <button
                onClick={() => { clearMappings('Post'); clearMappings('User'); }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-4 py-2 rounded-lg border-none cursor-pointer transition-colors"
              >
                Xóa tất cả Mapping
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. MAPPING TABLE: POSTS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-brand-500" /> Bảng: wp_posts ➔ Post (Bài viết / Trang)
                </h3>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">Kéo từ Trái sang Phải</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Left Side: Source WordPress Fields (Draggable) */}
                <div className="space-y-2">
                  <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">WordPress columns (Nguồn)</span>
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
                            <span className="italic">Kéo thả cột WP vào đây...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* 2. MAPPING TABLE: USERS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-brand-500" /> Bảng: wp_users ➔ User (Thành viên)
                </h3>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">Kéo từ Trái sang Phải</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Left Side: Source WordPress Fields (Draggable) */}
                <div className="space-y-2">
                  <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">WordPress columns (Nguồn)</span>
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
                            <span className="italic">Kéo thả cột WP vào đây...</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              onClick={() => setActiveStep(1)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-6 py-3 rounded-xl border-none cursor-pointer transition-colors"
            >
              Quay lại Bước 1
            </button>

            <button
              onClick={handleStartImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:translate-y-0.5 border-none cursor-pointer transition-all"
            >
              <Play size={14} fill="white" /> Bắt đầu Tiến trình Import
            </button>
          </div>

        </div>
      )}

      {/* ──── STEP 3: RUNNING PROGRESS & TRACKING ──── */}
      {activeStep === 3 && progress && (
        <div className="space-y-6">
          
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className={`text-brand-500 ${progress.status === 'running' ? 'animate-spin' : ''}`} size={16} /> 
                  Tiến trình Migration
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái: {progress.status}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {progress.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-55 text-emerald-800 border border-emerald-100 font-black tracking-wider text-[10px]">
                    <CheckCircle2 size={11} /> HOÀN TẤT THÀNH CÔNG
                  </span>
                )}
                {progress.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-black tracking-wider text-[10px]">
                    <AlertTriangle size={11} /> THẤT BẠI
                  </span>
                )}
                {progress.status === 'running' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-black tracking-wider text-[10px] animate-pulse">
                    ĐANG CHẠY DƯỚI NỀN...
                  </span>
                )}

                <button 
                  onClick={handleResetImport}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold border-none cursor-pointer transition-colors"
                >
                  Reset / Thử lại
                </button>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Dòng lệnh đã xử lý: {progress.processedLines.toLocaleString()} / {progress.totalLinesEstimated.toLocaleString()}</span>
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
                { title: 'Bài viết/Trang', count: progress.postsImported, icon: <FileText size={14} />, color: 'bg-blue-50 text-blue-600' },
                { title: 'Thành viên', count: progress.usersImported, icon: <Users size={14} />, color: 'bg-indigo-50 text-indigo-600' },
                { title: 'Danh mục', count: progress.categoriesImported, icon: <FolderOpen size={14} />, color: 'bg-amber-50 text-amber-600' },
                { title: 'Thẻ bài viết', count: progress.tagsImported, icon: <TagIcon size={14} />, color: 'bg-emerald-50 text-emerald-600' },
                { title: 'Bình luận', count: progress.commentsImported, icon: <HelpCircle size={14} />, color: 'bg-slate-50 text-slate-600' }
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
                  <strong className="block mb-0.5">Mô tả lỗi hệ thống:</strong>
                  {progress.error}
                </div>
              </div>
            )}

            {/* ──── REAL-TIME STREAMING LOGS ──── */}
            <div className="space-y-2">
              <span className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Nhật ký tiến trình thời gian thực (Live execution logs)</span>
              <div 
                ref={logContainerRef}
                className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] leading-relaxed h-[220px] overflow-y-auto border border-slate-900 select-text scroll-smooth"
              >
                {progress.logs.length === 0 ? (
                  <div className="text-slate-600 italic">Đang chờ tín hiệu ghi logs...</div>
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
                  href="/posts"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl shadow-md shadow-brand-500/20 active:translate-y-0.5 transition-all text-xs text-center border-none cursor-pointer no-underline"
                >
                  Xem bài viết đã Import
                </a>
                <button
                  onClick={() => { setActiveStep(2); setProgress(null); }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl border-none cursor-pointer transition-colors"
                >
                  Quay lại cài đặt Mapping
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
