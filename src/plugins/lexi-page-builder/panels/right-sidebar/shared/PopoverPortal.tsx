"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * A portal-based popover that renders its children into document.body,
 * positioned next to a trigger element. This escapes all overflow:hidden
 * ancestors, solving z-index stacking issues in scrollable sidebars.
 */
export function PopoverPortal({
  isOpen,
  onClose,
  anchorRef,
  children,
  placement = 'bottom-right',
  width = 260,
}: {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  placement?: 'bottom-right' | 'bottom-left' | 'left';
  width?: number;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();

    let top = rect.bottom + 4;
    let left = rect.right - width;

    if (placement === 'bottom-left') {
      left = rect.left;
    } else if (placement === 'left') {
      left = rect.left - width - 4;
      top = rect.top;
    }

    // Clamp to viewport
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    if (left < 8) left = 8;
    if (left + width > vw - 8) left = vw - width - 8;
    if (top + 300 > vh) top = rect.top - 300 - 4; // flip upward if overflowing

    setCoords({ top, left });
  }, [anchorRef, placement, width]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    // Listen to scroll on all ancestors
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    // Use capture to intercept early
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: 99999,
        width,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
