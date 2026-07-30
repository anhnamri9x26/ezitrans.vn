# Lexi Page Builder — Element Blueprint

> Tài liệu chuẩn hóa để tạo element mới trong Page Builder.
> Khi tạo element mới, hãy mention file này và mô tả element cần tạo.
> AI sẽ dựa vào blueprint này để sinh code đúng pattern mà không cần phân tích lại codebase.

---

## 1. Files cần tạo / sửa khi thêm element mới

| # | File | Action | Mô tả |
|---|------|--------|-------|
| 1 | `src/plugins/lexi-page-builder/components/{ElementName}Block.tsx` | **NEW** | Component chính |
| 2 | `src/plugins/lexi-page-builder/utils/renderer.ts` | MODIFY | Thêm `case '{ElementName}Block'` trong `renderNode()` |
| 3 | `src/plugins/lexi-page-builder/panels/LeftSidebar.tsx` | MODIFY | Thêm block card kéo thả |
| 4 | `src/plugins/lexi-page-builder/LexiPageBuilder.tsx` | MODIFY | Import + thêm vào `resolver={{ }}` (dòng ~2359) |
| 5 | `src/plugins/lexi-page-builder/panels/right-sidebar/panels/ContentPanel.tsx` | MODIFY | Tab "Nội dung" settings |
| 6 | `src/plugins/lexi-page-builder/panels/right-sidebar/panels/StylePanel.tsx` | MODIFY | Tab "Kiểu hiển thị" settings |
| 7 | `src/plugins/lexi-page-builder/panels/right-sidebar/panels/AdvancedPanel.tsx` | MODIFY | Nếu cần override widthMode default |

---

## 2. Component Template — `{ElementName}Block.tsx`

