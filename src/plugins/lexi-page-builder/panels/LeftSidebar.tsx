"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, Element } from '@craftjs/core';
import { LayoutGrid, Type, Image as ImageIcon, Images, Play, CreditCard, ChevronDown, ListCollapse, BookOpen, Sparkles, HelpCircle, Star, Phone, Code, Smile, Brain, Wand2, Loader2, Check, AlertCircle, Sliders, FolderOpen, Timer, Activity, Share2, FileText, Menu } from 'lucide-react';
import { usePageSettings } from '../PageSettingsContext';
import { Container } from '../components/Container';
import { GridContainer } from '../components/GridContainer';
import { TextBlock } from '../components/TextBlock';
import { HeadingBlock } from '../components/HeadingBlock';
import { ImageBlock } from '../components/ImageBlock';
import { ButtonBlock } from '../components/ButtonBlock';
import { DividerBlock } from '../components/DividerBlock';
import { VideoBlock } from '../components/VideoBlock';
import { SpacerBlock } from '../components/SpacerBlock';
import { IconBlock } from '../components/IconBlock';
import { IconListBlock } from '../components/IconListBlock';
import { AccordionBlock } from '../components/AccordionBlock';
import { HtmlBlock } from '../components/HtmlBlock';
import { TabsBlock } from '../components/TabsBlock';
import { IconBoxBlock } from '../components/IconBoxBlock';
import { ImageBoxBlock } from '../components/ImageBoxBlock';
import { CarouselBlock } from '../components/CarouselBlock';
import { CounterBlock } from '../components/CounterBlock';
import { ProgressBarBlock } from '../components/ProgressBarBlock';
import { SocialIconsBlock } from '../components/SocialIconsBlock';
import { FormBlock } from '../components/FormBlock';
import { MenuBlock } from '../components/MenuBlock';
import { PostGridBlock } from '../components/PostGridBlock';

