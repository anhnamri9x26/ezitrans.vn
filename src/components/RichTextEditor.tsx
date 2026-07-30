"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ImageConfigModal from '@/components/ImageConfigModal';
import 'react-quill-new/dist/quill.snow.css';

// Build Quill toolbar from saved config
export function buildQuillToolbar(config: Record<string, boolean>): any[] {
  const toolbar: any[] = [];

  // Font & Size group
  const fontGroup: any[] = [];
  if (config['font']) fontGroup.push({ 'font': [] });
  if (config['size']) fontGroup.push({ 'size': ['small', false, 'large', 'huge'] });
  if (fontGroup.length > 0) toolbar.push(fontGroup);

  // Heading — dropdown or individual buttons
  const headingGroup: any[] = [];
  if (config['header'] !== false) {
    headingGroup.push({ 'header': [1, 2, 3, 4, false] });
  }
  // Individual header buttons (H1, H2, H3, H4)
  if (config['header-1']) headingGroup.push({ 'header': 1 });
  if (config['header-2']) headingGroup.push({ 'header': 2 });
  if (config['header-3']) headingGroup.push({ 'header': 3 });
  if (config['header-4']) headingGroup.push({ 'header': 4 });
  if (headingGroup.length > 0) toolbar.push(headingGroup);

  // Text style group
  const textStyle: string[] = [];
  if (config['bold'] !== false) textStyle.push('bold');
  if (config['italic'] !== false) textStyle.push('italic');
  if (config['underline'] !== false) textStyle.push('underline');
  if (config['strike'] !== false) textStyle.push('strike');
  if (config['blockquote'] !== false) textStyle.push('blockquote');
  if (textStyle.length > 0) toolbar.push(textStyle);

  // List & Block group
  const listBlock: any[] = [];
  if (config['list-ordered'] !== false) listBlock.push({ 'list': 'ordered' });
  if (config['list-bullet'] !== false) listBlock.push({ 'list': 'bullet' });
  if (config['list-check']) listBlock.push({ 'list': 'check' });
  if (config['indent-decrease'] !== false) listBlock.push({ 'indent': '-1' });
  if (config['indent-increase'] !== false) listBlock.push({ 'indent': '+1' });
  if (listBlock.length > 0) toolbar.push(listBlock);

  // Alignment group
  const alignValues: (string | false)[] = [];
  if (config['align-left'] !== false) alignValues.push(false); // false = default (left)
  if (config['align-center'] !== false) alignValues.push('center');
  if (config['align-right'] !== false) alignValues.push('right');
  if (config['align-justify'] !== false) alignValues.push('justify');
  if (alignValues.length > 0) toolbar.push([{ 'align': alignValues }]);

  // Direction
  if (config['direction-rtl']) {
    toolbar.push([{ 'direction': 'rtl' }]);
  }

  // Color group
  const colorGroup: any[] = [];
  if (config['color']) colorGroup.push({ 'color': [] });
  if (config['background']) colorGroup.push({ 'background': [] });
  if (colorGroup.length > 0) toolbar.push(colorGroup);

  // Media group
  const media: string[] = [];
  if (config['link'] !== false) media.push('link');
  if (config['image'] !== false) media.push('image');
  if (config['video'] !== false) media.push('video');
  if (config['formula']) media.push('formula');
  if (media.length > 0) toolbar.push(media);

  // Script group (sub/super)
  const scriptGroup: any[] = [];
  if (config['script-sub']) scriptGroup.push({ 'script': 'sub' });
  if (config['script-super']) scriptGroup.push({ 'script': 'super' });
  if (scriptGroup.length > 0) toolbar.push(scriptGroup);

  // Code group
  const codeGroup: string[] = [];
  if (config['code']) codeGroup.push('code');
  if (config['code-block']) codeGroup.push('code-block');
  if (codeGroup.length > 0) toolbar.push(codeGroup);

  // Utility group
  const utility: string[] = [];
  if (config['clean'] !== false) utility.push('clean');
  if (utility.length > 0) toolbar.push(utility);

  // Fallback if everything is disabled (safety net)
  if (toolbar.length === 0) {
    return [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ];
  }

  return toolbar;
}

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

type QuillToolbarGroup = Array<string | Record<string, string | number | boolean | Array<string | number | false>>>;
type QuillModules = {
  toolbar?: QuillToolbarGroup[];
  [key: string]: unknown;
};