### 2.1 Imports chuẩn

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles } from '../utils/styleResolver';
// Nếu cần icon:
import { getLucideReactComponent } from '../utils/iconRegistry';
// Nếu cần dynamic data:
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';
```

### 2.2 Props Interface

```tsx
export interface {ElementName}BlockProps extends CommonLayoutProps {
  // Props riêng của element — xem phần 2.8 để biết naming convention
}
```

> **Bắt buộc**: `extends CommonLayoutProps` — cung cấp margin, padding, width, height, background, border, animation, position, CSS ID/class, và tất cả advanced styling props.

### 2.3 Component Body — Boilerplate bắt buộc

```tsx
export const {ElementName}Block = (props: {ElementName}BlockProps) => {
  const {
    // Destructure props với default values
  } = props;

  // ─── HOOK 1: useNode ───
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

  // ─── HOOK 2: useEditor ───
  const { enabled, actions: editorActions } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  // ─── HOOK 3: States ───
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // ─── HOOK 4: Context menu listener ───
  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };
    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  // ─── HOOK 5: Wrapper styles ───
  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };
  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block');
  // Tham số thứ 2: 'block' | 'flex' | 'inline-flex' — tùy element

  // ─── HOOK 6: Position drag ───
  const { handlePositionMouseDown } = usePositionDrag({
    id, enabled, isLocked, props, setProp,
  });

  // ─── CSS Variables cho hover states ───
  const cssVariables = {
    '--text-color': textColor,
    '--text-color-hover': textColorHover || textColor,
    // Thêm biến tùy element
  } as React.CSSProperties;

  // ─── RETURN JSX ───
  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      id={idCss || id}
      style={{ ...wrapperStyle, ...cssVariables, /* thêm styles */ }}
      className={`relative transition-all duration-200 ${
        enabled && selected ? 'editor-element-selected z-30' : ''
      } ${
        enabled && hovered && !selected && !isLocked ? 'editor-element-hovered z-20' : ''
      } ${
        enabled && hovered && selected && !isLocked ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${className} ${classCss}`}
      onMouseDown={(e) => {
        if (handlePositionMouseDown(e)) return;
        if (!enabled) return;
        if (e.altKey) {
          e.preventDefault(); e.stopPropagation();
          if (parentId && parentId !== 'ROOT') editorActions.selectNode(parentId);
        }
      }}
      onMouseEnter={() => { if (enabled && !isLocked) setHovered(true); }}
      onMouseLeave={() => { if (enabled && !isLocked) setHovered(false); }}
      onContextMenu={(e) => {
        if (!enabled) return;
        e.preventDefault(); e.stopPropagation();
        window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
        editorActions.selectNode(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* ─── Scoped CSS (nếu cần hover/active styles) ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        #${idCss || id} .my-item:hover { color: var(--text-color-hover) !important; }
      `}} />

      {/* ─── Editor hover badge ─── */}
      {enabled && (hovered || selected) && !isLocked && (
        <div
          onClick={(e) => { e.stopPropagation(); editorActions.selectNode(id); }}
          className="editor-hover-badge absolute top-0 right-0 bg-purple-500 hover:bg-purple-600 text-white h-5 w-5 z-40 rounded-bl-sm shadow-md select-none animate-fade-in flex items-center justify-center cursor-pointer"
          title={`Sửa ${displayName.toLowerCase()}`}
        >
          <Pencil size={10} strokeWidth={2.5} />
        </div>
      )}

      {/* ─── Context menu (FloatingToolbar) ─── */}
      {enabled && contextMenu && (
        <FloatingToolbar
          id={id}
          displayName={displayName}
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={Boolean(contextMenu)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ─── Nội dung element ─── */}
      {/* ... render element content ở đây ... */}
    </div>
  );
};
```

### 2.4 Craft.js Static Config (bắt buộc)

```tsx
{ElementName}Block.craft = {
  name: '{ElementName}Block',
  props: {
    // Default values cho TẤT CẢ props của element
    // Ví dụ:
    fontSize: '14px',
    fontWeight: '400',
    textColor: '#334155',
    // ...
    // BẮT BUỘC spread defaultLayoutProps cuối cùng:
    ...defaultLayoutProps,
    width: '100%', // Override nếu cần ('100%' cho full-width, 'auto' cho inline)
  },
  displayName: 'Tên hiển thị tiếng Việt', // Dùng để match trong settings panels
};
```

---

## 3. Renderer Template — `renderer.ts`

### 3.1 Vị trí thêm case

Thêm `case '{ElementName}Block':` trong hàm `renderNode()`, trong khối `switch (typeName)`.

### 3.2 Pattern code

```tsx
case '{ElementName}Block': {
  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };
  const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');
  const containerStyles: Record<string, string | undefined> = { ...wrapperStyle };
  const idCss = props.idCss || `element-${nodeId}`;

  // ─── Scoped CSS ───
  const scopedCss = `
    #${idCss} .class-name {
      /* Normal state */
    }
    #${idCss} .class-name:hover {
      /* Hover state */
    }
    #${idCss} .class-name.active {
      /* Active state */
    }
    /* Responsive breakpoints */
    @media (max-width: 767px) {
      #${idCss} .class-name {
        /* Mobile overrides */
      }
    }
  `.trim();

  // ─── Build HTML ───
  const contentHtml = `...`;

  // ─── Inline JS (nếu cần interactivity) ───
  const scriptJs = `
    (function(){
      var container = document.getElementById('${idCss}');
      if(!container) return;
      // ... logic
    })();
  `.trim();

  return `
    <div id="${idCss}"${getStyleAttr(containerStyles)}>
      <style>${scopedCss}</style>
      ${contentHtml}
      <script>${scriptJs}</script>
    </div>
  `.trim();
}
```

### 3.3 Tiện ích có sẵn trong renderer

| Hàm | Mô tả |
|-----|-------|
| `getWrapperStyles(props, displayType)` | Trả về `{ wrapperStyle, idCss, classCss }` |
| `getStyleAttr(styleObj)` | Convert object → inline style string |
| `getLucideSvgString(iconName, size, color)` | Trả về SVG string của lucide icon |
| `renderNode(state, nodeId, context)` | Render child node (cho linked nodes) |
| `formatUnit(value, default)` | Đảm bảo giá trị có đơn vị px |

