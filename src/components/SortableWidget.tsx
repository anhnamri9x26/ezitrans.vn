"use client";

import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, GripVertical } from 'lucide-react';

interface SortableWidgetProps {
  id: string;
  title: string | React.ReactNode;
  children: React.ReactNode;
}

export function SortableWidget({ id, title, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`editor_widget_collapsed_${id}`);
      setIsCollapsed(saved === 'true');
    } catch (err) {
      setIsCollapsed(false);
    }
  }, [id]);

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(`editor_widget_collapsed_${id}`, String(next));
      } catch (err) {}
      return next;
    });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 min-h-[48px] border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở widget' : 'Thu gọn widget'}
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
          />
        </button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-5 truncate whitespace-nowrap">
            {title}
          </h3>
        </div>
        <button 
          type="button"
          {...attributes} 
          {...listeners} 
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:cursor-grabbing"
          title="Kéo thả để sắp xếp"
        >
          <GripVertical size={16} />
        </button>
      </div>
      {!isCollapsed && (
        <div className="p-5 bg-white dark:bg-slate-900">
          {children}
        </div>
      )}
    </div>
  );
}
