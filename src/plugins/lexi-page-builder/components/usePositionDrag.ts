"use client";

import React from 'react';
import { CommonLayoutProps } from './LayoutHelper';

type SetProp = (cb: (props: any) => void, throttleRate?: number) => void;

interface UsePositionDragOptions {
  id: string;
  enabled: boolean;
  isLocked: boolean;
  props: CommonLayoutProps;
  setProp: SetProp;
}

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], .ql-editor'));
};

const readPx = (value?: string) => {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const usePositionDrag = ({ id, enabled, isLocked, props, setProp }: UsePositionDragOptions) => {
  const isPositioned = props.position === 'absolute' || props.position === 'fixed';

  const handlePositionMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (!enabled || isLocked || !isPositioned) return false;
    if (event.button !== 0 || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return false;
    if (isInteractiveTarget(event.target)) return false;

    const element = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const elementRect = element.getBoundingClientRect();
    const parentRect = props.position === 'absolute'
      ? element.offsetParent?.getBoundingClientRect()
      : null;

    const originLeft = props.horizontalAlign === 'right'
      ? elementRect.left - (parentRect?.left || 0)
      : (props.left ? readPx(props.left) : elementRect.left - (parentRect?.left || 0));
    const originTop = props.verticalAlign === 'bottom'
      ? elementRect.top - (parentRect?.top || 0)
      : (props.top ? readPx(props.top) : elementRect.top - (parentRect?.top || 0));

    event.preventDefault();
    event.stopPropagation();

    document.body.style.userSelect = 'none';
    window.dispatchEvent(new CustomEvent('craft-position-drag-start', { detail: id }));

    const handleMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const nextLeft = Math.round(originLeft + moveEvent.clientX - startX);
      const nextTop = Math.round(originTop + moveEvent.clientY - startY);

      setProp((draft) => {
        draft.left = `${nextLeft}px`;
        draft.top = `${nextTop}px`;
        draft.right = '';
        draft.bottom = '';
        draft.horizontalAlign = 'left';
        draft.verticalAlign = 'top';
      }, 16);
    };

    const handleUp = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.dispatchEvent(new CustomEvent('craft-position-drag-end', { detail: id }));
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return true;
  };

  return {
    isPositionDragEnabled: isPositioned,
    handlePositionMouseDown,
  };
};