---

## 4. LeftSidebar — Block Card

### 4.1 Import

```tsx
import { {ElementName}Block } from '../components/{ElementName}Block';
```

Thêm icon vào lucide-react import nếu cần.

### 4.2 Block card JSX

Thêm vào trong nhóm "Thành phần nội dung" (`openAccordion.basic`), sau block cuối cùng:

```tsx
{/* {ElementName} */}
<div
  ref={(ref) => {
    if (ref) connectors.create(ref, <{ElementName}Block />);
  }}
  className="py-4 px-2 border border-slate-200 hover:border-brand-500 hover:shadow-sm hover:shadow-brand-500/5 rounded-lg cursor-grab flex flex-col items-center justify-center gap-2 transition-all text-center select-none bg-white group"
>
  <div className="text-slate-400 group-hover:text-brand-500 transition-colors">
    <IconName size={24} />
  </div>
  <p className="font-semibold text-slate-700 text-[11px] group-hover:text-brand-600 transition-colors">Tên hiển thị</p>
</div>
```

---

## 5. Resolver Registration

### 5.1 `LexiPageBuilder.tsx`

```tsx
// Thêm import:
import { {ElementName}Block } from './components/{ElementName}Block';

// Thêm vào resolver object (dòng ~2359):
resolver={{ ..., {ElementName}Block }}
```

---

## 6. Settings Panel — ContentPanel.tsx

### 6.1 Pattern

Thêm block `{name === 'Tên hiển thị' && ( ... )}` — trong đó `'Tên hiển thị'` = giá trị `displayName` từ `.craft` config.

### 6.2 Helper functions có sẵn qua `ctx`

| Helper | Mô tả | Ví dụ |
|--------|-------|-------|
| `updateProp(key, value)` | Cập nhật 1 prop | `updateProp('fontSize', '16px')` |
| `renderStyleRow(label, control)` | 1 row: label bên trái, control bên phải | — |
| `renderSegmentedControl(value, default, options, onChange)` | Button group | `renderSegmentedControl(props.align, 'left', [{value:'left',label:'Trái'}, ...], v => updateProp('align', v))` |
| `renderColorControl(propKey, fallback)` | Color picker popover | `renderColorControl('textColor', '#334155')` |
| `renderUnitControl(propKey, default, unit, range)` | Slider + number input | `renderUnitControl('fontSize', '14', 'px', {min:8, max:80})` |
| `renderEditButton(id, null, onReset, isModified)` | Nút mở popover | Typography popover trigger |
| `renderPopoverPanel(id, content)` | Popover content | Typography fields popover |
| `renderTypographyFields(prefix, defaultSize, defaultWeight)` | Font family + size + weight + style + decoration + line-height + letter-spacing + word-spacing + text-transform | Full typography group |
| `onOpenMedia(callback)` | Mở media library | Image/video picker |
| `onOpenIcon(current, callback, style?)` | Mở icon picker | Icon selection modal |

### 6.3 Items list editor pattern (nếu element có danh sách items)

Xem `name === 'Danh sách'` trong ContentPanel (~dòng 2304-2630):
- Draggable items với `GripVertical`
- Expand/collapse mỗi item
- Add/Delete buttons
- Các state: `expandedItemIdx`, `draggedItemIdx`

---

## 7. Settings Panel — StylePanel.tsx

### 7.1 Pattern

Thêm block `{name === 'Tên hiển thị' && ( ... )}`.

### 7.2 Accordion Section

```tsx
{renderStyleSection('Tên section', (
  <div className="space-y-2.5">
    {renderStyleRow('Label', renderUnitControl(...))}
    {renderStyleRow('Label', renderColorControl(...))}
  </div>
))}
```

### 7.3 State Tab Switcher (Normal / Hover / Active)