export default function LeftSidebar() {
  const { selected, selectedId, query, actions, connectors } = useEditor((state) => {
    const [selectedId] = state.events.selected;
    const node = selectedId ? state.nodes[selectedId] : null;
    return {
      selectedId,
      selected: node ? {
        id: selectedId,
        name: node.data.displayName || node.data.name || '',
        props: node.data.props || {},
      } : null,
    };
  });

  const [activeTab, setActiveTab] = useState<'blocks' | 'sections' | 'ai'>('blocks');
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    basic: true,
    layout: true,
    advancedLayout: true,
  });

  // AI Panel states
  const [prompt, setPrompt] = useState('');
  const [sectionType, setSectionType] = useState('hero');
  const [improvePrompt, setImprovePrompt] = useState('');
  const [improvePreset, setImprovePreset] = useState('modern');
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [rewriteTone, setRewriteTone] = useState('professional');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { websiteSettings } = usePageSettings();

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab === 'blocks' || tab === 'sections' || tab === 'ai') {
        setActiveTab(tab);
      }
    };
    window.addEventListener('craft-switch-sidebar-tab', handleSwitchTab);
    return () => {
      window.removeEventListener('craft-switch-sidebar-tab', handleSwitchTab);
    };
  }, []);

  const toggleAccordion = (sec: string) => {
    setOpenAccordion(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleGenerateSection = async () => {
    if (!prompt.trim()) {
      setAiError('Vui lòng nhập mô tả cho Section cần tạo.');
      return;
    }
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const designSystem = {
        colors: websiteSettings?.colors || {},
        typography: websiteSettings?.typography || {},
        buttons: websiteSettings?.buttons || {},
        layout: websiteSettings?.layout || {},
      };
      
      const fullPrompt = `Tạo Section loại "${sectionType}". Yêu cầu: ${prompt}`;
      
      const res = await fetch('/api/page-builder/ai/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, designSystem }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi không xác định khi tạo Section.');
      }
      
      const event = new CustomEvent('craft-apply-ai-preview', {
        detail: {
          action: 'Generate',
          builderData: data.builderData,
          rootNodeId: data.rootNodeId,
        }
      });
      window.dispatchEvent(event);
      
    } catch (err: any) {
      setAiError(err.message || 'Không thể kết nối đến máy chủ.');
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getSubtreeNodes = (rootId: string) => {
    try {
      const serializedJson = query.serialize();
      const allNodes = JSON.parse(serializedJson);
      
      const result: Record<string, any> = {};
      const traverse = (id: string) => {
        const node = allNodes[id];
        if (!node) return;
        result[id] = node;
        if (node.nodes && Array.isArray(node.nodes)) {
          node.nodes.forEach(traverse);
        }
        if (node.linkedNodes) {
          Object.values(node.linkedNodes).forEach((childId: any) => traverse(childId));
        }
      };
      traverse(rootId);
      return result;
    } catch (err) {
      console.error("Failed to extract subtree:", err);
      return {};
    }
  };

  const handleImproveSection = async () => {
    if (!selectedId) {
      setAiError('Vui lòng chọn một Vùng chứa trên canvas trước.');
      return;
    }
    
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const designSystem = {
        colors: websiteSettings?.colors || {},
        typography: websiteSettings?.typography || {},
        buttons: websiteSettings?.buttons || {},
        layout: websiteSettings?.layout || {},
      };
      
      const sectionNodes = getSubtreeNodes(selectedId);
      const presetLabels: Record<string, string> = {
        modern: 'Làm giao diện hiện đại & cao cấp hơn',
        mobile: 'Tối ưu hóa bố cục & khoảng cách di động',
        cta: 'Thêm hiệu ứng nổi bật & CTA',
        minimal: 'Thiết kế tối giản thanh lịch'
      };
      
      const combinedPrompt = `${presetLabels[improvePreset] || 'Cải tiến giao diện'}. ${improvePrompt ? `Yêu cầu thêm: ${improvePrompt}` : ''}`;
      
      const res = await fetch('/api/page-builder/ai/improve-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNodes,
          rootNodeId: selectedId,
          prompt: combinedPrompt,
          designSystem,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi không xác định khi cải tiến Section.');
      }
      
      const event = new CustomEvent('craft-apply-ai-preview', {
        detail: {
          action: 'Improve',
          builderData: data.builderData,
          rootNodeId: data.rootNodeId,
        }
      });
      window.dispatchEvent(event);
      
    } catch (err: any) {
      setAiError(err.message || 'Không thể kết nối đến máy chủ.');
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleRewriteContent = async () => {
    if (!selectedId) {
      setAiError('Vui lòng chọn một khối chữ (Văn bản/Tiêu đề/Nút bấm) trước.');
      return;
    }
    
    const currentText = selected?.props?.text || '';
    if (!currentText.trim()) {
      setAiError('Khối được chọn hiện không có văn bản nào.');
      return;
    }
    
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const toneLabels: Record<string, string> = {
        professional: 'Viết lại với giọng văn chuyên nghiệp & tin cậy',
        friendly: 'Viết lại với giọng văn thân thiện & gần gũi',
        cta: 'Viết lại theo phong cách hấp dẫn & kích thích mua hàng (CTA)',
        concise: 'Viết lại ngắn gọn & súc tích hơn'
      };
      
      const combinedPrompt = `${toneLabels[rewriteTone] || 'Viết lại văn bản'}. ${rewritePrompt ? `Yêu cầu thêm: ${rewritePrompt}` : ''}`;
      
      const res = await fetch('/api/page-builder/ai/rewrite-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentText,
          prompt: combinedPrompt,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi không xác định khi viết lại văn bản.');
      }
      
      const event = new CustomEvent('craft-apply-ai-preview', {
        detail: {
          action: 'Rewrite',
          text: data.text,
        }
      });
      window.dispatchEvent(event);
      
    } catch (err: any) {
      setAiError(err.message || 'Không thể kết nối đến máy chủ.');
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 text-[10px] font-bold text-slate-400 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${
            activeTab === 'blocks'
              ? 'border-brand-500 text-brand-600 bg-white font-black'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <LayoutGrid size={11} /> Thành phần
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${
            activeTab === 'sections'
              ? 'border-brand-500 text-brand-600 bg-white font-black'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Sparkles size={11} /> Khối thiết kế
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${
            activeTab === 'ai'
              ? 'border-brand-500 text-brand-600 bg-white font-black'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Brain className="text-purple-500" size={11} /> AI Assistant
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
        
        {/* TAB 1: BASIC DRAGGABLE BLOCKS */}
        {activeTab === 'blocks' && (
          <div className="space-y-4 animate-fade-in">
            {/* Layout group */}
            <div>
              <button
                onClick={() => toggleAccordion('layout')}
                className="w-full flex items-center justify-between font-bold text-slate-700 py-1 border-b border-slate-100 uppercase tracking-wider text-[9px] mb-2 cursor-pointer"
              >
                <span>Bố cục & Grid</span>
                <ChevronDown size={11} className={`transform transition-transform ${openAccordion.layout ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion.layout && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {/* Container block (Row/Col empty) */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <Element is={Container} canvas />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Khung chứa</p>
                  </div>

                  {/* 2 Column container */}
                  <div
                    ref={(ref) => {
                      if (ref) {
                        connectors.create(
                          ref,
                          <Element is={Container} flexDirection="row" gap="16px" canvas>
                            <Element is={Container} canvas />
                            <Element is={Container} canvas />
                          </Element>
                        );
                      }
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors flex gap-1 items-center h-6">
                      <div className="w-2.5 h-5 bg-slate-300 group-hover:bg-brand-400 rounded-sm transition-colors"></div>
                      <div className="w-2.5 h-5 bg-slate-300 group-hover:bg-brand-400 rounded-sm transition-colors"></div>
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">2 Cột</p>
                  </div>

                  {/* 3 Column container */}
                  <div
                    ref={(ref) => {
                      if (ref) {
                        connectors.create(
                          ref,
                          <Element is={Container} flexDirection="row" gap="12px" canvas>
                            <Element is={Container} canvas />
                            <Element is={Container} canvas />
                            <Element is={Container} canvas />
                          </Element>
                        );
                      }
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors flex gap-1 items-center h-6">
                      <div className="w-2 h-5 bg-slate-300 group-hover:bg-brand-400 rounded-sm transition-colors"></div>
                      <div className="w-2 h-5 bg-slate-300 group-hover:bg-brand-400 rounded-sm transition-colors"></div>
                      <div className="w-2 h-5 bg-slate-300 group-hover:bg-brand-400 rounded-sm transition-colors"></div>
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">3 Cột</p>
                  </div>

                  {/* Grid Container block */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <Element is={GridContainer} canvas />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-fuchsia-500 hover:shadow-sm hover:shadow-fuchsia-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-fuchsia-500 transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-fuchsia-600 transition-colors">Lưới (Grid)</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggleAccordion('basic')}
                className="w-full flex items-center justify-between font-bold text-slate-700 py-1 border-b border-slate-100 uppercase tracking-wider text-[9px] mb-2 cursor-pointer"
              >
                <span>Thành phần nội dung</span>
                <ChevronDown size={11} className={`transform transition-transform ${openAccordion.basic ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion.basic && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {/* Heading */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <HeadingBlock text="Tiêu đề mới" level="h2" />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors font-black text-lg h-6 flex items-center justify-center">
                      H
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Tiêu đề</p>
                  </div>

                  {/* TextBlock */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <TextBlock text="Nhấp đúp chuột vào đây để sửa đoạn văn. Bạn có thể sử dụng công cụ bên phải để thay đổi phông chữ, kích thước, màu sắc và nhiều tùy chỉnh khác. Công cụ dựng trang giúp bạn dễ dàng tạo ra những đoạn văn bản đẹp mắt và chuyên nghiệp chỉ bằng vài thao tác đơn giản." />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Type size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Văn bản</p>
                  </div>

                  {/* Image */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <ImageBlock url="" />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <ImageIcon size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Hình ảnh</p>
                  </div>

                  {/* Button */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <ButtonBlock text="Nhấp đúp để sửa" />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <CreditCard size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Nút bấm</p>
                  </div>

                  {/* Divider */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <DividerBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors h-6 flex items-center justify-center">
                      <div className="w-8 h-[2px] bg-slate-300 group-hover:bg-brand-400 transition-colors rounded"></div>
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Đường kẻ</p>
                  </div>

                  {/* Video */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <VideoBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Play size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Nhúng Video</p>
                  </div>

                  {/* Spacer */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <SpacerBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors flex flex-col gap-1 justify-center items-center h-6">
                      <div className="w-6 h-0.5 bg-slate-300 group-hover:bg-brand-400 transition-colors"></div>
                      <div className="w-6 h-0.5 bg-slate-300 group-hover:bg-brand-400 transition-colors"></div>
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Khoảng trống</p>
                  </div>

                  {/* Icon */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <IconBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Smile size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Biểu tượng</p>
                  </div>

                  {/* Icon mạng xã hội */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <SocialIconsBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Share2 size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Icon mạng xã hội</p>
                  </div>

                  {/* Biểu mẫu (Form) */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <FormBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <FileText size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Biểu mẫu (Form)</p>
                  </div>

                  {/* Menu */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <MenuBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Menu size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Menu</p>
                  </div>

                  {/* Danh sách bài viết */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <PostGridBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Ds Bài Viết</p>
                  </div>

                  {/* Hộp Icon */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <IconBoxBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <HelpCircle size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Hộp Icon</p>
                  </div>

                  {/* Hộp hình ảnh */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <ImageBoxBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Images size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Hộp hình ảnh</p>
                  </div>

                  {/* Băng chuyền hình ảnh */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <CarouselBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Images size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Băng chuyền hình ảnh</p>
                  </div>

                  {/* Bộ đếm */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <CounterBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Timer size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Bộ đếm</p>
                  </div>

                  {/* Thanh tiến trình */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <ProgressBarBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Activity size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Thanh tiến trình</p>
                  </div>

                  {/* List */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <IconListBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <ListCollapse size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Danh sách</p>
                  </div>

                  {/* Accordion */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <AccordionBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <ChevronDown size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Sập mở (FAQ)</p>
                  </div>

                  {/* Tabs */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <TabsBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <FolderOpen size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Tabs</p>
                  </div>

                  {/* Custom HTML */}
                  <div
                    ref={(ref) => {
                      if (ref) connectors.create(ref, <HtmlBlock />);
                    }}
                    className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
                  >
                    <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
                      <Code size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Mã HTML</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRE-MADE corporate DESIGN SECTIONS */}
        {activeTab === 'sections' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* HERO SECTION BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="var(--site-layout-section-spacing, 80px)"
                      paddingBottom="var(--site-layout-section-spacing, 80px)"
                      backgroundColor="#0f172a"
                      borderRadius="16px"
                      alignItems="center"
                      justifyContent="center"
                      gap="24px"
                      canvas
                    >
                      <HeadingBlock
                        text="DỊCH VỤ VẬN CHUYỂN VIỆT - TRUNG CHUYÊN NGHIỆP"
                        level="h1"
                        fontSize="36px"
                        fontWeight="800"
                        textAlign="center"
                        textColor="#ffffff"
                        marginBottom="12px"
                      />
                      <TextBlock
                        text="Lexi mang đến giải pháp tối ưu nguồn hàng, vận chuyển an toàn tốc độ từ mọi tỉnh thành Trung Quốc về Việt Nam với mức cước phí siêu cạnh tranh."
                        textAlign="center"
                        fontSize="16px"
                        textColor="#94a3b8"
                        maxWidth="700px"
                      />
                      <Element is={Container} flexDirection="row" gap="16px" justifyContent="center" width="auto" canvas>
                        <ButtonBlock text="Tạo đơn hàng ngay" backgroundColor="#3b82f6" textColor="#ffffff" />
                        <ButtonBlock text="Bảng giá cước" backgroundColor="transparent" textColor="#ffffff" borderRadius="8px" borderWidth="1px" borderColor="#cbd5e1" />
                      </Element>
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-slate-900 rounded-lg text-white font-black text-[9px] shadow-sm">HERO</div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Khối Hero (Đầu trang)</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Tiêu đề lớn, CTA & Nút bấm đẹp</p>
              </div>
            </div>

            {/* SERVICES SECTION BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="var(--site-layout-section-spacing, 60px)"
                      paddingBottom="var(--site-layout-section-spacing, 60px)"
                      backgroundColor="#f8fafc"
                      borderRadius="12px"
                      alignItems="center"
                      gap="32px"
                      canvas
                    >
                      <Element is={Container} alignItems="center" gap="8px" width="100%" canvas>
                        <HeadingBlock
                          text="DỊCH VỤ CỦA CHÚNG TÔI"
                          level="h2"
                          fontSize="28px"
                          fontWeight="800"
                          textAlign="center"
                          textColor="#1e293b"
                        />
                        <TextBlock
                          text="Lựa chọn phương thức tối ưu cho nhu cầu kinh doanh hàng hóa của bạn"
                          textAlign="center"
                          fontSize="14px"
                          textColor="#64748b"
                        />
                      </Element>

                      <Element is={Container} flexDirection="row" gap="16px" width="100%" canvas>
                        {/* Service 1 */}
                        <Element is={Container} backgroundColor="#ffffff" borderRadius="12px" paddingLeft="20px" paddingRight="20px" paddingTop="24px" paddingBottom="24px" width="33.3%" shadow="sm" canvas>
                          <HeadingBlock text="Vận chuyển chính ngạch" level="h3" fontSize="18px" fontWeight="700" textColor="#3b82f6" />
                          <TextBlock text="Khai báo tờ khai thông quan đầy đủ, cam kết xuất hóa đơn VAT, hỗ trợ thủ tục từ A-Z đảm bảo pháp lý an toàn tuyệt đối." fontSize="13px" textColor="#64748b" />
                        </Element>
                        {/* Service 2 */}
                        <Element is={Container} backgroundColor="#ffffff" borderRadius="12px" paddingLeft="20px" paddingRight="20px" paddingTop="24px" paddingBottom="24px" width="33.3%" shadow="sm" canvas>
                          <HeadingBlock text="Vận chuyển tiểu ngạch" level="h3" fontSize="18px" fontWeight="700" textColor="#3b82f6" />
                          <TextBlock text="Ghép xe tải thông quan nhanh gọn, cước phí siêu tiết kiệm phù hợp cho các hộ kinh doanh cá thể nhỏ lẻ." fontSize="13px" textColor="#64748b" />
                        </Element>
                        {/* Service 3 */}
                        <Element is={Container} backgroundColor="#ffffff" borderRadius="12px" paddingLeft="20px" paddingRight="20px" paddingTop="24px" paddingBottom="24px" width="33.3%" shadow="sm" canvas>
                          <HeadingBlock text="Mua hộ & Tìm nguồn hàng" level="h3" fontSize="18px" fontWeight="700" textColor="#3b82f6" />
                          <TextBlock text="Hỗ trợ đàm phán trực tiếp với xưởng trên Taobao, 1688, Tmall để có mức giá buôn tận gốc cực rẻ." fontSize="13px" textColor="#64748b" />
                        </Element>
                      </Element>
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-blue-500 rounded-lg text-white font-black text-[9px] shadow-sm"><BookOpen size={12} /></div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Dịch vụ (Grid 3 Cột)</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Khối giới thiệu dịch vụ doanh nghiệp</p>
              </div>
            </div>

            {/* USPs SECTION BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="var(--site-layout-section-spacing, 60px)"
                      paddingBottom="var(--site-layout-section-spacing, 60px)"
                      backgroundColor="#ffffff"
                      alignItems="center"
                      gap="32px"
                      canvas
                    >
                      <HeadingBlock
                        text="TẠI SAO NÊN CHỌN LEXI?"
                        level="h2"
                        fontSize="28px"
                        fontWeight="800"
                        textAlign="center"
                        textColor="#1e293b"
                      />
                      <Element is={Container} flexDirection="row" gap="20px" width="100%" canvas>
                        {/* USP 1 */}
                        <Element is={Container} gap="8px" canvas>
                          <HeadingBlock text="⚡ Vận chuyển siêu tốc" level="h4" fontSize="18px" fontWeight="700" textColor="#0f172a" />
                          <TextBlock text="Thời gian hàng về Hà Nội chỉ từ 2-4 ngày, về Sài Gòn chỉ từ 5-7 ngày kể từ khi kho Trung Quốc nhận hàng." fontSize="13px" textColor="#475569" />
                        </Element>
                        {/* USP 2 */}
                        <Element is={Container} gap="8px" canvas>
                          <HeadingBlock text="🛡️ Bảo hiểm hàng hóa 100%" level="h4" fontSize="18px" fontWeight="700" textColor="#0f172a" />
                          <TextBlock text="Hỗ trợ đền bù đầy đủ 100% giá trị đơn hàng nếu có xảy ra rủi ro thất thoát hoặc hư hỏng trong quá trình vận tải." fontSize="13px" textColor="#475569" />
                        </Element>
                      </Element>
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-emerald-500 rounded-lg text-white font-black text-[9px] shadow-sm"><ListCollapse size={12} /></div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Lý do chọn (USPs)</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Khối giới thiệu ưu thế công ty</p>
              </div>
            </div>

            {/* CALL TO ACTION BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="48px"
                      paddingBottom="48px"
                      paddingLeft="32px"
                      paddingRight="32px"
                      backgroundGradient="linear-gradient(135deg, #1e3a8a, #3b82f6)"
                      borderRadius="12px"
                      alignItems="center"
                      gap="16px"
                      canvas
                    >
                      <HeadingBlock
                        text="Bắt đầu nhập hàng Trung Quốc ngay hôm nay!"
                        level="h2"
                        fontSize="26px"
                        fontWeight="800"
                        textAlign="center"
                        textColor="#ffffff"
                      />
                      <TextBlock
                        text="Đăng ký tài khoản hệ thống Lexi hoàn toàn miễn phí để bắt đầu theo dõi hành trình đơn hàng chuyên nghiệp."
                        textAlign="center"
                        fontSize="14px"
                        textColor="#93c5fd"
                        maxWidth="600px"
                      />
                      <ButtonBlock text="Đăng ký tài khoản" backgroundColor="#ffffff" textColor="#1e3a8a" />
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-indigo-500 rounded-lg text-white font-black text-[9px] shadow-sm"><Phone size={12} /></div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">CTA (Lời kêu gọi)</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Khối đăng ký/liên hệ có dải gradient</p>
              </div>
            </div>

            {/* PRICING TABLE BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="var(--site-layout-section-spacing, 60px)"
                      paddingBottom="var(--site-layout-section-spacing, 60px)"
                      backgroundColor="#f8fafc"
                      alignItems="center"
                      gap="32px"
                      canvas
                    >
                      <HeadingBlock
                        text="BẢNG CƯỚC PHÍ DỊCH VỤ"
                        level="h2"
                        fontSize="28px"
                        fontWeight="800"
                        textColor="#1e293b"
                      />
                      <Element is={Container} flexDirection="row" gap="16px" width="100%" canvas>
                        {/* Plan 1 */}
                        <Element is={Container} backgroundColor="#ffffff" borderRadius="12px" paddingLeft="20px" paddingRight="20px" paddingTop="24px" paddingBottom="24px" borderWidth="1px" borderColor="#e2e8f0" canvas>
                          <HeadingBlock text="Vận chuyển Lẻ (Ký gửi)" level="h3" fontSize="18px" fontWeight="700" textColor="#334155" />
                          <HeadingBlock text="Từ 12.000đ / kg" level="h4" fontSize="24px" fontWeight="850" textColor="#3b82f6" />
                          <TextBlock text="Dành cho gom hàng nhỏ lẻ, hàng shop online từ Taobao/1688 về." fontSize="13px" textColor="#64748b" />
                          <ButtonBlock text="Xem chi tiết" backgroundColor="#64748b" />
                        </Element>
                        {/* Plan 2 */}
                        <Element is={Container} backgroundColor="#ffffff" borderRadius="12px" paddingLeft="20px" paddingRight="20px" paddingTop="24px" paddingBottom="24px" borderWidth="2px" borderColor="#3b82f6" canvas>
                          <HeadingBlock text="Vận chuyển Lô (Đại lý)" level="h3" fontSize="18px" fontWeight="700" textColor="#0f172a" />
                          <HeadingBlock text="Chỉ từ 8.000đ / kg" level="h4" fontSize="24px" fontWeight="850" textColor="#3b82f6" />
                          <TextBlock text="Dành cho nhà phân phối ôm lô sỉ lớn, bao trọn container ghép tải." fontSize="13px" textColor="#64748b" />
                          <ButtonBlock text="Liên hệ báo giá lô" backgroundColor="#3b82f6" />
                        </Element>
                      </Element>
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-yellow-500 rounded-lg text-white font-black text-[9px] shadow-sm"><Star size={12} /></div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Bảng giá cước</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Khối so sánh 2 bảng giá vận chuyển</p>
              </div>
            </div>

            {/* FAQS ACCORDION BLOCK */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={Container}
                      paddingTop="var(--site-layout-section-spacing, 60px)"
                      paddingBottom="var(--site-layout-section-spacing, 60px)"
                      backgroundColor="#ffffff"
                      alignItems="center"
                      gap="24px"
                      canvas
                    >
                      <HeadingBlock
                        text="CÂU HỎI THƯỜNG GẶP (FAQ)"
                        level="h2"
                        fontSize="28px"
                        fontWeight="800"
                        textColor="#1e293b"
                        marginBottom="12px"
                      />
                      <Element is={Container} width="100%" gap="12px" canvas>
                        {/* FAQ 1 */}
                        <Element is={Container} paddingLeft="16px" paddingRight="16px" paddingTop="16px" paddingBottom="16px" backgroundColor="#f8fafc" borderRadius="8px" canvas>
                          <HeadingBlock text="Thời gian vận chuyển trung bình là bao lâu?" level="h4" fontSize="15px" fontWeight="700" textColor="#1e293b" />
                          <TextBlock text="Khoảng từ 2-4 ngày về Hà Nội và từ 5-7 ngày về Thành phố Hồ Chí Minh, tính từ lúc kho hàng tại Bằng Tường hoặc Quảng Châu ký nhận hàng." fontSize="13px" textColor="#475569" />
                        </Element>
                        {/* FAQ 2 */}
                        <Element is={Container} paddingLeft="16px" paddingRight="16px" paddingTop="16px" paddingBottom="16px" backgroundColor="#f8fafc" borderRadius="8px" canvas>
                          <HeadingBlock text="Lexi có cung cấp dịch vụ thông quan chính ngạch không?" level="h4" fontSize="15px" fontWeight="700" textColor="#1e293b" />
                          <TextBlock text="Có, chúng tôi chuyên cung cấp giải pháp khai báo hải quan, xuất hóa đơn đỏ VAT đầy đủ, hỗ trợ nộp thuế nhập khẩu chuẩn chỉ cho doanh nghiệp." fontSize="13px" textColor="#475569" />
                        </Element>
                      </Element>
                    </Element>
                  );
                }
              }}
              className="p-3 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 rounded-xl cursor-grab transition-all bg-slate-50/30 flex items-center gap-3 select-none group"
            >
              <div className="p-2 bg-purple-500 rounded-lg text-white font-black text-[9px] shadow-sm"><HelpCircle size={12} /></div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Câu hỏi thường gặp</p>
                <p className="text-[8px] text-slate-400 mt-0.5">Khối FAQ liệt kê câu hỏi & câu trả lời</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-fade-in font-sans pb-6">
            {/* Header Glass Card */}
            <div className="p-3 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-md">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">AI Assistant</h3>
                <p className="text-[9px] text-slate-500 font-medium">Đồng hành thiết kế bằng trí tuệ nhân tạo</p>
              </div>
            </div>

            {/* Error Notification */}
            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2.5 text-[10px] font-semibold">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                <div>{aiError}</div>
              </div>
            )}

            {/* If loading state */}
            {isLoadingAI && (
              <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
                <Loader2 size={24} className="animate-spin text-purple-600" />
                <div>
                  <p className="font-bold text-slate-700 text-[10px]">AI đang thiết kế...</p>
                  <p className="text-[8px] text-slate-400 mt-1">Quá trình này có thể mất vài giây. Vui lòng không tắt trình duyệt.</p>
                </div>
              </div>
            )}

            {!isLoadingAI && (
              <div className="space-y-4">
                {/* 1. Generate Section Form (Always available) */}
                <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px] border-b border-slate-100 pb-1.5">
                    <Sparkles size={11} className="text-purple-500" />
                    <span>Tạo Section Mới</span>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-500 uppercase tracking-wider">Loại Section</label>
                      <select
                        value={sectionType}
                        onChange={(e) => setSectionType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-700 outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="hero">Khối Đầu Trang (Hero Section)</option>
                        <option value="services">Dịch vụ (Services Grid)</option>
                        <option value="usps">Lý do chọn (Features/USPs)</option>
                        <option value="cta">Kêu gọi hành động (Call To Action)</option>
                        <option value="pricing">Bảng giá cước (Pricing Table)</option>
                        <option value="faq">Câu hỏi thường gặp (FAQ)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-500 uppercase tracking-wider">Mô tả mong muốn</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ví dụ: Một khối giới thiệu dịch vụ vận chuyển chính ngạch Việt Trung, có 3 cột, màu chủ đạo xanh lam, chữ trắng, có nút CTA..."
                        rows={4}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateSection}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-lg text-[10px] shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none active:scale-[0.98]"
                    >
                      <Sparkles size={11} />
                      Tạo khối bằng AI
                    </button>
                  </div>
                </div>

                {/* 2. Selection-dependent panels */}
                
                {/* 2.1 Container Selected -> Improve Layout */}
                {selected && selected.name === 'Vùng chứa' && (
                  <div className="p-3.5 bg-purple-50/20 border border-purple-100/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-100/40 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                        <Sliders size={11} className="text-purple-500" />
                        <span>Cải tiến Layout hiện tại</span>
                      </div>
                      <span className="text-[8px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-md">Vùng chứa</span>
                    </div>

                    <div className="space-y-2 text-[10px]">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500 uppercase tracking-wider">Phong cách cải tiến</label>
                        <select
                          value={improvePreset}
                          onChange={(e) => setImprovePreset(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-lg p-2 text-[10px] font-bold text-slate-700 outline-none focus:border-purple-500 transition-colors"
                        >
                          <option value="modern">Làm giao diện hiện đại & cao cấp hơn</option>
                          <option value="mobile">Tối ưu hóa bố cục & khoảng cách di động</option>
                          <option value="cta">Thêm hiệu ứng nổi bật & CTA</option>
                          <option value="minimal">Thiết kế tối giản thanh lịch</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500 uppercase tracking-wider">Yêu cầu thêm (Tùy chọn)</label>
                        <textarea
                          value={improvePrompt}
                          onChange={(e) => setImprovePrompt(e.target.value)}
                          placeholder="Ví dụ: Thay đổi nút thành màu đỏ cam, chỉnh khoảng cách gọn hơn..."
                          rows={2}
                          className="w-full p-2 bg-white border border-purple-200 rounded-lg text-[10px] font-medium text-slate-700 outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleImproveSection}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold rounded-lg text-[10px] shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none active:scale-[0.98]"
                      >
                        <Wand2 size={11} />
                        Cải tiến bằng AI
                      </button>
                    </div>
                  </div>
                )}

                {/* 2.2 Text Component Selected -> Rewrite Copywriting */}
                {selected && (selected.name === 'Văn bản' || selected.name === 'Tiêu đề' || selected.name === 'Nút bấm') && (
                  <div className="p-3.5 bg-blue-50/20 border border-blue-100/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-100/40 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                        <Type size={11} className="text-blue-500" />
                        <span>Viết lại nội dung (Copywriting)</span>
                      </div>
                      <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">{selected.name}</span>
                    </div>

                    <div className="space-y-2 text-[10px]">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-medium text-slate-500 max-h-[80px] overflow-y-auto">
                        <span className="font-bold text-[8px] block uppercase text-slate-400 mb-0.5">Văn bản hiện tại:</span>
                        "{selected.props?.text || ''}"
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500 uppercase tracking-wider">Giọng văn mục tiêu</label>
                        <select
                          value={rewriteTone}
                          onChange={(e) => setRewriteTone(e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded-lg p-2 text-[10px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="professional">Chuyên nghiệp & Tin cậy</option>
                          <option value="friendly">Thân thiện & Gần gũi</option>
                          <option value="cta">Hấp dẫn & Kích thích hành động (CTA)</option>
                          <option value="concise">Ngắn gọn & Súc tích</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500 uppercase tracking-wider">Yêu cầu cụ thể (Tùy chọn)</label>
                        <textarea
                          value={rewritePrompt}
                          onChange={(e) => setRewritePrompt(e.target.value)}
                          placeholder="Ví dụ: Nhấn mạnh vào dịch vụ hỏa tốc chỉ 2 ngày..."
                          rows={2}
                          className="w-full p-2 bg-white border border-blue-200 rounded-lg text-[10px] font-medium text-slate-700 outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleRewriteContent}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-lg text-[10px] shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none active:scale-[0.98]"
                      >
                        <Wand2 size={11} />
                        Viết lại bằng AI
                      </button>
                    </div>
                  </div>
                )}

                {/* Helper notice if no contextual node is selected */}
                {(!selected || (selected.name !== 'Vùng chứa' && selected.name !== 'Văn bản' && selected.name !== 'Tiêu đề' && selected.name !== 'Nút bấm')) && (
                  <div className="p-3 bg-amber-50/30 border border-amber-100/50 rounded-2xl text-[9px] text-slate-500 font-medium leading-relaxed">
                    💡 <strong>Gợi ý nhanh:</strong> Nhấp chọn một <strong>Vùng chứa (Container)</strong> hoặc một <strong>khối chữ (Tiêu đề/Văn bản/Nút bấm)</strong> trên trang để kích hoạt thêm tính năng <strong>Cải tiến Layout</strong> hoặc <strong>Viết lại nội dung bằng AI</strong> tương ứng.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
