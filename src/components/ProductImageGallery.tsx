"use client";

import React, { useState } from 'react';
import { Package, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  title: string;
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center aspect-square relative p-2">
        <div className="text-slate-400 flex flex-col items-center gap-2">
          <Package size={48} className="text-slate-300" />
          <span className="text-sm font-medium">Đang cập nhật ảnh</span>
        </div>
      </div>
    );
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Main Image */}
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center aspect-square relative p-2 cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img 
          src={images[activeIndex]} 
          alt={title} 
          className="max-w-full max-h-full object-contain rounded transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Zoom Icon Overlay */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-slate-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-slate-200/50">
          <ZoomIn size={18} />
        </div>

        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-200/50 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-200/50 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg border-2 p-1 flex items-center justify-center cursor-pointer transition-colors snap-center ${
                idx === activeIndex ? 'border-[#E31B23]' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <img src={img} alt="" className="max-w-full max-h-full object-contain rounded-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
          >
            <X size={28} />
          </button>
          
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110 active:scale-95 hidden sm:block"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110 active:scale-95 hidden sm:block"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div 
            className="w-full h-full p-4 sm:p-12 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLightboxOpen(false);
            }}
          >
            <img 
              src={images[activeIndex]} 
              alt={title} 
              className="max-w-full max-h-full object-contain animate-scale-in drop-shadow-2xl"
            />
          </div>

          {/* Lightbox Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 hide-scrollbar">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 bg-black/50 rounded-lg border-2 p-1 flex items-center justify-center cursor-pointer transition-all ${
                    idx === activeIndex ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="max-w-full max-h-full object-contain rounded-sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
