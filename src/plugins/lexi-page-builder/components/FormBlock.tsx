"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import * as Lucide from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'select' | 'checkbox' | 'radio' | 'url' | 'step';
  label: string;
  placeholder?: string;
  required?: boolean;
  columnWidth?: string; // e.g. "100%", "50%", "33%"
  options?: string; // Options for select, checkbox, radio (one per line)
}

export interface FormBlockProps extends CommonLayoutProps {
  formName?: string;
  fields?: FormField[];
  inputSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showRequiredMark?: boolean;

  // Buttons Configuration
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  buttonColumnWidth?: string; // "100%", "50%", "33%", "25%"
  buttonText?: string;
  buttonNextText?: string;
  buttonPrevText?: string;
  buttonIconName?: string;
  buttonIconPosition?: 'left' | 'right';
  buttonIconSpacing?: string;
  buttonId?: string;

  // Actions after submit
  actionsAfterSubmit?: string[];
  collectMetadata?: string[];
  emailTo?: string;
  emailSubject?: string;
  emailMessage?: string;
  emailFromEmail?: string;
  emailFromName?: string;
  emailReplyTo?: string;
  emailCc?: string;
  emailBcc?: string;
  emailMetadata?: string[];
  emailSendAs?: 'html' | 'plain';
  redirectUrl?: string;
  webhookUrl?: string;

  // Steps indicator configuration
  stepType?: 'number_text' | 'number' | 'text' | 'icon' | 'progress_bar' | 'none';
  stepShape?: 'circle' | 'square' | 'rounded' | 'none';

  // Additional options
  customFormId?: string;
  formValidation?: 'browser' | 'custom';
  customMessagesEnabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  requiredMessage?: string;
  invalidMessage?: string;

  // Styles: Gaps
  columnsGap?: string;
  rowsGap?: string;

  // Styles: Labels
  labelSpacing?: string;
  labelColor?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  labelFontFamily?: string;

  // Styles: HTML Fields
  fieldSpacing?: string;
  fieldColor?: string;
  fieldFontSize?: string;
  fieldFontWeight?: string;
  fieldFontFamily?: string;

  // Styles: Field container
  fieldBgColor?: string;
  fieldTextColor?: string;
  fieldBorderColor?: string;
  fieldBorderWidth?: string;
  fieldBorderRadius?: string;
  fieldPadding?: string;
  fieldBgColorFocus?: string;
  fieldBorderColorFocus?: string;

  // Styles: Button
  btnPosition?: 'left' | 'center' | 'right' | 'justify';
  btnAlignment?: 'start' | 'center' | 'end' | 'stretch';
  btnFontFamily?: string;
  btnFontSize?: string;
  btnFontWeight?: string;
  btnBorderType?: 'none' | 'solid' | 'double' | 'dotted' | 'dashed';
  btnBorderRadius?: string;
  btnPadding?: string;

  btnNormalBgColor?: string;
  btnNormalTextColor?: string;
  btnHoverBgColor?: string;
  btnHoverTextColor?: string;

  btnPrevBgColor?: string;
  btnPrevTextColor?: string;

  // Styles: Messages
  msgFontFamily?: string;
  msgFontSize?: string;
  msgFontWeight?: string;
  msgSuccessColor?: string;
  msgErrorColor?: string;
  msgInlineColor?: string;

  // Styles: Steps
  stepFontFamily?: string;
  stepFontSize?: string;
  stepFontWeight?: string;
  stepSpacing?: string;
  stepPadding?: string;
  stepDividerWidth?: string;
  stepDividerGap?: string;

  // Label extra typography props
  labelFontStyle?: string;
  labelLineHeight?: string;
  labelLetterSpacing?: string;
  labelWordSpacing?: string;

  // Field extra typography props
  fieldFontStyle?: string;
  fieldLineHeight?: string;
  fieldLetterSpacing?: string;
  fieldWordSpacing?: string;

  // Button extra typography props
  btnFontStyle?: string;
  btnLineHeight?: string;
  btnLetterSpacing?: string;
  btnWordSpacing?: string;

  // Message extra typography props
  msgFontStyle?: string;
  msgLineHeight?: string;
  msgLetterSpacing?: string;
  msgWordSpacing?: string;