```tsx
// Cần thêm state trong RightSidebarLegacy.tsx:
const [activeMyHoverTab, setActiveMyHoverTab] = useState<'normal' | 'hover' | 'active'>('normal');

// Trong StylePanel:
<div className="flex border-b border-slate-100 my-2 pt-1">
  {['normal', 'hover', 'active'].map(tab => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveMyHoverTab(tab)}
      className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
        activeMyHoverTab === tab
          ? 'border-brand-500 text-brand-600 font-extrabold'
          : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
    </button>
  ))}
</div>

{activeMyHoverTab === 'normal' && (
  renderStyleRow('Màu sắc', renderColorControl('textColor', '#334155'))
)}
{activeMyHoverTab === 'hover' && (
  renderStyleRow('Màu sắc', renderColorControl('textColorHover', '#3b82f6'))
)}
{activeMyHoverTab === 'active' && (
  renderStyleRow('Màu sắc', renderColorControl('textColorActive', '#3b82f6'))
)}
```

### 7.4 Toggle Switch

```tsx
{renderStyleRow('Đường phân cách', (
  <div className="flex items-center h-6 justify-end w-full">
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={props.showDivider || false}
        onChange={(e) => updateProp('showDivider', e.target.checked)}
      />
      <div className="w-[30px] h-[16px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[12px] after:w-[12px] after:transition-all peer-checked:bg-brand-500"></div>
    </label>
  </div>
))}
```

### 7.5 Cuối file — exclude list

Thêm `'Tên hiển thị'` vào danh sách block names ở dòng ~3584 (dòng bắt đầu `{!(name === 'Văn bản' || ...`) để ngăn render fallback generic settings.

---

## 8. Settings Panel — AdvancedPanel.tsx

Nếu element mặc định full-width, thêm displayName vào dòng ~52:

```tsx
value={props.widthMode || (name === '...' || name === 'Tên hiển thị' ? 'full' : 'default')}
```

---

## 9. Naming Conventions

| Thứ | Convention | Ví dụ |
|-----|-----------|-------|
| File component | `PascalCaseBlock.tsx` | `MenuBlock.tsx` |
| Export component | `export const PascalCaseBlock` | `export const MenuBlock` |
| Props interface | `PascalCaseBlockProps` | `MenuBlockProps` |
| Craft name | `'PascalCaseBlock'` | `'MenuBlock'` |
| Craft displayName | Tiếng Việt | `'Menu'`, `'Thanh điều hướng'` |
| Renderer case | `case 'PascalCaseBlock':` | `case 'MenuBlock':` |
| Panel match | `name === 'displayName tiếng Việt'` | `name === 'Menu'` |
| CSS scope prefix | `craft-lowercase` | `craft-menu-item` |
| CSS ID | `props.idCss \|\| 'element-${nodeId}'` | `menu-abc123` |
| Prop names | camelCase | `textColor`, `itemBgColorHover` |
| Prop hover suffix | `...Hover` | `textColorHover` |
| Prop active suffix | `...Active` | `textColorActive` |

---

## 10. Checklist tạo element mới

- [ ] Tạo `components/{Name}Block.tsx` với đầy đủ boilerplate (mục 2)
- [ ] Định nghĩa `{Name}BlockProps extends CommonLayoutProps`
- [ ] Thêm `.craft` static config với `...defaultLayoutProps`
- [ ] Thêm `case '{Name}Block':` trong `renderer.ts` (mục 3)
- [ ] Thêm block card trong `LeftSidebar.tsx` (mục 4)
- [ ] Import + thêm resolver trong `LexiPageBuilder.tsx` (mục 5)
- [ ] Thêm `{name === '...' && ()}` trong `ContentPanel.tsx` (mục 6)
- [ ] Thêm `{name === '...' && ()}` trong `StylePanel.tsx` (mục 7)
- [ ] Thêm displayName vào exclude list trong `StylePanel.tsx` dòng ~3584
- [ ] Cập nhật `AdvancedPanel.tsx` nếu cần widthMode default (mục 8)
- [ ] Chạy `npm run build` — không lỗi TypeScript
- [ ] Test kéo thả, settings panel, compiled HTML