type ImageBlotValue = string | {
  src?: string;
  alt?: string;
  title?: string;
  width?: string;
  height?: string;
  style?: string;
};

type ImageFormatMap = Partial<Record<'alt' | 'title' | 'width' | 'height' | 'style', string | null>>;
type QuillImageBlot = {
  domNode: HTMLElement;
  format(name: string, value: unknown): void;
};
type QuillImageBlotConstructor = {
  new (): QuillImageBlot;
  create(value: ImageBlotValue): HTMLElement;
  formats(node: HTMLElement): ImageFormatMap;
  value(node: HTMLElement): ImageBlotValue;
};

interface RichTextEditorProps {
  content: string;
  setContent: (val: string) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  placeholder?: string;
  className?: string;
  modules?: QuillModules;
}

export default function RichTextEditor({
  content,
  setContent,
  setHasUnsavedChanges,
  placeholder = "Bắt đầu nhập nội dung tại đây...",
  className = "",
  modules
}: RichTextEditorProps) {
  const [isImgEditModalOpen, setIsImgEditModalOpen] = useState(false);
  const [selectedImgNode, setSelectedImgNode] = useState<HTMLImageElement | null>(null);
  const [imgConfigData, setImgConfigData] = useState({
    src: '',
    alt: '',
    title: '',
    width: '',
    height: ''
  });

  const [activeHighlight, setActiveHighlight] = useState<{
    checkId: string;
    label: string;
    customTip?: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable ReactQuill mounting states
  const [isReady, setIsReady] = useState(false);
  const [loadedModules, setLoadedModules] = useState<QuillModules | null>(null);

  const fallbackModules = useRef<QuillModules>({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'video'],
      ['clean']
    ]
  });

  useEffect(() => {
    if (modules) {
      setLoadedModules(modules);
      setIsReady(true);
      return;
    }
    async function loadToolbarConfig() {
      try {
        const res = await fetch('/api/admin/bootstrap');
        const data = await res.json();
        if (data.success && data.settings?.editor_toolbar_config) {
          const config: Record<string, boolean> = JSON.parse(data.settings.editor_toolbar_config);
          const toolbar = buildQuillToolbar(config);
          setLoadedModules({ toolbar });
        } else {
          setLoadedModules(fallbackModules.current);
        }
      } catch (err) {
        console.error('Failed to load editor toolbar config, falling back:', err);
        setLoadedModules(fallbackModules.current);
      } finally {
        setIsReady(true);
      }
    }
    loadToolbarConfig();
  }, [modules]);

  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;
    const elList = containerRef.current.querySelectorAll('.ql-editor p, .ql-editor li, .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor img, .ql-editor a');
    elList.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.backgroundColor = '';
      htmlEl.style.borderBottom = '';
      htmlEl.style.border = '';
      htmlEl.style.borderRadius = '';
      htmlEl.style.padding = '';
      htmlEl.style.boxShadow = '';
    });
    setActiveHighlight(null);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  }, []);

  const applyHighlight = useCallback((checkId: string, label: string) => {
    // 1. Clear any active highlights first
    clearHighlights();

    if (!containerRef.current) return;
    const editor = containerRef.current.querySelector('.ql-editor');
    if (!editor) return;

    let customTip = '';
    let highlightedCount = 0;

    switch (checkId) {
      case 'sentence-len': {
        const elements = editor.querySelectorAll('p, li');
        elements.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = htmlEl.innerText || '';
          // Split by typical Vietnamese/English sentence end characters
          const sentences = text.split(/[.!?。]+/).filter(s => s.trim().length > 5);
          let hasLongSentence = false;
          
          for (const s of sentences) {
            const wordCount = s.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount > 25) {
              hasLongSentence = true;
              break;
            }
          }

          if (hasLongSentence) {
            htmlEl.style.backgroundColor = 'rgba(254, 240, 138, 0.45)'; // Soft yellow
            htmlEl.style.borderBottom = '2px dashed #ca8a04'; // Darker yellow-600
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '4px 6px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = highlightedCount > 0 
          ? `Đã tô màu ${highlightedCount} đoạn văn có chứa câu dài hơn 25 từ.` 
          : 'Không tìm thấy câu nào dài hơn 25 từ.';
        break;
      }

      case 'avg-sentence': {
        const elements = editor.querySelectorAll('p, li');
        elements.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = htmlEl.innerText || '';
          const sentences = text.split(/[.!?。]+/).filter(s => s.trim().length > 5);
          let hasLongSentence = false;
          
          for (const s of sentences) {
            const wordCount = s.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount > 20) {
              hasLongSentence = true;
              break;
            }
          }

          if (hasLongSentence) {
            htmlEl.style.backgroundColor = 'rgba(254, 240, 138, 0.45)'; // Soft yellow
            htmlEl.style.borderBottom = '2px dashed #ca8a04'; // Yellow-600
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '4px 6px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = highlightedCount > 0 
          ? `Đã tô màu ${highlightedCount} đoạn văn có chứa câu dài hơn 20 từ (làm tăng độ dài câu trung bình).` 
          : 'Không tìm thấy câu nào dài hơn 20 từ.';
        break;
      }

      case 'word-count': {
        customTip = 'Độ dài bài viết được tính trên tổng số từ của toàn bộ nội dung. Hãy bổ sung thêm nội dung chi tiết nếu bài viết quá ngắn.';
        break;
      }

      case 'headings-dist': {
        const headings = editor.querySelectorAll('h1, h2, h3, h4');
        headings.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.backgroundColor = 'rgba(238, 242, 255, 0.7)'; // Indigo-50
          htmlEl.style.border = '1px dashed #6366f1'; // Indigo-500
          htmlEl.style.borderRadius = '6px';
          htmlEl.style.padding = '6px 12px';
          htmlEl.style.transition = 'all 0.3s ease';
          highlightedCount++;
        });
        customTip = highlightedCount > 0 
          ? `Đang hiển thị ${highlightedCount} thẻ Heading phụ hiện có. Hãy phân phối thêm các tiêu đề H2, H3 để bài viết rõ ràng hơn!` 
          : 'Bài viết chưa có thẻ Heading phụ nào. Hãy sử dụng thanh công cụ để tạo tiêu đề H2, H3 chia nhỏ các ý!';
        break;
      }

      case 'p-len': {
        const paragraphs = editor.querySelectorAll('p');
        paragraphs.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = (htmlEl.innerText || '').trim();
          const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

          if (wordCount > 120) {
            htmlEl.style.backgroundColor = 'rgba(254, 226, 226, 0.55)'; // Soft red
            htmlEl.style.borderBottom = '2px dashed #ef4444'; // Red-500
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '6px 8px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = highlightedCount > 0 
          ? `Đã tô màu ${highlightedCount} đoạn văn dài hơn 120 từ.` 
          : 'Không tìm thấy đoạn văn nào dài hơn 120 từ.';
        break;
      }

      case 'list-usage': {
        const paragraphs = editor.querySelectorAll('p');
        paragraphs.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = (htmlEl.innerText || '').trim();
          // Detect manual bullets like •, -, *, +
          if (/^[•\-*+]/i.test(text)) {
            htmlEl.style.backgroundColor = 'rgba(219, 234, 254, 0.55)'; // Soft blue
            htmlEl.style.border = '1px dashed #3b82f6'; // Blue-500
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '6px 10px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = highlightedCount > 0 
          ? 'Bôi đen các dòng màu xanh này và nhấn nút Danh sách trên thanh công cụ để tạo danh sách chuẩn SEO!' 
          : 'Nên sử dụng danh sách (ul/ol) để nội dung trực quan hơn.';
        break;
      }

      case 'transition': {
        const paragraphs = editor.querySelectorAll('p, li');
        const transitionWords = [
          'tuy nhiên', 'ngoài ra', 'hơn nữa', 'bên cạnh đó', 'do đó', 'vì vậy',
          'mặt khác', 'trước hết', 'cuối cùng', 'tiếp theo', 'đặc biệt', 'chẳng hạn',
          'ví dụ', 'nói cách khác', 'tóm lại', 'kết luận', 'đầu tiên', 'thứ hai',
          'nhìn chung', 'cụ thể', 'thực tế', 'đáng chú ý', 'quan trọng hơn'
        ];
        paragraphs.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = (htmlEl.innerText || '').toLowerCase();
          if (text.length < 15) return; // Skip very short text
          
          let hasTransition = false;
          for (const tw of transitionWords) {
            if (text.includes(tw)) {
              hasTransition = true;
              break;
            }
          }

          if (!hasTransition) {
            htmlEl.style.backgroundColor = 'rgba(254, 243, 199, 0.45)'; // Soft amber
            htmlEl.style.borderBottom = '1.5px dashed #f59e0b'; // Amber-500
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '4px 6px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = highlightedCount > 0 
          ? `Tô màu ${highlightedCount} đoạn thiếu từ chuyển tiếp. Hãy thêm từ như "tuy nhiên", "ngoài ra"...` 
          : 'Mọi đoạn văn đều có sử dụng từ chuyển tiếp tốt.';
        break;
      }

      case 'img-alt':
      case 'img-alt-kw':
      case 'img-count': {
        const kwInput = document.getElementById('seo-input-keywords') as HTMLInputElement | null;
        const kw = kwInput?.value.trim().toLowerCase() || '';
        const images = editor.querySelectorAll('img');
        images.forEach(el => {
          const htmlEl = el as HTMLElement;
          const alt = htmlEl.getAttribute('alt') || '';
          const isMissingAlt = checkId === 'img-alt' && !alt.trim();
          const isMissingKeywordAlt = checkId === 'img-alt-kw' && (!kw || !alt.toLowerCase().includes(kw));
          const shouldHighlight = checkId === 'img-count' || isMissingAlt || isMissingKeywordAlt;

          if (shouldHighlight) {
            htmlEl.style.boxShadow = checkId === 'img-count'
              ? '0 0 0 4px rgba(59, 130, 246, 0.45)'
              : '0 0 0 4px rgba(239, 68, 68, 0.6)';
            htmlEl.style.border = checkId === 'img-count' ? '2px solid #3b82f6' : '2px solid #ef4444';
            htmlEl.style.borderRadius = '6px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = checkId === 'img-count'
          ? highlightedCount > 0 ? `Bài viết hiện có ${highlightedCount} ảnh.` : 'Bài viết chưa có hình ảnh. Hãy thêm ít nhất 1 ảnh minh họa.'
          : checkId === 'img-alt-kw'
            ? highlightedCount > 0 ? `Có ${highlightedCount} ảnh chưa có ALT chứa từ khóa chính.` : 'ALT ảnh đã chứa từ khóa chính.'
            : highlightedCount > 0 ? `Phát hiện ${highlightedCount} ảnh thiếu thuộc tính ALT. Nhấp đúp vào ảnh để thiết lập!` : 'Tất cả các hình ảnh đều đã được tối ưu ALT.';
        break;
      }

      case 'links':
      case 'links-internal':
      case 'links-external': {
        const links = editor.querySelectorAll('a');
        links.forEach(el => {
          const htmlEl = el as HTMLElement;
          const href = htmlEl.getAttribute('href') || '';
          const isInternal = href.startsWith('/') || href.includes('lexi.vn');
          const isExternal = /^https?:\/\//i.test(href) && !href.includes('lexi.vn');
          const shouldHighlight = checkId === 'links' || (checkId === 'links-internal' && isInternal) || (checkId === 'links-external' && isExternal);
          if (!shouldHighlight) return;

          htmlEl.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; // Emerald-100
          htmlEl.style.borderBottom = '2px solid #10b981'; // Emerald-500
          htmlEl.style.borderRadius = '2px';
          htmlEl.style.padding = '0 2px';
          htmlEl.style.transition = 'all 0.3s ease';
          highlightedCount++;
        });
        customTip = highlightedCount > 0
          ? `Đang hiển thị màu xanh lá cho ${highlightedCount} liên kết phù hợp trong bài viết.`
          : checkId === 'links-internal'
            ? 'Chưa tìm thấy liên kết nội bộ. Hãy thêm link trỏ về lexi.vn hoặc đường dẫn tương đối.'
            : checkId === 'links-external'
              ? 'Chưa tìm thấy liên kết ngoài. Hãy thêm nguồn tham khảo chất lượng nếu phù hợp.'
              : 'Bài viết chưa có liên kết nào. Hãy thêm link nội bộ hoặc link trỏ ra ngoài.';
        break;
      }

      case 'kw-content':
      case 'kw-density':
      case 'kw-h2':
      case 'kw-h3':
      case 'kw-first-100':
      case 'kw-last-100':
      case 'content-len': {
        const kwInput = document.getElementById('seo-input-keywords') as HTMLInputElement | null;
        const kw = kwInput?.value.trim().toLowerCase() || '';
        if (!kw && checkId !== 'content-len') {
          customTip = 'Chưa thiết lập Từ khóa chính. Vui lòng nhập từ khóa chính ở ô bên dưới để phân tích.';
          break;
        }

        let elements: Element[] = [];
        if (checkId === 'kw-h2') elements = Array.from(editor.querySelectorAll('h2'));
        else if (checkId === 'kw-h3') elements = Array.from(editor.querySelectorAll('h3'));
        else if (checkId === 'kw-first-100') elements = Array.from(editor.querySelectorAll('p, li, h1, h2, h3, h4')).slice(0, 3);
        else if (checkId === 'kw-last-100') elements = Array.from(editor.querySelectorAll('p, li, h1, h2, h3, h4')).slice(-3);
        else elements = Array.from(editor.querySelectorAll('p, li, h1, h2, h3, h4'));

        elements.forEach(el => {
          const htmlEl = el as HTMLElement;
          const text = (htmlEl.innerText || '').toLowerCase();
          const hasKw = kw ? text.includes(kw) : false;
          const shouldHighlight = checkId === 'content-len'
            || checkId === 'kw-density'
            || checkId === 'kw-content'
              ? hasKw
              : !hasKw;

          if (shouldHighlight) {
            htmlEl.style.backgroundColor = hasKw ? 'rgba(187, 247, 208, 0.45)' : 'rgba(254, 226, 226, 0.55)';
            htmlEl.style.borderBottom = hasKw ? '1.5px dashed #22c55e' : '1.5px dashed #ef4444';
            htmlEl.style.borderRadius = '4px';
            htmlEl.style.padding = '4px 6px';
            htmlEl.style.transition = 'all 0.3s ease';
            highlightedCount++;
          }
        });
        customTip = checkId === 'content-len'
          ? `Đang tô màu ${highlightedCount} khối nội dung để bạn mở rộng bài viết đạt tối thiểu 600 từ.`
          : highlightedCount > 0
            ? `Đã tô màu ${highlightedCount} vị trí liên quan tới từ khóa chính "${kw}".`
            : `Không tìm thấy vị trí cần tô màu cho từ khóa chính "${kw}".`;
        break;
      }

      default:
        break;
    }

    setActiveHighlight({ checkId, label, customTip });

    // Setup timeout to clear after 10s
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      clearHighlights();
    }, 10000);
  }, [clearHighlights]);

  // Register event listener for highlights
  useEffect(() => {
    const handleTriggerHighlight = (e: Event) => {
      const customEvent = e as CustomEvent<{ checkId: string; label: string }>;
      if (!customEvent.detail) return;
      const { checkId, label } = customEvent.detail;
      applyHighlight(checkId, label);
    };

    window.addEventListener('trigger-seo-highlight', handleTriggerHighlight);
    return () => {
      window.removeEventListener('trigger-seo-highlight', handleTriggerHighlight);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, [applyHighlight]);

  // Register custom image blot for Quill on client-side to preserve attributes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-quill-new').then((module) => {
        const Quill = module.Quill;
        if (Quill) {
          const BaseImage = Quill.import('formats/image') as QuillImageBlotConstructor;
          class CustomImage extends BaseImage {
            static create(value: ImageBlotValue) {
              const node = super.create(value);
              if (typeof value === 'string') {
                node.setAttribute('src', value);
              } else if (value && typeof value === 'object') {
                node.setAttribute('src', value.src || '');
                if (value.alt) node.setAttribute('alt', value.alt);
                if (value.title) node.setAttribute('title', value.title);
                if (value.width) node.setAttribute('width', value.width);
                if (value.height) node.setAttribute('height', value.height);
                if (value.style) node.setAttribute('style', value.style);
              }
              return node;
            }
            static formats(node: HTMLElement) {
              const format: ImageFormatMap = {};
              if (node.hasAttribute('alt')) format.alt = node.getAttribute('alt');
              if (node.hasAttribute('title')) format.title = node.getAttribute('title');
              if (node.hasAttribute('width')) format.width = node.getAttribute('width');
              if (node.hasAttribute('height')) format.height = node.getAttribute('height');
              if (node.hasAttribute('style')) format.style = node.getAttribute('style');
              return format;
            }
            static value(node: HTMLElement): ImageBlotValue {
              return {
                src: node.getAttribute('src') || '',
                alt: node.getAttribute('alt') || '',
                title: node.getAttribute('title') || '',
                width: node.getAttribute('width') || '',
                height: node.getAttribute('height') || '',
                style: node.getAttribute('style') || ''
              };
            }
            format(name: string, value: string | null) {
              if (['alt', 'title', 'width', 'height', 'style'].includes(name)) {
                if (value) {
                  this.domNode.setAttribute(name, value);
                } else {
                  this.domNode.removeAttribute(name);
                }
              } else {
                super.format(name, value);
              }
            }
          }
          Quill.register('formats/image', CustomImage, true);
        }
      });
    }
  }, []);
 
  // Prevent focus loss when clicking toolbar elements, pickers, or their options
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicked inside the toolbar, picker, or dropdown options, prevent default to keep focus inside the editor
      if (target.closest('.ql-toolbar') || target.closest('.ql-picker') || target.closest('.ql-picker-options')) {
        if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown, { capture: true });
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, { capture: true });
    };
  }, []);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImgNode(img);
      setImgConfigData({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        title: img.getAttribute('title') || '',
        width: img.getAttribute('width') || img.style.width || '',
        height: img.getAttribute('height') || img.style.height || ''
      });
      setIsImgEditModalOpen(true);
    }
  };

  const handleSaveImageConfig = (data: { alt: string; title: string; width: string; height: string }) => {
    if (selectedImgNode) {
      if (data.alt) selectedImgNode.setAttribute('alt', data.alt);
      else selectedImgNode.removeAttribute('alt');

      if (data.title) selectedImgNode.setAttribute('title', data.title);
      else selectedImgNode.removeAttribute('title');

      if (data.width) {
        selectedImgNode.setAttribute('width', data.width);
        selectedImgNode.style.width = data.width.endsWith('%') || data.width.endsWith('px') ? data.width : `${data.width}px`;
      } else {
        selectedImgNode.removeAttribute('width');
        selectedImgNode.style.width = '';
      }

      if (data.height) {
        selectedImgNode.setAttribute('height', data.height);
        selectedImgNode.style.height = data.height.endsWith('%') || data.height.endsWith('px') ? data.height : `${data.height}px`;
      } else {
        selectedImgNode.removeAttribute('height');
        selectedImgNode.style.height = '';
      }

      const container = selectedImgNode.closest('.ql-editor');
      if (container) {
        const newHtml = container.innerHTML;
        setContent(newHtml);
        setHasUnsavedChanges(true);
      }
    }
  };

  if (!isReady || !loadedModules) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-slate-50/50 border border-slate-200/80 rounded-xl`}>
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
        <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase animate-pulse">Khởi động trình soạn thảo...</div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor relative h-[500px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans" onClick={handleEditorClick} ref={containerRef}>
      {activeHighlight && (
        <div className="absolute top-[48px] right-4 z-10 bg-slate-900/95 text-white backdrop-blur-sm rounded-xl shadow-xl px-4 py-2.5 text-xs flex items-center gap-3 border border-slate-800 animate-fade-in font-sans pointer-events-auto">
          <span className="flex items-center gap-1.5 font-bold shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Đang tô màu: <strong className="text-indigo-300 font-extrabold">{activeHighlight.label}</strong></span>
          </span>
          {activeHighlight.customTip && (
            <span className="text-[10.5px] text-slate-300 border-l border-slate-700 pl-3 max-w-[320px] leading-relaxed font-medium">
              {activeHighlight.customTip}
            </span>
          )}
          <button
            type="button"
            onClick={clearHighlights}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors active:scale-[0.95] text-[10.5px]"
          >
            Tắt tô màu
          </button>
        </div>
      )}

      <ReactQuill 
        theme="snow" 
        value={content} 
        onChange={(val) => {
          if (val !== content) {
            setContent(val);
            if (activeHighlight) {
              clearHighlights();
            }
            const isOldEmpty = !content || content.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim() === '';
            const isNewEmpty = !val || val.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim() === '';
            if (!(isOldEmpty && isNewEmpty)) {
              setHasUnsavedChanges(true);
            }
          }
        }} 
        placeholder={placeholder}
        className={className}
        modules={loadedModules}
      />

      <ImageConfigModal 
        isOpen={isImgEditModalOpen}
        onClose={() => setIsImgEditModalOpen(false)}
        onSave={handleSaveImageConfig}
        initialData={imgConfigData}
      />
    </div>
  );
}