  // Step extra typography props
  stepFontStyle?: string;
  stepLineHeight?: string;
  stepLetterSpacing?: string;
  stepWordSpacing?: string;

  // Step state colors
  stepInactivePrimaryColor?: string;
  stepInactiveSecondaryColor?: string;
  stepActivePrimaryColor?: string;
  stepActiveSecondaryColor?: string;
  stepCompletedPrimaryColor?: string;
  stepCompletedSecondaryColor?: string;

  // Added properties mapping from StylePanel/renderer
  formColumnGap?: string;
  formRowGap?: string;
  formButtonAlign?: string;
  formButtonFontSize?: string;
  formButtonRadius?: string;
  submitBtnBg?: string;
  submitBtnText?: string;
  submitBtnBgHover?: string;
  submitBtnTextHover?: string;
  prevBtnBg?: string;
  prevBtnText?: string;
  prevBtnBgHover?: string;
  prevBtnTextHover?: string;
  stepActivePrimary?: string;
  stepActiveSecondary?: string;
  stepInactivePrimary?: string;
  stepInactiveSecondary?: string;
}

const formatUnit = (value: string | number | undefined, defaultValue: string): string => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const valStr = String(value).trim();
  if (!isNaN(Number(valStr))) {
    return `${valStr}px`;
  }
  return valStr;
};

export const FormBlock = (rawProps: FormBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    formName = 'New Form',
    fields = [
      { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true, columnWidth: '100%' },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, columnWidth: '100%' },
      { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false, columnWidth: '100%' },
    ],
    inputSize = 'sm',
    showLabel = true,
    showRequiredMark = true,
    buttonSize = 'sm',
    buttonColumnWidth = '100%',
    buttonText = 'Send',
    buttonNextText = 'Next',
    buttonPrevText = 'Previous',
    buttonIconName = '',
    buttonIconPosition = 'left',
    buttonIconSpacing = '8px',
    buttonId = '',
    actionsAfterSubmit = ['collect', 'email'],
    collectMetadata = ['ip', 'user_agent'],
    emailTo = 'pewnoy.com@gmail.com',
    emailSubject = 'New message from "Lexi"',
    emailMessage = '[all-fields]',
    emailFromEmail = '',
    emailFromName = 'Lexi',
    emailReplyTo = '',
    emailCc = '',
    emailBcc = '',
    emailMetadata = ['date', 'time', 'page_url', 'user_agent', 'remote_ip', 'credit'],
    emailSendAs = 'html',
    redirectUrl = '',
    webhookUrl = '',
    stepType = 'number_text',
    stepShape = 'circle',
    customFormId = '',
    formValidation = 'browser',
    customMessagesEnabled = false,
    successMessage = 'Gửi form thành công!',
    errorMessage = 'Có lỗi xảy ra khi gửi form.',
    requiredMessage = 'Trường này là bắt buộc.',
    invalidMessage = 'Dữ liệu không hợp lệ.',

    columnsGap = '10px',
    rowsGap = '10px',
    formColumnGap,
    formRowGap,

    labelSpacing = '4px',
    labelColor = '#334155',
    labelFontSize = '12px',
    labelFontWeight = '600',
    labelFontFamily = 'inherit',

    fieldSpacing = '4px',
    fieldColor = '#0f172a',
    fieldFontSize = '13px',
    fieldFontWeight = '400',
    fieldFontFamily = 'inherit',

    fieldBgColor = '#ffffff',
    fieldTextColor = '#0f172a',
    fieldBorderColor = '#cbd5e1',
    fieldBorderWidth = '1px',
    fieldBorderRadius = '6px',
    fieldPadding = '8px 12px',

    btnPosition = 'left',
    btnAlignment = 'stretch',
    btnFontFamily = 'inherit',
    btnFontSize = '13px',
    btnFontWeight = '600',
    btnBorderType = 'none',
    btnBorderRadius = '6px',
    btnPadding = '8px 16px',

    btnNormalBgColor = '#3b82f6',
    btnNormalTextColor = '#ffffff',
    btnHoverBgColor = '#2563eb',
    btnHoverTextColor = '#ffffff',

    btnPrevBgColor = '#64748b',
    btnPrevTextColor = '#ffffff',

    formButtonAlign,
    formButtonFontSize,
    formButtonRadius,
    submitBtnBg,
    submitBtnText,
    prevBtnBg,
    prevBtnText,

    msgFontFamily = 'inherit',
    msgFontSize = '12px',
    msgFontWeight = '500',
    msgSuccessColor = '#10b981',
    msgErrorColor = '#ef4444',
    msgInlineColor = '#ef4444',

    stepFontFamily = 'inherit',
    stepFontSize = '12px',
    stepFontWeight = '600',
    stepSpacing = '20px',
    stepPadding = '30px',
    stepDividerWidth = '1px',
    stepDividerGap = '10px',

    stepInactivePrimaryColor = '#cbd5e1',
    stepInactiveSecondaryColor = '#64748b',
    stepActivePrimaryColor = '#3b82f6',
    stepActiveSecondaryColor = '#ffffff',
    stepCompletedPrimaryColor = '#10b981',
    stepCompletedSecondaryColor = '#ffffff',

    stepActivePrimary,
    stepActiveSecondary,
    stepInactivePrimary,
    stepInactiveSecondary,
    submitBtnBgHover = '#2563eb',
    submitBtnTextHover = '#ffffff',
    prevBtnBgHover = '#cbd5e1',
    prevBtnTextHover = '#334155',
    fieldBgColorFocus = '#ffffff',
    fieldBorderColorFocus = '#3b82f6',

    labelFontStyle,
    labelLineHeight,
    labelLetterSpacing,
    labelWordSpacing,

    fieldFontStyle,
    fieldLineHeight,
    fieldLetterSpacing,
    fieldWordSpacing,

    btnFontStyle,
    btnLineHeight,
    btnLetterSpacing,
    btnWordSpacing,

    msgFontStyle,
    msgLineHeight,
    msgLetterSpacing,
    msgWordSpacing,

    stepFontStyle,
    stepLineHeight,
    stepLetterSpacing,
    stepWordSpacing,
  } = props;

  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
    id,
    displayName,
    isLocked,
    parentId,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    displayName: node.data.displayName || node.data.name,
    isLocked: Boolean(node.data.custom?.locked),
    parentId: node.data.parent,
  }));

  const { enabled, actions: editorActions } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(props as any, 'block', id);

  // Unified property styling resolution
  const activeColumnsGap = formColumnGap || columnsGap || '10px';
  const activeRowsGap = formRowGap || rowsGap || '10px';
  const activeFieldColor = fieldColor || fieldTextColor || '#0f172a';
  const activeBtnPosition = formButtonAlign || btnPosition || 'left';
  const activeBtnBorderRadius = formButtonRadius || btnBorderRadius || '6px';
  const activeSubmitBtnBg = submitBtnBg || btnNormalBgColor || '#3b82f6';
  const activeSubmitBtnText = submitBtnText || btnNormalTextColor || '#ffffff';
  const activePrevBtnBg = prevBtnBg || btnPrevBgColor || '#64748b';
  const activePrevBtnText = prevBtnText || btnPrevTextColor || '#ffffff';
  const activeBtnColumnWidth = buttonColumnWidth || '100%';
  
  const activeStepActivePrimary = stepActivePrimaryColor || stepActivePrimary || '#3b82f6';
  const activeStepActiveSecondary = stepActiveSecondaryColor || stepActiveSecondary || '#ffffff';
  const activeStepInactivePrimary = stepInactivePrimaryColor || stepInactivePrimary || '#cbd5e1';
  const activeStepInactiveSecondary = stepInactiveSecondaryColor || stepInactiveSecondary || '#64748b';

  const paddingVal = inputSize === 'xs' ? '4px 8px' :
                     inputSize === 'sm' ? '8px 12px' :
                     inputSize === 'md' ? '10px 16px' :
                     inputSize === 'lg' ? '12px 20px' : '14px 24px';

  const fSizeVal = inputSize === 'xs' ? '11px' :
                   inputSize === 'sm' ? '13px' :
                   inputSize === 'md' ? '15px' :
                   inputSize === 'lg' ? '17px' : '19px';

  const btnPaddingVal = buttonSize === 'xs' ? '4px 8px' :
                        buttonSize === 'sm' ? '8px 16px' :
                        buttonSize === 'md' ? '10px 20px' :
                        buttonSize === 'lg' ? '12px 24px' : '14px 28px';

  const btnFontSizeVal = buttonSize === 'xs' ? '11px' :
                         buttonSize === 'sm' ? '13px' :
                         buttonSize === 'md' ? '15px' :
                         buttonSize === 'lg' ? '17px' : '19px';

  const fStyle: React.CSSProperties = {
    backgroundColor: fieldBgColor,
    color: activeFieldColor,
    borderColor: fieldBorderColor,
    borderWidth: fieldBorderWidth,
    borderStyle: 'solid',
    borderRadius: fieldBorderRadius,
    padding: paddingVal,
    fontSize: fieldFontSize ? formatUnit(fieldFontSize, '14px') : fSizeVal,
    fontFamily: fieldFontFamily,
    fontWeight: fieldFontWeight as any,
    fontStyle: fieldFontStyle,
    lineHeight: fieldLineHeight,
    letterSpacing: fieldLetterSpacing ? formatUnit(fieldLetterSpacing, 'normal') : undefined,
    wordSpacing: fieldWordSpacing ? formatUnit(fieldWordSpacing, 'normal') : undefined,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const lStyle: React.CSSProperties = {
    color: labelColor,
    fontSize: labelFontSize ? formatUnit(labelFontSize, '13px') : undefined,
    fontWeight: labelFontWeight as any,
    fontFamily: labelFontFamily,
    fontStyle: labelFontStyle,
    lineHeight: labelLineHeight,
    letterSpacing: labelLetterSpacing ? formatUnit(labelLetterSpacing, 'normal') : undefined,
    wordSpacing: labelWordSpacing ? formatUnit(labelWordSpacing, 'normal') : undefined,
    marginBottom: labelSpacing,
    display: 'block',
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: btnFontFamily,
    fontSize: btnFontSize ? formatUnit(btnFontSize, '13px') : (formButtonFontSize ? formatUnit(formButtonFontSize, '14px') : btnFontSizeVal),
    fontWeight: btnFontWeight as any,
    fontStyle: btnFontStyle,
    lineHeight: btnLineHeight,
    letterSpacing: btnLetterSpacing ? formatUnit(btnLetterSpacing, 'normal') : undefined,
    wordSpacing: btnWordSpacing ? formatUnit(btnWordSpacing, 'normal') : undefined,
    borderRadius: activeBtnBorderRadius,
    padding: btnPaddingVal,
    borderStyle: btnBorderType !== 'none' ? btnBorderType : 'none',
    borderWidth: btnBorderType !== 'none' ? '1px' : '0px',
    backgroundColor: activeSubmitBtnBg,
    color: activeSubmitBtnText,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: activeBtnColumnWidth === '100%' ? '100%' : 'auto',
  };

  const renderIcon = () => {
    if (!buttonIconName) return null;
    const IconComponent = (Lucide as any)[buttonIconName];
    if (!IconComponent) return null;
    return (
      <IconComponent 
        size={16} 
        style={{
          marginRight: buttonIconPosition === 'left' ? buttonIconSpacing : '0px',
          marginLeft: buttonIconPosition === 'right' ? buttonIconSpacing : '0px',
          order: buttonIconPosition === 'right' ? 1 : 0
        }} 
      />
    );
  };

  // Helper to determine step divisions in fields list
  const getStepIndices = () => {
    const indices: number[] = [];
    fields.forEach((f, idx) => {
      if (f.type === 'step') {
        indices.push(idx);
      }
    });
    return indices;
  };

  const stepIndices = getStepIndices();
  const isMultiStep = stepIndices.length > 0;

  // Split fields into pages/steps
  const getStepPages = () => {
    if (!isMultiStep) return [fields];
    const pages: FormField[][] = [];
    let currentPage: FormField[] = [];

    fields.forEach((field) => {
      if (field.type === 'step') {
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        currentPage = [field]; // Step field starts a new page and serves as metadata
      } else {
        currentPage.push(field);
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    return pages;
  };

  const pages = getStepPages();

  const focusHoverStyle = `
    [data-form-node-id="${id}"] .craft-form-input:focus {
      border-color: ${fieldBorderColorFocus} !important;
      background-color: ${fieldBgColorFocus} !important;
    }
    [data-form-node-id="${id}"] .craft-form-submit-btn:hover {
      background-color: ${submitBtnBgHover} !important;
      color: ${submitBtnTextHover} !important;
    }
    [data-form-node-id="${id}"] .craft-form-prev-btn:hover {
      background-color: ${prevBtnBgHover} !important;
      color: ${prevBtnTextHover} !important;
    }
  `;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      data-form-node-id={id}
      className={`craft-block-container relative transition-all duration-200 py-1 ${
        enabled && selected ? 'editor-element-selected z-30' : ''
      } ${
        enabled && hovered && !selected && !isLocked ? 'editor-element-hovered z-20' : ''
      } ${
        enabled && hovered && selected && !isLocked ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${classCss}`}
      style={wrapperStyle}
      onMouseDown={(e) => {
        if (handlePositionMouseDown(e)) return;
        if (!enabled) return;
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          if (parentId && parentId !== 'ROOT') {
            editorActions.selectNode(parentId);
          }
        }
      }}
      onMouseEnter={() => {
        if (enabled && !isLocked) setHovered(true);
      }}
      onMouseLeave={() => {
        if (enabled && !isLocked) {
          setHovered(false);
          setContextMenu(null);
        }
      }}
      onContextMenu={(e) => {
        if (!enabled) return;
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
        editorActions.selectNode(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: focusHoverStyle }} />
      {enabled && (hovered || selected) && !isLocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editorActions.selectNode(id);
          }}
          className="editor-hover-badge absolute top-0 right-0 bg-purple-500 hover:bg-purple-600 text-white h-5 w-5 z-40 rounded-bl-sm shadow-md select-none animate-fade-in flex items-center justify-center cursor-pointer"
          title={`Sửa Form`}
        >
          <Lucide.Pencil size={10} strokeWidth={2.5} />
        </div>
      )}

      {enabled && contextMenu && (
        <FloatingToolbar
          id={id}
          displayName="Form"
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={Boolean(contextMenu)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Editor visual representation */}
      <div className="w-full craft-form-element">
        
        {/* Multi-step progress indicators */}
        {isMultiStep && stepType !== 'none' && (
          <div 
            className="flex items-center justify-between mb-8 overflow-x-auto pb-2"
            style={{ 
              fontFamily: stepFontFamily,
              fontSize: stepFontSize ? formatUnit(stepFontSize, '12px') : undefined,
              fontWeight: stepFontWeight as any,
              fontStyle: stepFontStyle,
              lineHeight: stepLineHeight,
              letterSpacing: stepLetterSpacing ? formatUnit(stepLetterSpacing, 'normal') : undefined,
              wordSpacing: stepWordSpacing ? formatUnit(stepWordSpacing, 'normal') : undefined,
              gap: stepSpacing 
            }}
          >
            {pages.map((page, idx) => {
              const stepField = page.find(f => f.type === 'step');
              const stepLabel = stepField?.label || `Step ${idx + 1}`;
              const isActive = idx === 0;
              const shapeClass = stepShape === 'circle' ? 'rounded-full' :
                                 stepShape === 'square' ? 'rounded-none' :
                                 stepShape === 'rounded' ? 'rounded-lg' : 'hidden';

              const indicatorPrimary = isActive ? activeStepActivePrimary : activeStepInactivePrimary;
              const indicatorSecondary = isActive ? activeStepActiveSecondary : activeStepInactiveSecondary;

              return (
                <div key={idx} className="flex-1 flex items-center gap-3 min-w-max">
                  {stepShape !== 'none' && (
                    <div 
                      className={`flex items-center justify-center font-bold transition-all`}
                      style={{
                        width: stepPadding ? `calc(${stepPadding} * 1.2)` : '32px',
                        height: stepPadding ? `calc(${stepPadding} * 1.2)` : '32px',
                        backgroundColor: indicatorPrimary,
                        color: indicatorSecondary,
                        borderRadius: shapeClass === 'rounded-full' ? '50%' : 
                                      shapeClass === 'rounded-none' ? '0px' : '8px'
                      }}
                    >
                      {idx + 1}
                    </div>
                  )}
                  {stepType !== 'number' && (
                    <span style={{ color: isActive ? activeStepActivePrimary : '#64748b' }}>
                      {stepLabel}
                    </span>
                  )}
                  {idx < pages.length - 1 && (
                    <div 
                      className="flex-1" 
                      style={{ 
                        height: stepDividerWidth, 
                        backgroundColor: activeStepInactivePrimary,
                        marginLeft: stepDividerGap,
                        marginRight: stepDividerGap 
                      }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form elements list */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            margin: `0 -${parseFloat(activeColumnsGap || '0') / 2}px`,
          }}
        >
          {pages.map((page, pageIdx) => {
            const stepField = page.find(f => f.type === 'step');
            
            return (
              <React.Fragment key={pageIdx}>
                {enabled && stepField && (
                  <div className="w-full text-[10px] font-bold text-slate-400 border-b border-dashed border-slate-200 pb-1 mt-4 mb-2 flex items-center justify-between px-2">
                    <span>Trang {pageIdx + 1}: {stepField.label || 'Không tên'}</span>
                    <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded">Ngăn bước</span>
                  </div>
                )}
                {page.map((field) => {
                  if (field.type === 'step') return null;

                  const widthPercentage = field.columnWidth ? field.columnWidth : '100%';
                  const styleWrapper: React.CSSProperties = {
                    width: widthPercentage,
                    padding: `0 ${parseFloat(activeColumnsGap || '0') / 2}px`,
                    marginBottom: activeRowsGap,
                    boxSizing: 'border-box',
                  };

                  return (
                    <div key={field.id} style={styleWrapper} className="craft-form-field-wrapper">
                      {showLabel && field.label && (
                        <label style={lStyle}>
                          {field.label}
                          {field.required && showRequiredMark && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                      )}
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          style={fStyle}
                          placeholder={field.placeholder || ''}
                          rows={4}
                          className="craft-form-input"
                          required={field.required}
                        />
                      ) : field.type === 'select' ? (
                        <select style={fStyle} className="craft-form-input" required={field.required}>
                          <option value="">{field.placeholder || 'Select option...'}</option>
                          {field.options?.split('\n').map((opt, oidx) => (
                            <option key={oidx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="space-y-1.5 pt-1.5">
                          {field.options?.split('\n').map((opt, oidx) => (
                            <label key={oidx} className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 craft-form-input" required={field.required && oidx === 0} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-1.5 pt-1.5">
                          {field.options?.split('\n').map((opt, oidx) => (
                            <label key={oidx} className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                              <input type="radio" name={field.id} className="border-slate-300 text-blue-600 focus:ring-blue-500 craft-form-input" required={field.required && oidx === 0} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          style={fStyle}
                          placeholder={field.placeholder || ''}
                          className="craft-form-input"
                          required={field.required}
                          pattern={field.type === 'tel' ? "^[0-9+() -]{9,15}$" : field.type === 'url' ? "https?://.+" : undefined}
                          title={field.type === 'tel' ? "Vui lòng nhập số điện thoại hợp lệ" : field.type === 'url' ? "Vui lòng nhập đường dẫn hợp lệ" : undefined}
                        />
                      )}
                      
                      <div className="craft-form-error-msg" style={{color: props.msgInlineColor || '#ef4444', fontSize: '11px', marginTop: '4px', display: 'none'}}></div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form buttons row */}
        <div 
          className="mt-6 flex"
          style={{
            justifyContent: activeBtnPosition === 'left' ? 'flex-start' : 
                            activeBtnPosition === 'right' ? 'flex-end' : 
                            activeBtnPosition === 'center' ? 'center' : 'stretch',
          }}
        >
          <div 
            className="flex gap-3"
            style={{
              width: activeBtnColumnWidth === '100%' ? '100%' : 'auto',
              flexDirection: activeBtnPosition === 'justify' ? 'row' : 'row',
            }}
          >
            {isMultiStep && (
              <button 
                type="button" 
                className="craft-form-prev-btn"
                style={{
                  ...btnStyle, 
                  backgroundColor: activePrevBtnBg, 
                  color: activePrevBtnText,
                  width: activeBtnColumnWidth === '100%' ? '50%' : 'auto'
                }}
              >
                {buttonPrevText}
              </button>
            )}
            <button 
              type="button" 
              className="craft-form-submit-btn"
              style={{
                ...btnStyle,
                width: isMultiStep && activeBtnColumnWidth === '100%' ? '50%' : (activeBtnColumnWidth === '100%' ? '100%' : 'auto')
              }}
            >
              {renderIcon()}
              <span>{isMultiStep ? buttonNextText : buttonText}</span>
            </button>
          </div>
        </div>

        {/* Success/Error alert box for builder preview */}
        {enabled && (
          <div className="mt-4 text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-3">
            Hành động: {actionsAfterSubmit.map(act => act === 'collect' ? 'Lưu DB' : act === 'email' ? 'Gửi Email' : act === 'webhook' ? 'Webhook' : 'Chuyển hướng').join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

FormBlock.displayName = 'FormBlock';

FormBlock.craft = {
  displayName: 'Form',
  props: {
    ...defaultLayoutProps,
    formName: 'New Form',
    fields: [
      { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name', required: true, columnWidth: '100%' },
      { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, columnWidth: '100%' },
      { id: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false, columnWidth: '100%' },
    ],
    inputSize: 'sm',
    showLabel: true,
    showRequiredMark: true,
    buttonSize: 'sm',
    buttonColumnWidth: '100%',
    buttonText: 'Send',
    buttonNextText: 'Next',
    buttonPrevText: 'Previous',
    buttonIconName: '',
    buttonIconPosition: 'left',
    buttonIconSpacing: '8px',
    buttonId: '',
    actionsAfterSubmit: ['collect', 'email'],
    collectMetadata: ['ip', 'user_agent'],
    emailTo: 'pewnoy.com@gmail.com',
    emailSubject: 'New Submission from {{formName}}',
    emailMessage: '',
    emailFromEmail: '',
    emailFromName: 'Lexi System',
    emailReplyTo: '{{email}}',
    emailCc: '',
    emailBcc: '',
    emailMetadata: [],
    emailSendAs: 'html',
    redirectUrl: '',
    webhookUrl: '',
    stepType: 'number_text',
    stepShape: 'circle',
    customFormId: '',
    formValidation: 'browser',
    customMessagesEnabled: false,
    successMessage: 'Form submitted successfully!',
    errorMessage: 'An error occurred while submitting the form. Please try again later.',
    requiredMessage: 'This field is required',
    invalidMessage: 'Please enter a valid value',
    columnsGap: '20px',
    rowsGap: '20px',
    labelSpacing: '6px',
    labelColor: '#334155',
    labelFontSize: '13px',
    labelFontWeight: '600',
    labelFontFamily: 'inherit',
    fieldSpacing: '4px',
    fieldColor: '#0f172a',
    fieldFontSize: '14px',
    fieldFontWeight: '400',
    fieldFontFamily: 'inherit',
    fieldBgColor: '#ffffff',
    fieldTextColor: '#0f172a',
    fieldBorderColor: '#cbd5e1',
    fieldBorderWidth: '1px',
    fieldBorderRadius: '6px',
    fieldPadding: '8px 12px',
    btnPosition: 'left',
    btnAlignment: 'stretch',
    btnFontFamily: 'inherit',
    btnFontSize: '13px',
    btnFontWeight: '600',
    btnBorderType: 'none',
    btnBorderRadius: '6px',
    btnPadding: '8px 16px',
    btnNormalBgColor: '#3b82f6',
    btnNormalTextColor: '#ffffff',
    btnHoverBgColor: '#2563eb',
    btnHoverTextColor: '#ffffff',
    btnPrevBgColor: '#64748b',
    btnPrevTextColor: '#ffffff',
    msgFontFamily: 'inherit',
    msgFontSize: '12px',
    msgFontWeight: '500',
    msgSuccessColor: '#10b981',
    msgErrorColor: '#ef4444',
    msgInlineColor: '#ef4444',
    stepFontFamily: 'inherit',
    stepFontSize: '12px',
    stepFontWeight: '600',
    stepSpacing: '20px',
    stepPadding: '30px',
    stepDividerWidth: '1px',
    stepDividerGap: '10px',
    stepInactivePrimaryColor: '#cbd5e1',
    stepInactiveSecondaryColor: '#64748b',
    stepActivePrimaryColor: '#3b82f6',
    stepActiveSecondaryColor: '#ffffff',
    stepCompletedPrimaryColor: '#10b981',
    stepCompletedSecondaryColor: '#ffffff',
  },
  custom: {
    settings: true,
  },
  related: {
    // will be set in editor
  }
};



