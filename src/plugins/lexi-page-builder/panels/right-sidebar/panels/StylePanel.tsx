import React from 'react';
import { Monitor } from 'lucide-react';
import { AdvancedPanel } from './AdvancedPanel';
import { parseBoxShadow, parseCssFilters, serializeBoxShadow, serializeCssFilters } from '../shared/utils';

export function StylePanel({ ctx }: { ctx: Record<string, any> }) {
  const {
    activeTab, name, props, selected, Lucide, SPACING_UNITS, GOOGLE_FONTS, TYPOGRAPHY_UNITS,
    activeBorderTab, setActiveBorderTab,
    activeIconListIconHoverTab, setActiveIconListIconHoverTab,
    activeIconListTextHoverTab, setActiveIconListTextHoverTab, activeBgTab, setActiveBgTab,
    activeTextHoverTab, setTextHoverTabByNodeId, imageStyleTab, setImageStyleTab,
    activeIconHoverTab, setActiveIconHoverTabByNodeId,
    accordionItemTab, setAccordionItemTab, accordionTitleTab, setAccordionTitleTab, accordionIconTab, setAccordionIconTab,
    tabsItemTab, setTabsItemTab, tabsTitleTab, setTabsTitleTab, tabsIconTab, setTabsIconTab,
    isTypographyModified, handleResetTypography, isTextShadowModified, handleResetTextShadow, updateProp,
    renderStyleSection, renderStyleRow, renderSegmentedControl, renderEditButton, renderPopoverPanel,
    renderTypographyFields,
    renderColorControl, renderUnitControl, renderSpacingControl,
    renderLineHeightControl,
    renderBoxShadowPopover, renderTextShadowPopover, renderTextStrokePopover,
    registerStepper, startStepping, stopStepping, splitSpacingValue, renderAccordionSection, renderResponsiveLabel,
    onOpenMedia, onOpenIcon,
  } = ctx;

  const [activeMenuHoverTab, setActiveMenuHoverTab] = React.useState<'normal' | 'hover' | 'active'>('normal');
  const [activeMenuIconHoverTab, setActiveMenuIconHoverTab] = React.useState<'normal' | 'hover' | 'active'>('normal');
  const [activeMenuIndicatorHoverTab, setActiveMenuIndicatorHoverTab] = React.useState<'normal' | 'hover' | 'active'>('normal');
  const [activeMenuToggleHoverTab, setActiveMenuToggleHoverTab] = React.useState<'normal' | 'hover'>('normal');
  const [activeDropdownMenuHoverTab, setActiveDropdownMenuHoverTab] = React.useState<'normal' | 'active'>('normal');

  const renderSliderControl = (
    key: string,
    value: number,
    range: { min: number; max: number; step: number },
    onChange: (key: any, value: number) => void
  ) => (
    <div className="flex items-center gap-2 w-full">
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(key, Number(e.target.value))}
        className="flex-1 accent-brand-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
      />
      <input
        type="number"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(key, Number(e.target.value))}
        className="w-14 h-7 rounded border border-slate-200 px-1 text-center text-[10px] font-semibold text-slate-600 outline-none focus:border-brand-500"
      />
    </div>
  );

  const renderBoxShadowFields = (
    shadow: { horizontal: number; vertical: number; blur: number; spread: number; color: string; inset: boolean; active?: boolean },
    onChange: (shadow: { horizontal: number; vertical: number; blur: number; spread: number; color: string; inset: boolean }) => void
  ) => {
    const updateShadow = (key: 'horizontal' | 'vertical' | 'blur' | 'spread' | 'color' | 'inset', value: any) => onChange({ ...shadow, [key]: value });

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Màu sắc</span>
          {renderColorControl('imageBoxShadowColor', 'rgba(0,0,0,0.15)', undefined, shadow.color, (value: string) => updateShadow('color', value))}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Ngang</span>
          {renderSliderControl('horizontal', shadow.horizontal, { min: -100, max: 100, step: 1 }, updateShadow)}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Dọc</span>
          {renderSliderControl('vertical', shadow.vertical, { min: -100, max: 100, step: 1 }, updateShadow)}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Mờ</span>
          {renderSliderControl('blur', shadow.blur, { min: 0, max: 200, step: 1 }, updateShadow)}
        </div>
        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
          <span className="font-medium text-slate-500">Lan</span>
          {renderSliderControl('spread', shadow.spread, { min: -100, max: 100, step: 1 }, updateShadow)}
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 w-full pt-1 border-t border-slate-100">
          <span>Inset</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={shadow.inset} 
              onChange={(e) => updateShadow('inset', e.target.checked)} 
            />
            <div className="w-[30px] h-[16px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[12px] after:w-[12px] after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>
      </div>
    );
  };

  return (
        (() => {
          const showBorderInStyle = 
            name === 'Vùng chứa' || 
            name === 'Lưới' || 
            name === 'Nút bấm' || 
            name === 'Hộp Icon' || 
            name === 'Hộp hình ảnh' || 
            name === 'Đường phân cách';
          const borderAndRadiusOptions = (
            <div className="space-y-4">
              <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-md">
                <button onClick={() => setActiveBorderTab('normal')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${activeBorderTab === 'normal' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}>Bình thường</button>
                <button onClick={() => setActiveBorderTab('hover')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${activeBorderTab === 'hover' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}>Di chuột</button>
              </div>

              {activeBorderTab === 'normal' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-600 font-bold">Loại đường viền</label>
                  <select
                    value={props.borderType || 'none'}
                    onChange={(e) => updateProp('borderType', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none"
                  >
                    <option value="none">Mặc định</option>
                    <option value="solid">Nét liền dải (Solid)</option>
                    <option value="double">Nét đôi (Double)</option>
                    <option value="dotted">Nét chấm (Dotted)</option>
                    <option value="dashed">Nét đứt (Dashed)</option>
                    <option value="hidden">Ẩn (Hidden)</option>
                  </select>
                </div>
              )}

              {((activeBorderTab === 'normal' && props.borderType && props.borderType !== 'none') || (activeBorderTab === 'hover' && props.borderType && props.borderType !== 'none')) && (
                <>
                  {activeBorderTab === 'normal' && renderSpacingControl('border', 'Độ dày viền', ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'])}
                  {renderStyleRow('Màu sắc', renderColorControl(activeBorderTab === 'normal' ? 'borderColor' : 'borderColorHover', '#000000'))}
                </>
              )}

              <div className="pt-2 border-t border-slate-100">
                {activeBorderTab === 'normal' ? 
                  renderSpacingControl('borderRadius', 'Bo viền', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']) :
                  renderSpacingControl('borderRadiusHover', 'Bo viền', ['borderTopLeftRadiusHover', 'borderTopRightRadiusHover', 'borderBottomRightRadiusHover', 'borderBottomLeftRadiusHover'])
                }
              </div>

              {(() => {
                const shadowProp = activeBorderTab === 'normal' ? 'boxShadow' : 'boxShadowHover';
                return (
                  <>
                    {renderStyleRow(renderResponsiveLabel('Đổ bóng', 'shadow'), renderEditButton(`shadow-${selected.id}-${activeBorderTab}`, null, () => updateProp(shadowProp, 'none'), props[shadowProp] && props[shadowProp] !== 'none'))}
                    {renderPopoverPanel(`shadow-${selected.id}-${activeBorderTab}`, renderBoxShadowPopover(shadowProp))}
                  </>
                );
              })()}
            </div>
          );

          return (
            <>
              {activeTab === 'style' && (
          <div className="space-y-3 animate-fade-in">
            {(name === 'Văn bản' || name === 'Tiêu đề') && renderStyleSection(name, (
              <>
                {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'textAlign'), renderSegmentedControl(props.textAlign,
                  'left',
                  [
                    { value: 'left', label: 'Trái' },
                    { value: 'center', label: 'Giữa' },
                    { value: 'right', label: 'Phải' },
                    { value: 'justify', label: 'Đều' },
                  ] as const,
                  (value: string) => updateProp('textAlign', value)
                ))}

                 {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'type'), renderEditButton(`type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                {renderPopoverPanel(`type-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Gia đình</span>
                      <select
                        value={props.fontFamily || 'Inter'}
                        onChange={(e) => updateProp('fontFamily', e.target.value)}
                        className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                      >
                        <optgroup label="Cài đặt website">
                          <option value="var(--site-font-family-heading)">Default: Heading font</option>
                          <option value="var(--site-font-family-body)">Default: Body font</option>
                          <option value="var(--site-font-family-small)">Default: Small font</option>
                          <option value="var(--site-font-family-button)">Default: Button font</option>
                        </optgroup>
                        <optgroup label="Tất cả Font chữ Google">
                          {GOOGLE_FONTS.map((font: string) => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kích thước</span>
                      {renderUnitControl('fontSize', '16', 'px', { min: 10, max: 80 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ đậm</span>
                      <select value={props.fontWeight || '400'} onChange={(e) => updateProp('fontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                        <option value="100">100 (Rất mỏng)</option>
                        <option value="200">200 (Mỏng nhẹ)</option>
                        <option value="300">300 (Mỏng)</option>
                        <option value="400">400 (Bình thường)</option>
                        <option value="500">500 (Trung bình)</option>
                        <option value="600">600 (Nửa đậm)</option>
                        <option value="700">700 (Đậm)</option>
                        <option value="800">800 (Rất đậm)</option>
                        <option value="900">900 (Đen)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                      {renderSegmentedControl(props.fontStyle, 'normal', [
                        { value: 'normal', label: 'Bình thường' },
                        { value: 'italic', label: 'Nghiêng' },
                      ] as const, (value: string) => updateProp('fontStyle', value))}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ cao dòng</span>
                      {renderLineHeightControl()}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                      {renderUnitControl('letterSpacing', '0', 'px', { min: -5, max: 20 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Khoảng cách từ</span>
                      {renderUnitControl('wordSpacing', '0', 'px', { min: 0, max: 40 })}
                    </div>
                  </div>
                ))}

                <>
                     {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'textShadow'), renderEditButton(`textShadow-${selected.id}`, null, handleResetTextShadow, isTextShadowModified))}
                    {renderPopoverPanel(`textShadow-${selected.id}`, (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Màu sắc</span>
                          {renderColorControl('textShadowColor', 'rgba(0, 0, 0, 0.3)')}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Ngang</span>
                          {renderUnitControl('textShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Dọc</span>
                          {renderUnitControl('textShadowVertical', '0', 'px', { min: -50, max: 50 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Độ mờ</span>
                          {renderUnitControl('textShadowBlur', '10', 'px', { min: 0, max: 100 })}
                        </div>
                      </div>
                    ))}

                    {name === 'Văn bản' && renderStyleRow(renderResponsiveLabel('Khoảng cách đoạn văn', 'paragraphSpacing'), renderUnitControl('paragraphSpacing', '16', 'px', { min: 0, max: 100 }))}

                    {/* Bình thường / Di chuột tabs */}
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setTextHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'normal' }))}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeTextHoverTab === 'normal'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'hover' }))}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeTextHoverTab === 'hover'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Di chuột
                      </button>
                    </div>

                    {activeTextHoverTab === 'normal' ? (
                      <div className="space-y-2.5 pt-1 animate-fade-in">
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColor'), renderColorControl('textColor', '#334155'))}
                        {renderStyleRow(renderResponsiveLabel('Màu liên kết', 'linkColor'), renderColorControl('linkColor', '#2563eb'))}
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1 animate-fade-in">
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColorHover'), renderColorControl('textColorHover', '#3b82f6'))}
                        {renderStyleRow(renderResponsiveLabel('Màu liên kết', 'linkColorHover'), renderColorControl('linkColorHover', '#1d4ed8'))}
                      </div>
                    )}
                  </>

                {renderStyleRow('Chế độ hòa trộn', (
                  <select
                    value={props.mixBlendMode || 'normal'}
                    onChange={(e) => updateProp('mixBlendMode', e.target.value)}
                    className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none"
                  >
                    <option value="normal">Bình thường (Normal)</option>
                    <option value="multiply">Nhân (Multiply)</option>
                    <option value="screen">Lọc (Screen)</option>
                    <option value="overlay">Chồng (Overlay)</option>
                    <option value="darken">Làm tối (Darken)</option>
                    <option value="lighten">Làm sáng (Lighten)</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                    <option value="hard-light">Ánh sáng mạnh (Hard Light)</option>
                    <option value="soft-light">Ánh sáng dịu (Soft Light)</option>
                    <option value="difference">Khác biệt (Difference)</option>
                    <option value="exclusion">Loại trừ (Exclusion)</option>
                    <option value="hue">Sắc thái (Hue)</option>
                    <option value="saturation">Độ bão hòa (Saturation)</option>
                    <option value="color">Màu sắc (Color)</option>
                    <option value="luminosity">Độ sáng (Luminosity)</option>
                  </select>
                ))}
              </>
            ))}
            {name === 'Văn bản' && props.dropCap && renderStyleSection('Chữ viết hoa', (
              <>
                <div className="space-y-1.5 py-1 border-b border-slate-100 pb-3">
                  <label className="block text-[10px] text-slate-600 font-bold">Xem</label>
                  <select value={props.dropCapView || 'default'} onChange={(e) => updateProp('dropCapView', e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none">
                    <option value="default">Mặc định</option>
                    <option value="framed">Có khung</option>
                    <option value="boxed">Đóng hộp</option>
                  </select>
                </div>
                {renderStyleRow(renderResponsiveLabel('Màu sắc chính', 'dropCapPrimaryColor'), renderColorControl('dropCapPrimaryColor', '#3b82f6'))}
                {(props.dropCapView === 'framed' || props.dropCapView === 'boxed') && renderStyleRow(renderResponsiveLabel('Màu sắc phụ', 'dropCapSecondaryColor'), renderColorControl('dropCapSecondaryColor', '#ffffff'))}
                
                <>
                  {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'dropCapTextShadow'), renderEditButton(`dropCapTextShadow-${selected.id}`, null, () => updateProp('dropCapTextShadow', 'none'), props.dropCapTextShadow && props.dropCapTextShadow !== 'none'))}
                  {renderPopoverPanel(`dropCapTextShadow-${selected.id}`, renderTextShadowPopover('dropCapTextShadow'))}
                </>

                {renderStyleRow(renderResponsiveLabel('Không gian', 'dropCapSpace'), renderUnitControl('dropCapSpace', '8', 'px', { min: 0, max: 100 }))}
                
                {(props.dropCapView === 'framed' || props.dropCapView === 'boxed') && (
                  renderStyleRow(renderResponsiveLabel('Bán kính đường viền', 'dropCapBorderRadius'), renderUnitControl('dropCapBorderRadius', '0', 'px', { min: 0, max: 100 }, ['px', '%']))
                )}
                {props.dropCapView === 'framed' && (
                  renderStyleRow(renderResponsiveLabel('Độ dày viền', 'dropCapBorderWidth'), renderUnitControl('dropCapBorderWidth', '3', 'px', { min: 1, max: 20 }))
                )}

                {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'dropCap'), renderEditButton(`dropCap-type-${selected.id}`, null, () => {
                  updateProp('dropCapFontFamily', undefined);
                  updateProp('dropCapSize', undefined);
                  updateProp('dropCapFontWeight', undefined);
                }, !!props.dropCapFontFamily || !!props.dropCapSize || !!props.dropCapFontWeight))}
                {renderPopoverPanel(`dropCap-type-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Gia đình</span>
                      <select value={props.dropCapFontFamily || ''} onChange={(e) => updateProp('dropCapFontFamily', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white">
                        <option value="">Mặc định</option>
                        <optgroup label="Tất cả Font chữ Google">
                          {GOOGLE_FONTS.map((font: string) => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kích thước</span>
                      {renderUnitControl('dropCapSize', '3.2', 'em', { min: 1, max: 10 }, ['em', 'px', 'rem'])}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ đậm</span>
                      <select value={props.dropCapFontWeight || '800'} onChange={(e) => updateProp('dropCapFontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full">
                        <option value="100">100 (Rất mỏng)</option>
                        <option value="200">200 (Mỏng nhẹ)</option>
                        <option value="300">300 (Mỏng)</option>
                        <option value="400">400 (Bình thường)</option>
                        <option value="500">500 (Trung bình)</option>
                        <option value="600">600 (Nửa đậm)</option>
                        <option value="700">700 (Đậm)</option>
                        <option value="800">800 (Rất đậm)</option>
                        <option value="900">900 (Đen)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </>
            ))}

            {name === 'Nút bấm' && renderStyleSection('Nút bấm', (
              <>
                {renderStyleRow(renderResponsiveLabel('Vị trí', 'align'), renderSegmentedControl(props.align,
                  'center',
                  [
                    { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                    { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                    { value: 'right', label: <Lucide.AlignRight size={14} /> },
                    { value: 'justify', label: <Lucide.AlignJustify size={14} /> },
                  ] as const,
                  (value: string) => updateProp('align', value)
                ))}

                {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'btn'), renderEditButton(`btn-type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                {renderPopoverPanel(`btn-type-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Gia đình</span>
                      <select
                        value={props.fontFamily || 'Inter'}
                        onChange={(e) => updateProp('fontFamily', e.target.value)}
                        className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                      >
                        <optgroup label="Cài đặt website">
                          <option value="var(--site-font-family-heading)">Default: Heading font</option>
                          <option value="var(--site-font-family-body)">Default: Body font</option>
                          <option value="var(--site-font-family-small)">Default: Small font</option>
                          <option value="var(--site-font-family-button)">Default: Button font</option>
                        </optgroup>
                        <optgroup label="Tất cả Font chữ Google">
                          {GOOGLE_FONTS.map((font: string) => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kích thước</span>
                      {renderUnitControl('fontSize', '14', 'px', { min: 8, max: 80 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ đậm</span>
                      <select value={props.fontWeight || '600'} onChange={(e) => updateProp('fontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                        <option value="100">100 (Rất mỏng)</option>
                        <option value="200">200 (Mỏng nhẹ)</option>
                        <option value="300">300 (Mỏng)</option>
                        <option value="400">400 (Bình thường)</option>
                        <option value="500">500 (Trung bình)</option>
                        <option value="600">600 (Nửa đậm)</option>
                        <option value="700">700 (Đậm)</option>
                        <option value="800">800 (Rất đậm)</option>
                        <option value="900">900 (Đen)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Chuyển đổi</span>
                      <select value={props.textTransform || 'none'} onChange={(e) => updateProp('textTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                        <option value="none">Mặc định</option>
                        <option value="uppercase">In hoa</option>
                        <option value="lowercase">In thường</option>
                        <option value="capitalize">In hoa chữ cái đầu</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                      {renderSegmentedControl(props.fontStyle, 'normal', [
                        { value: 'normal', label: 'Bình thường' },
                        { value: 'italic', label: 'Nghiêng' },
                      ] as const, (value: string) => updateProp('fontStyle', value))}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Trang trí</span>
                      <select value={props.textDecoration || 'none'} onChange={(e) => updateProp('textDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                        <option value="none">Mặc định</option>
                        <option value="underline">Gạch chân</option>
                        <option value="overline">Gạch trên</option>
                        <option value="line-through">Gạch ngang</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ cao dòng</span>
                      {renderLineHeightControl()}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                      {renderUnitControl('letterSpacing', '0', 'px', { min: -5, max: 20 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Khoảng cách từ</span>
                      {renderUnitControl('wordSpacing', '0', 'px', { min: 0, max: 40 })}
                    </div>
                  </div>
                ))}

                {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'btn'), renderEditButton(`btn-shadow-${selected.id}`, null, handleResetTextShadow, isTextShadowModified))}
                {renderPopoverPanel(`btn-shadow-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Màu sắc</span>
                      {renderColorControl('textShadowColor', 'rgba(0, 0, 0, 0.3)')}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Ngang</span>
                      {renderUnitControl('textShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Dọc</span>
                      {renderUnitControl('textShadowVertical', '0', 'px', { min: -50, max: 50 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ mờ</span>
                      {renderUnitControl('textShadowBlur', '10', 'px', { min: 0, max: 100 })}
                    </div>
                  </div>
                ))}

                <div className="flex border-b border-slate-100 my-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTextHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'normal' }))}
                    className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                      activeTextHoverTab === 'normal'
                        ? 'border-brand-500 text-brand-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'hover' }))}
                    className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                      activeTextHoverTab === 'hover'
                        ? 'border-brand-500 text-brand-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Di chuột
                  </button>
                </div>

                {activeTextHoverTab === 'normal' ? (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColor'), renderColorControl('textColor', '#ffffff'))}
                    <div className="flex items-center gap-3 py-1">
                      <span className="text-[10px] font-medium text-slate-500 w-[82px] shrink-0">Loại nền</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateProp('backgroundType', 'classic')} className={`w-8 h-7 flex items-center justify-center border rounded ${(!props.backgroundType || props.backgroundType === 'classic') ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Cơ bản (Màu)">
                          <Lucide.PaintRoller size={13} className={(!props.backgroundType || props.backgroundType === 'classic') ? 'text-slate-700' : 'text-slate-400'} />
                        </button>
                        <button type="button" onClick={() => updateProp('backgroundType', 'gradient')} className={`w-8 h-7 flex items-center justify-center border rounded ${props.backgroundType === 'gradient' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Gradient">
                          <div className={`w-3.5 h-3.5 rounded-sm ${props.backgroundType === 'gradient' ? 'bg-gradient-to-br from-slate-400 to-slate-300' : 'bg-gradient-to-br from-slate-200 to-slate-100'}`} />
                        </button>
                      </div>
                    </div>
                    {props.backgroundType !== 'gradient' ? (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'backgroundColor'), renderColorControl('backgroundColor', '#3b82f6'))
                    ) : (
                      <div className="space-y-4 mt-3 pb-2 border-b border-slate-100/50">
                        <div className="p-2 border-l-2 border-yellow-400 bg-yellow-50 text-yellow-700 text-[10px] italic">
                          Đặt vị trí và góc cho mỗi điểm ngắt để đảm bảo chuyển màu thích nghi với các kích thước màn hình khác nhau.
                        </div>

                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'bgGradientColor1'), renderColorControl('bgGradientColor1', '#000000'))}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                            <span className="text-[9px] text-slate-400">%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="range" min="0" max="100" value={props[`bgGradientPos1`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <input type="number" min="0" max="100" value={props[`bgGradientPos1`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                          </div>
                        </div>

                        {renderStyleRow(renderResponsiveLabel('Màu thứ hai', 'bgGradientColor2'), renderColorControl('bgGradientColor2', '#ffffff'))}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                            <span className="text-[9px] text-slate-400">%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="range" min="0" max="100" value={props[`bgGradientPos2`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <input type="number" min="0" max="100" value={props[`bgGradientPos2`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-600 font-bold">Kiểu</label>
                          <select value={props[`bgGradientType`] || 'linear'} onChange={(e) => updateProp(`bgGradientType`, e.target.value)} className="w-full h-7 px-2 border border-slate-200 rounded text-[10px] outline-none bg-white">
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                          </select>
                        </div>

                        {(!props[`bgGradientType`] || props[`bgGradientType`] === 'linear') && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-slate-600 font-bold">Góc</label>
                              <span className="text-[9px] text-slate-400">deg</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <input type="range" min="0" max="360" value={props[`bgGradientAngle`] ?? 180} onChange={(e) => updateProp(`bgGradientAngle`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                              <input type="number" min="0" max="360" value={props[`bgGradientAngle`] ?? 180} onChange={(e) => updateProp(`bgGradientAngle`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColorHover'), renderColorControl('textColorHover', '#ffffff'))}
                    <div className="flex items-center gap-3 py-1">
                      <span className="text-[10px] font-medium text-slate-500 w-[82px] shrink-0">Loại nền</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateProp('backgroundTypeHover', 'classic')} className={`w-8 h-7 flex items-center justify-center border rounded ${(!props.backgroundTypeHover || props.backgroundTypeHover === 'classic') ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Cơ bản (Màu)">
                          <Lucide.PaintRoller size={13} className={(!props.backgroundTypeHover || props.backgroundTypeHover === 'classic') ? 'text-slate-700' : 'text-slate-400'} />
                        </button>
                        <button type="button" onClick={() => updateProp('backgroundTypeHover', 'gradient')} className={`w-8 h-7 flex items-center justify-center border rounded ${props.backgroundTypeHover === 'gradient' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Gradient">
                          <div className={`w-3.5 h-3.5 rounded-sm ${props.backgroundTypeHover === 'gradient' ? 'bg-gradient-to-br from-slate-400 to-slate-300' : 'bg-gradient-to-br from-slate-200 to-slate-100'}`} />
                        </button>
                      </div>
                    </div>
                    {props.backgroundTypeHover !== 'gradient' ? (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'backgroundColorHover'), renderColorControl('backgroundColorHover', '#2563eb'))
                    ) : (
                      <div className="space-y-4 mt-3 pb-2 border-b border-slate-100/50">
                        <div className="p-2 border-l-2 border-yellow-400 bg-yellow-50 text-yellow-700 text-[10px] italic">
                          Đặt vị trí và góc cho mỗi điểm ngắt để đảm bảo chuyển màu thích nghi với các kích thước màn hình khác nhau.
                        </div>

                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'bgGradientColor1Hover'), renderColorControl('bgGradientColor1Hover', '#000000'))}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                            <span className="text-[9px] text-slate-400">%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="range" min="0" max="100" value={props[`bgGradientPos1Hover`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1Hover`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <input type="number" min="0" max="100" value={props[`bgGradientPos1Hover`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1Hover`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                          </div>
                        </div>

                        {renderStyleRow(renderResponsiveLabel('Màu thứ hai', 'bgGradientColor2Hover'), renderColorControl('bgGradientColor2Hover', '#ffffff'))}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                            <span className="text-[9px] text-slate-400">%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="range" min="0" max="100" value={props[`bgGradientPos2Hover`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2Hover`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <input type="number" min="0" max="100" value={props[`bgGradientPos2Hover`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2Hover`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-600 font-bold">Kiểu</label>
                          <select value={props[`bgGradientTypeHover`] || 'linear'} onChange={(e) => updateProp(`bgGradientTypeHover`, e.target.value)} className="w-full h-7 px-2 border border-slate-200 rounded text-[10px] outline-none bg-white">
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                          </select>
                        </div>

                        {(!props[`bgGradientTypeHover`] || props[`bgGradientTypeHover`] === 'linear') && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-slate-600 font-bold">Góc</label>
                              <span className="text-[9px] text-slate-400">deg</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <input type="range" min="0" max="360" value={props[`bgGradientAngleHover`] ?? 180} onChange={(e) => updateProp(`bgGradientAngleHover`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                              <input type="number" min="0" max="360" value={props[`bgGradientAngleHover`] ?? 180} onChange={(e) => updateProp(`bgGradientAngleHover`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 mb-2 h-[1px] bg-slate-100 w-full" />

                {renderStyleRow(renderResponsiveLabel('Độ bóng', 'btn'), renderEditButton(`btn-boxshadow-${selected.id}`, null, () => {}, false))}
                {renderPopoverPanel(`btn-boxshadow-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Màu sắc</span>
                      {renderColorControl('boxShadowColor', 'rgba(0, 0, 0, 0.1)')}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Ngang</span>
                      {renderUnitControl('boxShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Dọc</span>
                      {renderUnitControl('boxShadowVertical', '4', 'px', { min: -50, max: 50 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ mờ</span>
                      {renderUnitControl('boxShadowBlur', '6', 'px', { min: 0, max: 100 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ lan</span>
                      {renderUnitControl('boxShadowSpread', '-1', 'px', { min: -50, max: 50 })}
                    </div>
                  </div>
                ))}

                {renderStyleRow('Loại đường viền', (
                  <select
                    value={props.btnBorderStyle || 'none'}
                    onChange={(e) => updateProp('btnBorderStyle', e.target.value)}
                    className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                  >
                    <option value="none">Mặc định</option>
                    <option value="solid">Nét liền dải (Solid)</option>
                    <option value="double">Nét đôi (Double)</option>
                    <option value="dotted">Nét chấm (Dotted)</option>
                    <option value="dashed">Nét đứt (Dashed)</option>
                    <option value="hidden">Ẩn (Hidden)</option>
                  </select>
                ))}

                {props.btnBorderStyle && props.btnBorderStyle !== 'none' && (
                  <>
                    {renderSpacingControl('btnBorder', 'Độ dày viền', ['btnBorderTopWidth', 'btnBorderRightWidth', 'btnBorderBottomWidth', 'btnBorderLeftWidth'])}
                    {renderStyleRow(renderResponsiveLabel('Màu viền', 'btnBorderColor'), renderColorControl('btnBorderColor', '#cbd5e1'))}
                  </>
                )}

                <div className="mt-2 space-y-4 pt-2 border-t border-slate-100">
                  {renderSpacingControl('btnBorderRadius', 'Bo viền', ['btnBorderTopLeftRadius', 'btnBorderTopRightRadius', 'btnBorderBottomRightRadius', 'btnBorderBottomLeftRadius'])}
                  {renderSpacingControl('padding', 'Lề trong', ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'])}
                </div>
              </>
            ))}


            {name === 'Video' && (
              <div className="space-y-4 font-sans">
                {/* Accordion Video Styling */}
                {renderAccordionSection('video_block_style_video', 'Video', (
                  <div className="space-y-3.5 pt-1">
                    {/* Tỷ lệ khung hình */}
                    {renderStyleRow('Tỷ lệ khung hình', (
                      <select
                        value={props.ratio || '16/9'}
                        onChange={(e) => updateProp('ratio', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none cursor-pointer focus:border-brand-500 bg-white"
                      >
                        <option value="16/9">16:9</option>
                        <option value="4/3">4:3</option>
                        <option value="3/2">3:2</option>
                        <option value="1/1">1:1</option>
                        <option value="9/16">9:16</option>
                        <option value="21/9">21:9</option>
                        <option value="16/10">16:10</option>
                      </select>
                    ))}

                    {/* Bộ lọc CSS */}
                    {(() => {
                      const currentFilterStr = props.cssFilters || 'none';
                      const filters = parseCssFilters(currentFilterStr);
                      const handleFilterSliderChange = (key: keyof typeof filters, value: number) => {
                        const newFilters = { ...filters, [key]: value };
                        const serialized = serializeCssFilters(newFilters);
                        updateProp('cssFilters', serialized);
                      };

                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Bộ lọc CSS', 'filters'), renderEditButton(`filters-${selected.id}-video`,
                              null,
                              () => updateProp('cssFilters', 'none'),
                              currentFilterStr && currentFilterStr !== 'none'
                            )
                          )}
                          {renderPopoverPanel(`filters-${selected.id}-video`, (
                            <div className="space-y-3.5 w-[220px] text-[10px] font-sans">
                              <div className="font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-2.5">
                                Bộ lọc CSS
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Làm mờ (Blur)</span>
                                  <span className="font-mono">{filters.blur}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={filters.blur}
                                  onChange={(e) => handleFilterSliderChange('blur', parseInt(e.target.value))}
                                  className="w-full elementor-slider"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Độ sáng (Brightness)</span>
                                  <span className="font-mono">{filters.brightness}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  step="1"
                                  value={filters.brightness}
                                  onChange={(e) => handleFilterSliderChange('brightness', parseInt(e.target.value))}
                                  className="w-full elementor-slider"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Độ tương phản (Contrast)</span>
                                  <span className="font-mono">{filters.contrast}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  step="1"
                                  value={filters.contrast}
                                  onChange={(e) => handleFilterSliderChange('contrast', parseInt(e.target.value))}
                                  className="w-full elementor-slider"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Độ bão hòa (Saturation)</span>
                                  <span className="font-mono">{filters.saturate}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  step="1"
                                  value={filters.saturate}
                                  onChange={(e) => handleFilterSliderChange('saturate', parseInt(e.target.value))}
                                  className="w-full elementor-slider"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Tông màu (Hue Rotate)</span>
                                  <span className="font-mono">{filters.hueRotate}deg</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  step="1"
                                  value={filters.hueRotate}
                                  onChange={(e) => handleFilterSliderChange('hueRotate', parseInt(e.target.value))}
                                  className="w-full elementor-slider"
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ), true)}

                {/* Accordion Image Overlay Styling */}
                {props.showOverlay && renderAccordionSection('video_block_style_overlay', 'Lớp phủ hình ảnh', (
                  <div className="space-y-3.5 pt-1">
                    {props.showPlayIcon !== false && (
                      <>
                        <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px] pb-1 border-b border-slate-100 mb-1">
                          Icon phát
                        </div>

                        {/* Màu sắc */}
                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'playIconColor'), renderColorControl('playIconColor', '#ffffff'))}

                        {/* Kích thước */}
                        {renderStyleRow(renderResponsiveLabel('Kích thước', 'playIconSize'), renderUnitControl('playIconSize', '60', 'px', { min: 10, max: 200 }, ['px']))}

                        {/* Hiệu ứng đổ bóng */}
                        {renderStyleRow(renderResponsiveLabel('Hiệu ứng đổ bóng', 'shadow'), renderEditButton(`shadow-${selected.id}-playicon`,
                            null,
                            () => {
                              updateProp('playIconShadowColor', 'rgba(0,0,0,0.3)');
                              updateProp('playIconShadowHorizontal', '0');
                              updateProp('playIconShadowVertical', '10');
                              updateProp('playIconShadowBlur', '25');
                              updateProp('playIconShadowSpread', '0');
                            },
                            Boolean(props.playIconShadowColor && props.playIconShadowColor !== 'none')
                          )
                        )}
                        {renderPopoverPanel(`shadow-${selected.id}-playicon`, (
                          <div className="space-y-3">
                            <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                              <span className="font-medium text-slate-500">Màu sắc</span>
                              {renderColorControl('playIconShadowColor', 'rgba(0, 0, 0, 0.3)')}
                            </div>
                            <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                              <span className="font-medium text-slate-500">Ngang</span>
                              {renderUnitControl('playIconShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                            </div>
                            <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                              <span className="font-medium text-slate-500">Dọc</span>
                              {renderUnitControl('playIconShadowVertical', '10', 'px', { min: -50, max: 50 })}
                            </div>
                            <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                              <span className="font-medium text-slate-500">Độ mờ</span>
                              {renderUnitControl('playIconShadowBlur', '25', 'px', { min: 0, max: 100 })}
                            </div>
                            <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                              <span className="font-medium text-slate-500">Độ lan</span>
                              {renderUnitControl('playIconShadowSpread', '0', 'px', { min: -50, max: 50 })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ), false)}
              </div>
            )}



            {(name === 'Vùng chứa' || name === 'Lưới') && renderStyleSection('Nền', (
              <>
                {renderStyleRow(renderResponsiveLabel('Màu nền', 'backgroundColor'), renderColorControl('backgroundColor', '#ffffff'))}
                {(name === 'Vùng chứa' || name === 'Lưới') && renderStyleRow('Dải màu', <input type="text" value={props.backgroundGradient || ''} onChange={(e) => updateProp('backgroundGradient', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-brand-500" placeholder="linear-gradient(...)" />)}
                {(name === 'Vùng chứa' || name === 'Lưới') && renderStyleRow('Ảnh nền', (
                  <button type="button" onClick={() => onOpenMedia((url: string) => updateProp('backgroundImage', url))} className="h-7 w-full rounded border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500 hover:border-brand-400 hover:text-brand-600">
                    {props.backgroundImage ? 'Sửa ảnh nền' : 'Chọn ảnh nền'}
                  </button>
                ))}
              </>
            ))}

            {name === 'Hình ảnh' && renderStyleSection('Hình ảnh', (
              <>
                {/* Object fit */}
                {renderStyleRow(renderResponsiveLabel('Object fit', 'objectFit'), renderSegmentedControl(props.objectFit, 'cover', [
                  { value: 'cover', label: 'Cover' },
                  { value: 'contain', label: 'Contain' },
                  { value: 'fill', label: 'Fill' },
                ] as const, (value: string) => updateProp('objectFit', value)))}

                {/* Alignment (Căn chỉnh) with responsive desktop icon */}
                {renderStyleRow(
                  renderResponsiveLabel('Căn chỉnh', 'align'),
                  renderSegmentedControl(
                    props.align,
                    'center',
                    [
                      { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                      { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                      { value: 'right', label: <Lucide.AlignRight size={14} /> },
                    ] as const,
                    (value: string) => updateProp('align', value)
                  )
                )}

                {/* Width (Chiều rộng) */}
                {renderStyleRow(
                  renderResponsiveLabel('Chiều rộng', 'imageWidth'),
                  renderUnitControl(
                    'imageWidth', '100', '%', { min: 0, max: 100 }, ['%', 'px', 'vw'])
                )}

                {/* Max Width (Chiều rộng tối đa) */}
                {renderStyleRow(
                  renderResponsiveLabel('Chiều rộng tối đa', 'imageMaxWidth'),
                  renderUnitControl(
                    'imageMaxWidth', '100', '%', { min: 0, max: 100 }, ['%', 'px', 'vw'])
                )}

                {/* Height (Chiều cao) */}
                {renderStyleRow(
                  renderResponsiveLabel('Chiều cao', 'imageHeight'),
                  renderUnitControl(
                    'imageHeight', 'auto', 'px', { min: 0, max: 1000 }, ['px', 'vh', 'em', 'rem', 'auto'])
                )}

                {/* Separator line */}
                <div className="border-t border-slate-100 my-2" />

                {/* State tabs */}
                <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => setImageStyleTab('normal')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      imageStyleTab === 'normal'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                  >
                    Bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageStyleTab('hover')}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      imageStyleTab === 'hover'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                  >
                    Di chuột
                  </button>
                </div>

                {/* Normal / Hover states content */}
                {(() => {
                  const opacityProp = imageStyleTab === 'normal' ? 'opacity' : 'opacityHover';
                  const filterProp = imageStyleTab === 'normal' ? 'cssFilters' : 'cssFiltersHover';
                  const shadowProp = imageStyleTab === 'normal' ? 'boxShadow' : 'boxShadowHover';
                  
                  const currentOpacity = props[opacityProp] !== undefined ? props[opacityProp] : 1;
                  const currentFilterStr = props[filterProp] || 'none';
                  const currentShadowStr = props[shadowProp] || 'none';

                  const filters = parseCssFilters(currentFilterStr);
                  const shadow = parseBoxShadow(currentShadowStr);

                  const handleFilterSliderChange = (key: keyof typeof filters, value: number) => {
                    const newFilters = { ...filters, [key]: value };
                    const serialized = serializeCssFilters(newFilters);
                    updateProp(filterProp, serialized);
                  };

                  const handleShadowChange = (key: keyof typeof shadow, value: any) => {
                    const newShadow = { ...shadow, [key]: value };
                    const serialized = serializeBoxShadow(newShadow);
                    updateProp(shadowProp, serialized);
                  };

                  return (
                    <div className="space-y-2.5 mt-2">
                      {/* Opacity */}
                      {renderStyleRow(
                        'Độ trong suốt',
                        <div className="grid grid-cols-[1fr_64px] items-center gap-1.5">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={parseFloat(String(currentOpacity)) || 0}
                            onChange={(e) => updateProp(opacityProp, e.target.value)}
                            className="elementor-slider"
                          />
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={currentOpacity}
                            onChange={(e) => updateProp(opacityProp, e.target.value)}
                            className="h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500 bg-white"
                          />
                        </div>
                      )}

                      {/* CSS Filters visual editor popover */}
                      {renderStyleRow(renderResponsiveLabel('Bộ lọc CSS', 'filters'), renderEditButton(`filters-${selected.id}-${imageStyleTab}`,
                          null,
                          () => updateProp(filterProp, 'none'),
                          currentFilterStr && currentFilterStr !== 'none'
                        )
                      )}
                      {renderPopoverPanel(`filters-${selected.id}-${imageStyleTab}`, (
                        <div className="space-y-3.5 w-[220px] text-[10px] font-sans">
                          <div className="font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-2.5">
                            Bộ lọc CSS ({imageStyleTab === 'normal' ? 'Bình thường' : 'Di chuột'})
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Làm mờ (Blur)</span>
                              <span className="font-mono">{filters.blur}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="1"
                              value={filters.blur}
                              onChange={(e) => handleFilterSliderChange('blur', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Độ sáng (Brightness)</span>
                              <span className="font-mono">{filters.brightness}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              step="1"
                              value={filters.brightness}
                              onChange={(e) => handleFilterSliderChange('brightness', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Độ tương phản (Contrast)</span>
                              <span className="font-mono">{filters.contrast}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              step="1"
                              value={filters.contrast}
                              onChange={(e) => handleFilterSliderChange('contrast', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Độ bão hòa (Saturation)</span>
                              <span className="font-mono">{filters.saturate}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              step="1"
                              value={filters.saturate}
                              onChange={(e) => handleFilterSliderChange('saturate', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Xoay màu (Hue Rotate)</span>
                              <span className="font-mono">{filters.hueRotate}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="1"
                              value={filters.hueRotate}
                              onChange={(e) => handleFilterSliderChange('hueRotate', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Box Shadow visual editor popover */}
                      {renderStyleRow(renderResponsiveLabel('Đổ bóng', 'shadow'), renderEditButton(`shadow-${selected.id}-${imageStyleTab}`,
                          null,
                          () => updateProp(shadowProp, 'none'),
                          currentShadowStr && currentShadowStr !== 'none'
                        )
                      )}
                      {renderPopoverPanel(`shadow-${selected.id}-${imageStyleTab}`, (
                        <div className="space-y-3.5 w-[220px] text-[10px] font-sans">
                          <div className="font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-2.5">
                            Đổ bóng ({imageStyleTab === 'normal' ? 'Bình thường' : 'Di chuột'})
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Vị trí ngang (Horizontal)</span>
                              <span className="font-mono">{shadow.horizontal}px</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={shadow.horizontal}
                              onChange={(e) => handleShadowChange('horizontal', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Vị trí dọc (Vertical)</span>
                              <span className="font-mono">{shadow.vertical}px</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={shadow.vertical}
                              onChange={(e) => handleShadowChange('vertical', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Độ mờ (Blur)</span>
                              <span className="font-mono">{shadow.blur}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={shadow.blur}
                              onChange={(e) => handleShadowChange('blur', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium text-slate-500">
                              <span>Độ rộng (Spread)</span>
                              <span className="font-mono">{shadow.spread}px</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={shadow.spread}
                              onChange={(e) => handleShadowChange('spread', parseInt(e.target.value))}
                              className="w-full elementor-slider"
                            />
                          </div>

                          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                            <span className="font-medium text-slate-500">Màu sắc</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={shadow.color.startsWith('#') ? shadow.color : '#000000'}
                                onChange={(e) => handleShadowChange('color', e.target.value)}
                                className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                              />
                              <input
                                type="text"
                                value={shadow.color}
                                onChange={(e) => handleShadowChange('color', e.target.value)}
                                className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-mono text-slate-700 outline-none focus:border-brand-500 bg-white"
                                placeholder="rgba(0,0,0,0.1)"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                            <span className="font-medium text-slate-500">Trong/Ngoài</span>
                            <select
                              value={shadow.inset ? 'inset' : 'outline'}
                              onChange={(e) => handleShadowChange('inset', e.target.value === 'inset')}
                              className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white cursor-pointer"
                            >
                              <option value="outline">Ngoài (Outline)</option>
                              <option value="inset">Trong (Inset)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Separator line */}
                <div className="border-t border-slate-100 my-2" />

                {/* Border Type */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-600 font-bold">Loại đường viền</label>
                  <select
                    value={props.borderType || 'none'}
                    onChange={(e) => updateProp('borderType', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none cursor-pointer"
                  >
                    <option value="none">Mặc định</option>
                    <option value="solid">Nét liền dải (Solid)</option>
                    <option value="double">Nét đôi (Double)</option>
                    <option value="dotted">Nét chấm (Dotted)</option>
                    <option value="dashed">Nét đứt (Dashed)</option>
                    <option value="hidden">Ẩn (Hidden)</option>
                  </select>
                </div>

                {props.borderType && props.borderType !== 'none' && (
                  <>
                    {renderSpacingControl('border', 'Độ dày viền', ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'])}
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'borderColor'), renderColorControl('borderColor', '#000000'))}
                  </>
                )}

                {/* Border Radius */}
                <div className="pt-2 border-t border-slate-100">
                  {renderSpacingControl('borderRadius', 'Bo viền', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'] as const)}
                </div>
              </>
            ))}

            {name === 'Đường phân cách' && renderStyleSection('Đường phân cách', (
              <>
                {renderStyleRow(renderResponsiveLabel('Màu sắc', 'color'), renderColorControl('color', '#cbd5e1'))}
                {renderStyleRow(renderResponsiveLabel('Độ đậm', 'thickness'), renderUnitControl('thickness', '1', 'px', { min: 1, max: 100 }))}
                {renderStyleRow(renderResponsiveLabel('Khoảng trống', 'gap'), renderUnitControl('gap', '15', 'px', { min: 2, max: 100 }))}
              </>
            ))}

            {name === 'Đường phân cách' && props.elementType === 'text' && renderStyleSection('Văn bản', (
              <>
                {renderStyleRow(renderResponsiveLabel('Màu sắc', 'textColor'), renderColorControl('textColor', '#334155'))}
                {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'div'), renderEditButton(`div-type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                {renderPopoverPanel(`div-type-${selected.id}`, (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Gia đình</span>
                      <select
                        value={props.fontFamily || 'Inter'}
                        onChange={(e) => updateProp('fontFamily', e.target.value)}
                        className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                      >
                        <optgroup label="Cài đặt website">
                          <option value="var(--site-font-family-heading)">Default: Heading font</option>
                          <option value="var(--site-font-family-body)">Default: Body font</option>
                          <option value="var(--site-font-family-small)">Default: Small font</option>
                          <option value="var(--site-font-family-button)">Default: Button font</option>
                        </optgroup>
                        <optgroup label="Tất cả Font chữ Google">
                          {GOOGLE_FONTS.map((font: string) => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kích thước</span>
                      {renderUnitControl('fontSize', '16', 'px', { min: 10, max: 80 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ đậm</span>
                      <select value={props.fontWeight || '400'} onChange={(e) => updateProp('fontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                        <option value="100">100 (Rất mỏng)</option>
                        <option value="200">200 (Mỏng nhẹ)</option>
                        <option value="300">300 (Mỏng)</option>
                        <option value="400">400 (Bình thường)</option>
                        <option value="500">500 (Trung bình)</option>
                        <option value="600">600 (Nửa đậm)</option>
                        <option value="700">700 (Đậm)</option>
                        <option value="800">800 (Rất đậm)</option>
                        <option value="900">900 (Đen)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Chuyển đổi</span>
                      <select value={props.textTransform || 'none'} onChange={(e) => updateProp('textTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                        <option value="none">Mặc định</option>
                        <option value="uppercase">In hoa</option>
                        <option value="lowercase">In thường</option>
                        <option value="capitalize">In hoa chữ cái đầu</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                      {renderSegmentedControl(props.fontStyle, 'normal', [
                        { value: 'normal', label: 'Bình thường' },
                        { value: 'italic', label: 'Nghiêng' },
                      ] as const, (value: string) => updateProp('fontStyle', value))}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Trang trí</span>
                      <select value={props.textDecoration || 'none'} onChange={(e) => updateProp('textDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                        <option value="none">Mặc định</option>
                        <option value="underline">Gạch chân</option>
                        <option value="overline">Gạch trên</option>
                        <option value="line-through">Gạch ngang</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ cao dòng</span>
                      {renderLineHeightControl()}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                      {renderUnitControl('letterSpacing', '0', 'px', { min: -5, max: 20 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Khoảng cách từ</span>
                      {renderUnitControl('wordSpacing', '0', 'px', { min: 0, max: 40 })}
                    </div>
                  </div>
                ))}
                {renderStyleRow(renderResponsiveLabel('Vị trí', 'elementPosition'), renderSegmentedControl(props.elementPosition,
                  'center',
                  [
                    { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                    { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                    { value: 'right', label: <Lucide.AlignRight size={14} /> },
                  ] as const,
                  (value: string) => updateProp('elementPosition', value)
                ))}
                {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'elementSpacing'), renderUnitControl('elementSpacing', '15', 'px', { min: 0, max: 100 }))}
              </>
            ))}

            {name === 'Đường phân cách' && props.elementType === 'icon' && renderStyleSection('Biểu tượng', (
              <>
                {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '24', 'px', { min: 8, max: 120 }))}
                {renderStyleRow(renderResponsiveLabel('Màu sắc chính', 'iconColor'), renderColorControl('iconColor', '#334155'))}
                {renderStyleRow(renderResponsiveLabel('Vị trí', 'elementPosition'), renderSegmentedControl(props.elementPosition,
                  'center',
                  [
                    { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                    { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                    { value: 'right', label: <Lucide.AlignRight size={14} /> },
                  ] as const,
                  (value: string) => updateProp('elementPosition', value)
                ))}
                {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'elementSpacing'), renderUnitControl('elementSpacing', '15', 'px', { min: 0, max: 100 }))}
                {renderStyleRow(renderResponsiveLabel('Xoay', 'iconRotate'), renderUnitControl('iconRotate', '0', 'deg', { min: 0, max: 360 }))}
              </>
            ))}

            {name === 'Biểu tượng' && renderStyleSection('Biểu tượng', (
              <>
                {/* Căn chỉnh */}
                {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align,
                  'center',
                  [
                    { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                    { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                    { value: 'right', label: <Lucide.AlignRight size={14} /> },
                  ] as const,
                  (value: string) => updateProp('align', value)
                ))}

                {/* Bình thường / Di chuột tabs */}
                <div className="flex border-b border-slate-100 my-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveIconHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'normal' }))}
                    className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                      activeIconHoverTab === 'normal'
                        ? 'border-brand-500 text-brand-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIconHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'hover' }))}
                    className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                      activeIconHoverTab === 'hover'
                        ? 'border-brand-500 text-brand-600 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Di chuột
                  </button>
                </div>

                {activeIconHoverTab === 'normal' ? (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    {renderStyleRow(
                      props.iconView === 'default' || !props.iconView ? 'Màu sắc chính' : 'Màu sắc chính',
                      renderColorControl('primaryColor', '#3b82f6')
                    )}
                    {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Màu sắc phụ', 'secondaryColor'), renderColorControl('secondaryColor', '#ffffff')
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    {renderStyleRow(
                      props.iconView === 'default' || !props.iconView ? 'Màu sắc chính' : 'Màu sắc chính',
                      renderColorControl('primaryColorHover', '#3b82f6')
                    )}
                    {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Màu sắc phụ', 'secondaryColorHover'), renderColorControl('secondaryColorHover', '#ffffff')
                    )}
                  </div>
                )}

                <div className="mt-2.5 space-y-2.5 border-t border-slate-100 pt-2.5">
                  {/* Kích thước */}
                  {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '30', 'px', { min: 12, max: 200 }))}

                  {/* Lề trong */}
                  {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Lề trong', 'paddingProp'), renderUnitControl('paddingProp', '10', 'px', { min: 0, max: 100 })
                  )}

                  {/* Xoay */}
                  {renderStyleRow(renderResponsiveLabel('Xoay', 'iconRotate'), renderUnitControl('iconRotate', '0', 'deg', { min: 0, max: 360 }))}

                  {/* Độ rộng viền */}
                  {props.iconView === 'framed' && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'badgeBorderWidth',
                        'Độ rộng viền',
                        ['badgeBorderTopWidth', 'badgeBorderRightWidth', 'badgeBorderBottomWidth', 'badgeBorderLeftWidth']
                      )}
                    </div>
                  )}

                  {/* Bo viền */}
                  {(props.iconView === 'stacked' || props.iconView === 'framed') && props.iconShape === 'rounded' && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'badgeBorderRadius',
                        'Bo viền',
                        ['badgeBorderTopLeftRadius', 'badgeBorderTopRightRadius', 'badgeBorderBottomRightRadius', 'badgeBorderBottomLeftRadius']
                      )}
                    </div>
                  )}
                </div>
              </>
            ))}

            {(name === 'Icon Mạng Xã Hội' || name === 'SocialIconsBlock') && renderStyleSection('Kiểu hiển thị Icon', (
              <>
                <div className="space-y-2.5">
                  {/* Kích thước */}
                  {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '20', 'px', { min: 10, max: 150 }))}

                  {/* Lề trong */}
                  {renderStyleRow(renderResponsiveLabel('Lề trong', 'iconPadding'), renderUnitControl('iconPadding', '8', 'px', { min: 0, max: 100 }))}

                  {/* Khoảng cách ngang */}
                  {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'iconSpacing'), renderUnitControl('iconSpacing', '10', 'px', { min: 0, max: 100 }))}

                  {/* Khoảng cách hàng */}
                  {renderStyleRow(renderResponsiveLabel('Khoảng cách hàng', 'iconRowGap'), renderUnitControl('iconRowGap', '10', 'px', { min: 0, max: 100 }))}

                  {/* Bo góc (nếu shape là rounded) */}
                  {props.shape === 'rounded' && renderStyleRow(renderResponsiveLabel('Bo góc tròn', 'customBorderRadius'), renderUnitControl('customBorderRadius', '8', 'px', { min: 0, max: 100 })
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Hiệu ứng Hover</label>
                  
                  {renderStyleRow('Hiệu ứng động', (
                    <select
                      value={props.hoverAnimation || 'none'}
                      onChange={(e) => updateProp('hoverAnimation', e.target.value)}
                      className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                    >
                      <option value="none">Không có</option>
                      <option value="grow">Grow (Phóng to)</option>
                      <option value="shrink">Shrink (Thu nhỏ)</option>
                      <option value="pulse">Pulse (Nhịp tim)</option>
                      <option value="pulse-grow">Pulse Grow (Nhịp lớn)</option>
                      <option value="pulse-shrink">Pulse Shrink (Nhịp nhỏ)</option>
                      <option value="push">Push (Nhấn xuống)</option>
                      <option value="pop">Pop (Bật lên)</option>
                      <option value="bounce-in">Bounce In (Đẩy lùi)</option>
                    </select>
                  ))}

                  {renderStyleRow('Màu khi Hover', (
                    <select
                      value={props.hoverColorMode || 'none'}
                      onChange={(e) => updateProp('hoverColorMode', e.target.value)}
                      className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                    >
                      <option value="none">Mặc định (Không đổi)</option>
                      <option value="official">Màu thương hiệu</option>
                      <option value="custom">Màu tùy chỉnh</option>
                    </select>
                  ))}

                  {props.hoverColorMode === 'custom' && (
                    <div className="space-y-2.5 pt-1 pl-1 border-l-2 border-slate-100 animate-fade-in">
                      {renderStyleRow(renderResponsiveLabel('Màu icon hover', 'hoverCustomColor'), renderColorControl('hoverCustomColor', '#3b82f6'))}
                      {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Màu phụ hover', 'hoverCustomSecondaryColor'), renderColorControl('hoverCustomSecondaryColor', '#ffffff')
                      )}
                    </div>
                  )}
                </div>
              </>
            ))}

            {name === 'Hộp Icon' && (
              <>
                {/* 1. SECTION HỘP (BOX) */}
                {renderStyleSection('Hộp', (
                  <div className="space-y-3">
                    {/* Căn chỉnh */}
                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align,
                      'center',
                      [
                        { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                        { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                        { value: 'right', label: <Lucide.AlignRight size={14} /> },
                        { value: 'justify', label: <Lucide.AlignJustify size={14} /> },
                      ] as const,
                      (value: string) => updateProp('align', value)
                    ))}

                    {/* Vị trí Icon */}
                    {renderStyleRow(renderResponsiveLabel('Vị trí Icon', 'iconPosition'), renderSegmentedControl(props.iconPosition,
                      'top',
                      [
                        { value: 'left', label: 'Trái' },
                        { value: 'top', label: 'Trên' },
                        { value: 'right', label: 'Phải' },
                      ] as const,
                      (value: string) => updateProp('iconPosition', value)
                    ))}

                    {/* Khoảng cách Icon */}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách Icon', 'iconSpacing'), renderUnitControl('iconSpacing', '15', 'px', { min: 0, max: 100 }))}

                    {/* Khoảng cách nội dung */}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách nội dung', 'contentSpacing'), renderUnitControl('contentSpacing', '10', 'px', { min: 0, max: 100 }))}
                  </div>
                ))}

                {/* 2. SECTION BIỂU TƯỢNG */}
                {renderStyleSection('Biểu tượng', (
                  <div className="space-y-3">
                    {/* Bình thường / Di chuột tabs */}
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveIconHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'normal' }))}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconHoverTab === 'normal'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIconHoverTabByNodeId((prev: Record<string, 'normal' | 'hover'>) => ({ ...prev, [selected.id]: 'hover' }))}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconHoverTab === 'hover'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Di chuột
                      </button>
                    </div>

                    {activeIconHoverTab === 'normal' ? (
                      <div className="space-y-2.5 pt-1 animate-fade-in">
                        {renderStyleRow(renderResponsiveLabel('Màu sắc chính', 'iconColor'), renderColorControl('iconColor', '#3b82f6'))}
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1 animate-fade-in">
                        {renderStyleRow(renderResponsiveLabel('Màu sắc chính', 'iconColorHover'), renderColorControl('iconColorHover', '#2563eb'))}
                      </div>
                    )}

                    <div className="mt-2.5 space-y-2.5 border-t border-slate-100 pt-2.5">
                      {/* Kích thước */}
                      {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '30', 'px', { min: 12, max: 200 }))}

                      {/* Lề trong */}
                      {(props.iconView === 'stacked' || props.iconView === 'framed') && renderStyleRow(renderResponsiveLabel('Lề trong', 'paddingProp'), renderUnitControl('paddingProp', '10', 'px', { min: 0, max: 100 })
                      )}

                      {/* Xoay */}
                      {renderStyleRow(renderResponsiveLabel('Xoay', 'iconRotate'), renderUnitControl('iconRotate', '0', 'deg', { min: 0, max: 360 }))}

                      {/* Độ rộng viền */}
                      {props.iconView === 'framed' && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          {renderSpacingControl(
                            'badgeBorderWidth',
                            'Độ rộng viền',
                            ['badgeBorderTopWidth', 'badgeBorderRightWidth', 'badgeBorderBottomWidth', 'badgeBorderLeftWidth']
                          )}
                        </div>
                      )}

                      {/* Bo viền */}
                      {(props.iconView === 'stacked' || props.iconView === 'framed') && props.iconShape === 'rounded' && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          {renderSpacingControl(
                            'badgeBorderRadius',
                            'Bo viền',
                            ['badgeBorderTopLeftRadius', 'badgeBorderTopRightRadius', 'badgeBorderBottomRightRadius', 'badgeBorderBottomLeftRadius']
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* 3. SECTION NỘI DUNG (TITLE & DESCRIPTION) */}
                {renderStyleSection('Nội dung', (
                  <div className="space-y-4">
                    {/* --- TIÊU ĐỀ --- */}
                    <div className="space-y-2.5 border-b border-slate-100 pb-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiêu đề</div>
                      {renderStyleRow(renderResponsiveLabel('Màu chữ', 'titleColor'), renderColorControl('titleColor', '#1e293b'))}

                      {/* Tiêu đề typography popover */}
                      {(() => {
                        const isTitleTypoModified = props.titleFontFamily || props.titleFontSize !== '20px' || props.titleFontWeight !== '600' || props.titleFontStyle !== 'normal' || props.titleLineHeight || props.titleLetterSpacing || props.titleWordSpacing;
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'title'), renderEditButton(`title-type-${selected.id}`, null, () => {
                              updateProp('titleFontFamily', '');
                              updateProp('titleFontSize', '20px');
                              updateProp('titleFontWeight', '600');
                              updateProp('titleFontStyle', 'normal');
                              updateProp('titleLineHeight', '');
                              updateProp('titleLetterSpacing', '');
                              updateProp('titleWordSpacing', '');
                            }, isTitleTypoModified))}
                            {renderPopoverPanel(`title-type-${selected.id}`, renderTypographyFields('title', '20', '600'))}
                          </>
                        );
                      })()}

                      {/* Tiêu đề text shadow popover */}
                      {(() => {
                        const hasShadow = props.titleTextShadowColor && props.titleTextShadowColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-${selected.id}`, null, () => {
                              updateProp('titleTextShadowColor', 'transparent');
                              updateProp('titleTextShadowHorizontal', '0px');
                              updateProp('titleTextShadowVertical', '0px');
                              updateProp('titleTextShadowBlur', '0px');
                            }, hasShadow))}
                            {renderPopoverPanel(`titleShadow-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu sắc</span>
                                  {renderColorControl('titleTextShadowColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Ngang</span>
                                  {renderUnitControl('titleTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Dọc</span>
                                  {renderUnitControl('titleTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ mờ</span>
                                  {renderUnitControl('titleTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}

                      {/* Tiêu đề stroke popover */}
                      {(() => {
                        const hasStroke = props.titleTextStrokeWidth && props.titleTextStrokeWidth !== '0px' && props.titleTextStrokeColor && props.titleTextStrokeColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Viền chữ', 'titleStroke'), renderEditButton(`titleStroke-${selected.id}`, null, () => {
                              updateProp('titleTextStrokeColor', 'transparent');
                              updateProp('titleTextStrokeWidth', '0px');
                            }, hasStroke))}
                            {renderPopoverPanel(`titleStroke-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu viền</span>
                                  {renderColorControl('titleTextStrokeColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ dày</span>
                                  {renderUnitControl('titleTextStrokeWidth', '0', 'px', { min: 0, max: 20 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>

                    {/* --- MÔ TẢ --- */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả</div>
                      {renderStyleRow(renderResponsiveLabel('Màu chữ', 'descColor'), renderColorControl('descColor', '#475569'))}

                      {/* Mô tả typography popover */}
                      {(() => {
                        const isDescTypoModified = props.descFontFamily || props.descFontSize !== '14px' || props.descFontWeight !== '400' || props.descFontStyle !== 'normal' || props.descLineHeight || props.descLetterSpacing || props.descWordSpacing;
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'desc'), renderEditButton(`desc-type-${selected.id}`, null, () => {
                              updateProp('descFontFamily', '');
                              updateProp('descFontSize', '14px');
                              updateProp('descFontWeight', '400');
                              updateProp('descFontStyle', 'normal');
                              updateProp('descLineHeight', '');
                              updateProp('descLetterSpacing', '');
                              updateProp('descWordSpacing', '');
                            }, isDescTypoModified))}
                            {renderPopoverPanel(`desc-type-${selected.id}`, renderTypographyFields('desc', '14', '400'))}
                          </>
                        );
                      })()}

                      {/* Mô tả text shadow popover */}
                      {(() => {
                        const hasShadow = props.descTextShadowColor && props.descTextShadowColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'descShadow'), renderEditButton(`descShadow-${selected.id}`, null, () => {
                              updateProp('descTextShadowColor', 'transparent');
                              updateProp('descTextShadowHorizontal', '0px');
                              updateProp('descTextShadowVertical', '0px');
                              updateProp('descTextShadowBlur', '0px');
                            }, hasShadow))}
                            {renderPopoverPanel(`descShadow-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu sắc</span>
                                  {renderColorControl('descTextShadowColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Ngang</span>
                                  {renderUnitControl('descTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Dọc</span>
                                  {renderUnitControl('descTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ mờ</span>
                                  {renderUnitControl('descTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </>
            )}

            {name === 'Hộp hình ảnh' && (
              <>
                {/* 1. SECTION HỘP (BOX) */}
                {renderStyleSection('Hộp', (
                  <div className="space-y-3">
                    {/* Căn chỉnh */}
                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align,
                      'center',
                      [
                        { value: 'left', label: <Lucide.AlignLeft size={14} /> },
                        { value: 'center', label: <Lucide.AlignCenter size={14} /> },
                        { value: 'right', label: <Lucide.AlignRight size={14} /> },
                        { value: 'justify', label: <Lucide.AlignJustify size={14} /> },
                      ] as const,
                      (value: string) => updateProp('align', value)
                    ))}

                    {/* Vị trí Ảnh */}
                    {renderStyleRow(renderResponsiveLabel('Vị trí Ảnh', 'imagePosition'), renderSegmentedControl(props.imagePosition,
                      'top',
                      [
                        { value: 'left', label: 'Trái' },
                        { value: 'top', label: 'Trên' },
                        { value: 'right', label: 'Phải' },
                      ] as const,
                      (value: string) => updateProp('imagePosition', value)
                    ))}

                    {/* Khoảng cách Ảnh */}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách Ảnh', 'imageSpacing'), renderUnitControl('imageSpacing', '15', 'px', { min: 0, max: 100 }))}

                    {/* Khoảng cách nội dung */}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách nội dung', 'contentSpacing'), renderUnitControl('contentSpacing', '10', 'px', { min: 0, max: 100 }))}
                  </div>
                ))}

                {/* 2. SECTION HÌNH ẢNH */}
                {renderStyleSection('Hình ảnh', (
                  <div className="space-y-3">
                    <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-md">
                      <button
                        type="button"
                        onClick={() => setImageStyleTab('normal')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          imageStyleTab === 'normal'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800 border border-transparent'
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageStyleTab('hover')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          imageStyleTab === 'hover'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800 border border-transparent'
                        }`}
                      >
                        Di chuột
                      </button>
                    </div>

                    {renderStyleRow(renderResponsiveLabel('Chiều rộng', 'imageWidth'), renderUnitControl('imageWidth', '30', '%', { min: 0, max: 100 }, ['%', 'px']))}
                    {renderStyleRow(renderResponsiveLabel('Chiều cao', 'imageHeight'), renderUnitControl('imageHeight', 'auto', 'px', { min: 0, max: 1000 }, ['px', 'auto', 'vh', '%']))}
                    
                    {renderStyleRow('Object Fit', (
                      <select
                        value={props.objectFit || 'cover'}
                        onChange={(e) => updateProp('objectFit', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white focus:border-brand-500"
                      >
                        <option value="cover">Bao phủ (Cover)</option>
                        <option value="contain">Chứa trong (Contain)</option>
                        <option value="fill">Lấp đầy (Fill)</option>
                      </select>
                    ))}

                    {/* Normal / Hover states content */}
                    {(() => {
                      const opacityProp = imageStyleTab === 'normal' ? 'opacity' : 'opacityHover';
                      const filterProp = imageStyleTab === 'normal' ? 'cssFilters' : 'cssFiltersHover';
                      const shadowProp = imageStyleTab === 'normal' ? 'boxShadow' : 'boxShadowHover';
                      
                      const currentOpacity = props[opacityProp] !== undefined ? props[opacityProp] : 1;
                      const currentFilterStr = props[filterProp] || 'none';
                      const currentShadowStr = props[shadowProp] || 'none';

                      const filters = parseCssFilters(currentFilterStr);
                      const shadow = parseBoxShadow(currentShadowStr);

                      const handleFilterSliderChange = (key: keyof typeof filters, value: number) => {
                        const newFilters = { ...filters, [key]: value };
                        const serialized = serializeCssFilters(newFilters);
                        updateProp(filterProp, serialized);
                      };

                      return (
                        <div className="space-y-3 animate-fade-in mt-3 border-t border-slate-100 pt-3">
                          {renderStyleRow('Độ mờ', (
                            <div className="flex gap-2 items-center">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={currentOpacity}
                                onChange={(e) => updateProp(opacityProp, parseFloat(e.target.value))}
                                className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-[10px] font-mono w-6 text-right">{currentOpacity}</span>
                            </div>
                          ))}
                          {renderStyleRow('Độ mờ ảnh (Blur)', renderSliderControl('blur', filters.blur, { min: 0, max: 20, step: 1 }, handleFilterSliderChange))}
                          {renderStyleRow('Độ sáng', renderSliderControl('brightness', filters.brightness, { min: 0, max: 200, step: 5 }, handleFilterSliderChange))}
                          {renderStyleRow('Độ tương phản', renderSliderControl('contrast', filters.contrast, { min: 0, max: 200, step: 5 }, handleFilterSliderChange))}
                          {renderStyleRow('Bão hòa', renderSliderControl('saturate', filters.saturate, { min: 0, max: 200, step: 5 }, handleFilterSliderChange))}
                          {renderStyleRow('Xoay màu', renderSliderControl('hueRotate', filters.hueRotate, { min: 0, max: 360, step: 5 }, handleFilterSliderChange))}
                          
                          <div className="pt-2 border-t border-slate-100 mt-2">
                            {renderStyleRow(renderResponsiveLabel('Đổ bóng', 'imageBoxShadow'), renderEditButton(`imageBoxShadow-${imageStyleTab}-${selected.id}`, null, () => updateProp(shadowProp, 'none'), currentShadowStr !== 'none'))}
                            {renderPopoverPanel(`imageBoxShadow-${imageStyleTab}-${selected.id}`, renderBoxShadowFields(shadow, (newShadow) => {
                              updateProp(shadowProp, serializeBoxShadow(newShadow));
                            }))}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đường viền</div>
                      {renderStyleRow('Kiểu', (
                        <select
                          value={props.borderType || 'none'}
                          onChange={(e) => updateProp('borderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white"
                        >
                          <option value="none">Không có</option>
                          <option value="solid">Nét liền</option>
                          <option value="dashed">Nét đứt</option>
                          <option value="dotted">Chấm bi</option>
                          <option value="double">Nét đôi</option>
                        </select>
                      ))}

                      {props.borderType && props.borderType !== 'none' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'borderColor'), renderColorControl('borderColor', '#000000'))}
                          {renderSpacingControl(
                            'borderWidth',
                            'Độ rộng',
                            ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
                          )}
                        </>
                      )}

                      <div className="pt-2 border-t border-slate-100 mt-2">
                        {renderSpacingControl(
                          'borderRadius',
                          'Bo viền',
                          ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 3. SECTION NỘI DUNG (TITLE & DESCRIPTION) */}
                {renderStyleSection('Nội dung', (
                  <div className="space-y-4">
                    {/* --- TIÊU ĐỀ --- */}
                    <div className="space-y-2.5 border-b border-slate-100 pb-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiêu đề</div>
                      {renderStyleRow(renderResponsiveLabel('Màu chữ', 'titleColor'), renderColorControl('titleColor', '#1e293b'))}

                      {/* Tiêu đề typography popover */}
                      {(() => {
                        const isTitleTypoModified = props.titleFontFamily || props.titleFontSize !== '20px' || props.titleFontWeight !== '600' || props.titleFontStyle !== 'normal' || props.titleLineHeight || props.titleLetterSpacing || props.titleWordSpacing;
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'title'), renderEditButton(`title-type-${selected.id}`, null, () => {
                              updateProp('titleFontFamily', '');
                              updateProp('titleFontSize', '20px');
                              updateProp('titleFontWeight', '600');
                              updateProp('titleFontStyle', 'normal');
                              updateProp('titleLineHeight', '');
                              updateProp('titleLetterSpacing', '');
                              updateProp('titleWordSpacing', '');
                            }, isTitleTypoModified))}
                            {renderPopoverPanel(`title-type-${selected.id}`, renderTypographyFields('title', '20', '600'))}
                          </>
                        );
                      })()}

                      {/* Tiêu đề text shadow popover */}
                      {(() => {
                        const hasShadow = props.titleTextShadowColor && props.titleTextShadowColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-${selected.id}`, null, () => {
                              updateProp('titleTextShadowColor', 'transparent');
                              updateProp('titleTextShadowHorizontal', '0px');
                              updateProp('titleTextShadowVertical', '0px');
                              updateProp('titleTextShadowBlur', '0px');
                            }, hasShadow))}
                            {renderPopoverPanel(`titleShadow-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu sắc</span>
                                  {renderColorControl('titleTextShadowColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Ngang</span>
                                  {renderUnitControl('titleTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Dọc</span>
                                  {renderUnitControl('titleTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ mờ</span>
                                  {renderUnitControl('titleTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}

                      {/* Tiêu đề stroke popover */}
                      {(() => {
                        const hasStroke = props.titleTextStrokeWidth && props.titleTextStrokeWidth !== '0px' && props.titleTextStrokeColor && props.titleTextStrokeColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Viền chữ', 'titleStroke'), renderEditButton(`titleStroke-${selected.id}`, null, () => {
                              updateProp('titleTextStrokeColor', 'transparent');
                              updateProp('titleTextStrokeWidth', '0px');
                            }, hasStroke))}
                            {renderPopoverPanel(`titleStroke-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu viền</span>
                                  {renderColorControl('titleTextStrokeColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ dày</span>
                                  {renderUnitControl('titleTextStrokeWidth', '0', 'px', { min: 0, max: 20 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>

                    {/* --- MÔ TẢ --- */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả</div>
                      {renderStyleRow(renderResponsiveLabel('Màu chữ', 'descColor'), renderColorControl('descColor', '#475569'))}

                      {/* Mô tả typography popover */}
                      {(() => {
                        const isDescTypoModified = props.descFontFamily || props.descFontSize !== '14px' || props.descFontWeight !== '400' || props.descFontStyle !== 'normal' || props.descLineHeight || props.descLetterSpacing || props.descWordSpacing;
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'desc'), renderEditButton(`desc-type-${selected.id}`, null, () => {
                              updateProp('descFontFamily', '');
                              updateProp('descFontSize', '14px');
                              updateProp('descFontWeight', '400');
                              updateProp('descFontStyle', 'normal');
                              updateProp('descLineHeight', '');
                              updateProp('descLetterSpacing', '');
                              updateProp('descWordSpacing', '');
                            }, isDescTypoModified))}
                            {renderPopoverPanel(`desc-type-${selected.id}`, renderTypographyFields('desc', '14', '400'))}
                          </>
                        );
                      })()}

                      {/* Mô tả text shadow popover */}
                      {(() => {
                        const hasShadow = props.descTextShadowColor && props.descTextShadowColor !== 'transparent';
                        return (
                          <>
                            {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'descShadow'), renderEditButton(`descShadow-${selected.id}`, null, () => {
                              updateProp('descTextShadowColor', 'transparent');
                              updateProp('descTextShadowHorizontal', '0px');
                              updateProp('descTextShadowVertical', '0px');
                              updateProp('descTextShadowBlur', '0px');
                            }, hasShadow))}
                            {renderPopoverPanel(`descShadow-${selected.id}`, (
                              <div className="space-y-3">
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Màu sắc</span>
                                  {renderColorControl('descTextShadowColor', 'transparent')}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Ngang</span>
                                  {renderUnitControl('descTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Dọc</span>
                                  {renderUnitControl('descTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                                </div>
                                <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                  <span className="font-medium text-slate-500">Độ mờ</span>
                                  {renderUnitControl('descTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </>
            )}

            {name === 'Sập mở (FAQ)' && (
              <>
                {renderStyleSection('Nội dung thu gọn', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách giữa các mục', 'itemSpacing'), renderUnitControl('itemSpacing', '12', 'px', { min: 0, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách từ nội dung', 'contentSpacing'), renderUnitControl('contentSpacing', '0', 'px', { min: 0, max: 100 }, ['px', 'em', 'rem']))}
                    
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setAccordionItemTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            accordionItemTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {renderStyleRow('Loại nền', (
                        <select
                          value={props.itemBgType || 'color'}
                          onChange={(e) => updateProp('itemBgType', e.target.value)}
                          className="h-7 w-20 rounded border border-slate-200 px-2 text-[10px] outline-none"
                        >
                          <option value="color">Màu</option>
                        </select>
                      ))}
                      {accordionItemTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu nền', 'itemBgColor'), renderColorControl('itemBgColor', 'transparent'))}
                      {accordionItemTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu nền', 'itemBgColorHover'), renderColorControl('itemBgColorHover', ''))}
                      {accordionItemTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu nền', 'itemBgColorActive'), renderColorControl('itemBgColorActive', ''))}

                      {renderStyleRow('Loại đường viền', (
                        <select
                          value={props.itemBorderType || 'solid'}
                          onChange={(e) => updateProp('itemBorderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                        >
                          <option value="none">Mặc định</option>
                          <option value="solid">Nét liền dải (Solid)</option>
                          <option value="double">Nét đôi (Double)</option>
                          <option value="dotted">Nét chấm (Dotted)</option>
                          <option value="dashed">Nét đứt (Dashed)</option>
                          <option value="hidden">Ẩn (Hidden)</option>
                        </select>
                      ))}
                      {props.itemBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Màu viền', 'itemBorderColor'), renderColorControl('itemBorderColor', '#e2e8f0'))}
                      {props.itemBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Bo viền', 'itemBorderRadius'), renderUnitControl('itemBorderRadius', '6', 'px', { min: 0, max: 100 }))}
                      {props.itemBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Độ dày viền', 'itemBorderWidth'), renderUnitControl('itemBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                      {renderStyleRow(renderResponsiveLabel('Lề trong', 'itemPadding'), renderUnitControl('itemPadding', '0', 'px', { min: 0, max: 100 }))}
                    </div>
                  </div>
                ))}

                {renderStyleSection('Đầu trang', (
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-1">Tiêu đề</div>
                    <div className="relative">
                      {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'acc'), renderEditButton(`acc-title-type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                      {renderPopoverPanel(`acc-title-type-${selected.id}`, (
                        <div className="space-y-3">
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Gia đình</span>
                            <select
                              value={props.titleFontFamily || 'Inter'}
                              onChange={(e) => updateProp('titleFontFamily', e.target.value)}
                              className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                            >
                              <optgroup label="Cài đặt website">
                                <option value="var(--site-font-family-body)">Default: Body font</option>
                                <option value="var(--site-font-family-heading)">Default: Heading font</option>
                              </optgroup>
                              <optgroup label="Tất cả Font chữ Google">
                                {GOOGLE_FONTS.map((font: string) => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kích thước</span>
                            {renderUnitControl('titleFontSize', '14', 'px', { min: 8, max: 80 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ đậm</span>
                            <select value={props.titleFontWeight || '700'} onChange={(e) => updateProp('titleFontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="100">100 (Rất mỏng)</option>
                              <option value="200">200 (Mỏng nhẹ)</option>
                              <option value="300">300 (Mỏng)</option>
                              <option value="400">400 (Bình thường)</option>
                              <option value="500">500 (Trung bình)</option>
                              <option value="600">600 (Nửa đậm)</option>
                              <option value="700">700 (Đậm)</option>
                              <option value="800">800 (Rất đậm)</option>
                              <option value="900">900 (Đen)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Chuyển đổi</span>
                            <select value={props.titleTextTransform || 'none'} onChange={(e) => updateProp('titleTextTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định</option>
                              <option value="uppercase">In hoa</option>
                              <option value="lowercase">In thường</option>
                              <option value="capitalize">In hoa chữ cái đầu</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                            {renderSegmentedControl(props.titleFontStyle, 'normal', [
                              { value: 'normal', label: 'Bình thường' },
                              { value: 'italic', label: 'Nghiêng' },
                            ] as const, (value: string) => updateProp('titleFontStyle', value))}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Trang trí</span>
                            <select value={props.titleTextDecoration || 'none'} onChange={(e) => updateProp('titleTextDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định</option>
                              <option value="underline">Gạch chân</option>
                              <option value="overline">Gạch trên</option>
                              <option value="line-through">Gạch ngang</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ cao dòng</span>
                            {renderLineHeightControl('titleLineHeight')}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                            {renderUnitControl('titleLetterSpacing', '0', 'px', { min: -5, max: 20 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Khoảng cách từ</span>
                            {renderUnitControl('titleWordSpacing', '0', 'px', { min: -10, max: 50 })}
                          </div>
                        </div>
                      ), true)}
                    </div>

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setAccordionTitleTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            accordionTitleTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5 mb-4">
                      {accordionTitleTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColor'), renderColorControl('titleColor', '#1e293b'))}
                      {accordionTitleTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColorHover'), renderColorControl('titleColorHover', '#2563eb'))}
                      {accordionTitleTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColorActive'), renderColorControl('titleColorActive', '#2563eb'))}
                    </div>
                    
                    {accordionTitleTab === 'normal' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'acc'), renderEditButton(`acc-title-shadow-normal-${selected.id}`, null, () => updateProp('titleTextShadow', ''), !!props.titleTextShadow))}
                        {renderPopoverPanel(`acc-title-shadow-normal-${selected.id}`, renderTextShadowPopover('titleTextShadow'), true)}
                      </div>
                    )}

                    {accordionTitleTab === 'hover' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'acc'), renderEditButton(`acc-title-shadow-hover-${selected.id}`, null, () => updateProp('titleTextShadowHover', ''), !!props.titleTextShadowHover))}
                        {renderPopoverPanel(`acc-title-shadow-hover-${selected.id}`, renderTextShadowPopover('titleTextShadowHover'), true)}
                      </div>
                    )}

                    {accordionTitleTab === 'active' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'acc'), renderEditButton(`acc-title-shadow-active-${selected.id}`, null, () => updateProp('titleTextShadowActive', ''), !!props.titleTextShadowActive))}
                        {renderPopoverPanel(`acc-title-shadow-active-${selected.id}`, renderTextShadowPopover('titleTextShadowActive'), true)}
                      </div>
                    )}

                    {accordionTitleTab === 'normal' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'acc'), renderEditButton(`acc-title-stroke-normal-${selected.id}`, null, () => updateProp('titleTextStroke', ''), !!props.titleTextStroke))}
                        {renderPopoverPanel(`acc-title-stroke-normal-${selected.id}`, renderTextStrokePopover('titleTextStroke'), true)}
                      </div>
                    )}

                    {accordionTitleTab === 'hover' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'acc'), renderEditButton(`acc-title-stroke-hover-${selected.id}`, null, () => updateProp('titleTextStrokeHover', ''), !!props.titleTextStrokeHover))}
                        {renderPopoverPanel(`acc-title-stroke-hover-${selected.id}`, renderTextStrokePopover('titleTextStrokeHover'), true)}
                      </div>
                    )}

                    {accordionTitleTab === 'active' && (
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'acc'), renderEditButton(`acc-title-stroke-active-${selected.id}`, null, () => updateProp('titleTextStrokeActive', ''), !!props.titleTextStrokeActive))}
                        {renderPopoverPanel(`acc-title-stroke-active-${selected.id}`, renderTextStrokePopover('titleTextStrokeActive'), true)}
                      </div>
                    )}

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-slate-100">Biểu tượng</div>
                    {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '15', 'px', { min: 10, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'iconSpacing'), renderUnitControl('iconSpacing', '8', 'px', { min: 0, max: 50 }))}

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setAccordionIconTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            accordionIconTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {accordionIconTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColor'), renderColorControl('iconColor', '#1e293b'))}
                      {accordionIconTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColorHover'), renderColorControl('iconColorHover', '#2563eb'))}
                      {accordionIconTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColorActive'), renderColorControl('iconColorActive', '#2563eb'))}
                    </div>
                  </div>
                ))}

                {renderStyleSection('Nội dung', (
                  <div className="space-y-4">
                    {renderStyleRow('Loại nền', (
                      <select value={props.contentBgType || 'color'} onChange={(e) => updateProp('contentBgType', e.target.value)} className="h-7 w-20 rounded border border-slate-200 px-2 text-[10px] outline-none">
                        <option value="color">Màu</option>
                      </select>
                    ))}
                    {renderStyleRow(renderResponsiveLabel('Màu nền', 'contentBgColor'), renderColorControl('contentBgColor', '#ffffff'))}
                    
                    {renderStyleRow('Loại đường viền', (
                      <select value={props.contentBorderType || 'solid'} onChange={(e) => updateProp('contentBorderType', e.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500">
                        <option value="none">Mặc định</option>
                        <option value="solid">Nét liền dải (Solid)</option>
                        <option value="double">Nét đôi (Double)</option>
                        <option value="dotted">Nét chấm (Dotted)</option>
                        <option value="dashed">Nét đứt (Dashed)</option>
                        <option value="hidden">Ẩn (Hidden)</option>
                      </select>
                    ))}
                    {props.contentBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Màu viền', 'contentBorderColor'), renderColorControl('contentBorderColor', '#e2e8f0'))}
                    {props.contentBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Bo viền', 'contentBorderRadius'), renderUnitControl('contentBorderRadius', '0', 'px', { min: 0, max: 100 }))}
                    {props.contentBorderType !== 'none' && renderStyleRow(renderResponsiveLabel('Độ dày viền', 'contentBorderWidth'), renderUnitControl('contentBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                    
                    {renderStyleRow(renderResponsiveLabel('Lề trong', 'contentPadding'), renderUnitControl('contentPadding', '12px 16px', 'px', { min: 0, max: 100 }))}
                    
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-slate-100">Kiểu chữ nội dung</div>
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'contentColor'), renderColorControl('contentColor', '#475569'))}
                    <div className="relative">
                      {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'acc'), renderEditButton(`acc-content-type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                      {renderPopoverPanel(`acc-content-type-${selected.id}`, (
                        <div className="space-y-3">
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Gia đình</span>
                            <select
                              value={props.contentFontFamily || 'Inter'}
                              onChange={(e) => updateProp('contentFontFamily', e.target.value)}
                              className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                            >
                              <optgroup label="Cài đặt website">
                                <option value="var(--site-font-family-body)">Default: Body font</option>
                                <option value="var(--site-font-family-heading)">Default: Heading font</option>
                              </optgroup>
                              <optgroup label="Tất cả Font chữ Google">
                                {GOOGLE_FONTS.map((font: string) => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kích thước</span>
                            {renderUnitControl('contentFontSize', '13', 'px', { min: 8, max: 80 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ đậm</span>
                            <select value={props.contentFontWeight || '400'} onChange={(e) => updateProp('contentFontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="100">100 (Rất mỏng)</option>
                              <option value="200">200 (Mỏng nhẹ)</option>
                              <option value="300">300 (Mỏng)</option>
                              <option value="400">400 (Bình thường)</option>
                              <option value="500">500 (Trung bình)</option>
                              <option value="600">600 (Nửa đậm)</option>
                              <option value="700">700 (Đậm)</option>
                              <option value="800">800 (Rất đậm)</option>
                              <option value="900">900 (Đen)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Chuyển đổi</span>
                            <select value={props.contentTextTransform || 'none'} onChange={(e) => updateProp('contentTextTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định</option>
                              <option value="uppercase">In hoa</option>
                              <option value="lowercase">In thường</option>
                              <option value="capitalize">In hoa chữ cái đầu</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                            {renderSegmentedControl(props.contentFontStyle, 'normal', [
                              { value: 'normal', label: 'Bình thường' },
                              { value: 'italic', label: 'Nghiêng' },
                            ] as const, (value: string) => updateProp('contentFontStyle', value))}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Trang trí</span>
                            <select value={props.contentTextDecoration || 'none'} onChange={(e) => updateProp('contentTextDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định</option>
                              <option value="underline">Gạch chân</option>
                              <option value="overline">Gạch trên</option>
                              <option value="line-through">Gạch ngang</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ cao dòng</span>
                            {renderLineHeightControl('contentLineHeight')}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                            {renderUnitControl('contentLetterSpacing', '0', 'px', { min: -5, max: 20 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Khoảng cách từ</span>
                            {renderUnitControl('contentWordSpacing', '0', 'px', { min: -10, max: 50 })}
                          </div>
                        </div>
                      ), true)}
                    </div>
                  </div>
                ))}
              </>
            )}

            {name === 'Tabs' && (
              <>
                {/* 1. Tabs settings (Wrapper) */}
                {renderStyleSection('Tabs', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách giữa các tab', 'tabSpacing'), renderUnitControl('tabSpacing', '8', 'px', { min: 0, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách từ nội dung', 'contentSpacing'), renderUnitControl('contentSpacing', '12', 'px', { min: 0, max: 100 }))}
                    
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTabsItemTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            tabsItemTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {tabsItemTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu nền', 'tabBgColor'), renderColorControl('tabBgColor', '#f8fafc'))}
                      {tabsItemTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu nền', 'tabBgColorHover'), renderColorControl('tabBgColorHover', '#cbd5e1'))}
                      {tabsItemTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu nền', 'tabBgColorActive'), renderColorControl('tabBgColorActive', '#3b82f6'))}
                      
                      {renderStyleRow('Loại đường viền', (
                        <select
                          value={props.tabBorderType || 'solid'}
                          onChange={(e) => updateProp('tabBorderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                        >
                          <option value="none">Mặc định</option>
                          <option value="solid">Nét liền dải (Solid)</option>
                          <option value="double">Nét đôi (Double)</option>
                          <option value="dotted">Nét chấm (Dotted)</option>
                          <option value="dashed">Nét đứt (Dashed)</option>
                          <option value="hidden">Ẩn (Hidden)</option>
                        </select>
                      ))}
                      
                      {props.tabBorderType && props.tabBorderType !== 'none' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu viền', 'tabBorderColor'), renderColorControl('tabBorderColor', '#e2e8f0'))}
                          {renderStyleRow(renderResponsiveLabel('Độ dày viền', 'tabBorderWidth'), renderUnitControl('tabBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                        </>
                      )}
                      
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Đổ bóng', 'tabBoxShadow'), renderEditButton(`tabBoxShadow-${selected.id}`, null, () => updateProp('tabBoxShadow', ''), props.tabBoxShadow && props.tabBoxShadow !== 'none'))}
                        {renderPopoverPanel(`tabBoxShadow-${selected.id}`, renderBoxShadowPopover('tabBoxShadow'))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        {renderSpacingControl(
                          'tabBorderRadius',
                          'Bo viền',
                          ['tabBorderTopLeftRadius', 'tabBorderTopRightRadius', 'tabBorderBottomRightRadius', 'tabBorderBottomLeftRadius']
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        {renderSpacingControl(
                          'tabPadding',
                          'Lề trong',
                          ['tabPaddingTop', 'tabPaddingRight', 'tabPaddingBottom', 'tabPaddingLeft']
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 2. Title Typography & Color */}
                {renderStyleSection('Tiêu đề', (
                  <div className="space-y-4">
                    <div className="relative">
                      {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'tabs'), renderEditButton(`tabs-title-type-${selected.id}`, null, () => {}, false))}
                      {renderPopoverPanel(`tabs-title-type-${selected.id}`, renderTypographyFields('title', '13', '600'))}
                    </div>

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTabsTitleTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            tabsTitleTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {tabsTitleTab === 'normal' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColor'), renderColorControl('titleColor', '#475569'))}
                          {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-normal-${selected.id}`, null, () => updateProp('titleTextShadow', ''), props.titleTextShadow && props.titleTextShadow !== 'none'))}
                          {renderPopoverPanel(`titleShadow-normal-${selected.id}`, renderTextShadowPopover('titleTextShadow'), true)}
                          
                          {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'titleStroke'), renderEditButton(`titleStroke-normal-${selected.id}`, null, () => updateProp('titleTextStroke', ''), props.titleTextStroke && props.titleTextStroke !== 'none'))}
                          {renderPopoverPanel(`titleStroke-normal-${selected.id}`, renderTextStrokePopover('titleTextStroke'), true)}
                        </>
                      )}
                      {tabsTitleTab === 'hover' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColorHover'), renderColorControl('titleColorHover', '#0f172a'))}
                          {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-hover-${selected.id}`, null, () => updateProp('titleTextShadowHover', ''), props.titleTextShadowHover && props.titleTextShadowHover !== 'none'))}
                          {renderPopoverPanel(`titleShadow-hover-${selected.id}`, renderTextShadowPopover('titleTextShadowHover'), true)}
                          
                          {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'titleStroke'), renderEditButton(`titleStroke-hover-${selected.id}`, null, () => updateProp('titleTextStrokeHover', ''), props.titleTextStrokeHover && props.titleTextStrokeHover !== 'none'))}
                          {renderPopoverPanel(`titleStroke-hover-${selected.id}`, renderTextStrokePopover('titleTextStrokeHover'), true)}
                        </>
                      )}
                      {tabsTitleTab === 'active' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColorActive'), renderColorControl('titleColorActive', '#ffffff'))}
                          {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-active-${selected.id}`, null, () => updateProp('titleTextShadowActive', ''), props.titleTextShadowActive && props.titleTextShadowActive !== 'none'))}
                          {renderPopoverPanel(`titleShadow-active-${selected.id}`, renderTextShadowPopover('titleTextShadowActive'), true)}
                          
                          {renderStyleRow(renderResponsiveLabel('Nét văn bản', 'titleStroke'), renderEditButton(`titleStroke-active-${selected.id}`, null, () => updateProp('titleTextStrokeActive', ''), props.titleTextStrokeActive && props.titleTextStrokeActive !== 'none'))}
                          {renderPopoverPanel(`titleStroke-active-${selected.id}`, renderTextStrokePopover('titleTextStrokeActive'), true)}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* 3. Icon styling */}
                {renderStyleSection('Biểu tượng', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Vị trí', 'iconPosition'), renderSegmentedControl(props.iconPosition || 'left',
                      'left',
                      [
                        { value: 'top', label: 'Trên' },
                        { value: 'bottom', label: 'Dưới' },
                        { value: 'left', label: 'Trái' },
                        { value: 'right', label: 'Phải' },
                      ] as const,
                      (value: string) => updateProp('iconPosition', value)
                    ))}

                    {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '14', 'px', { min: 8, max: 80 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'iconSpacing'), renderUnitControl('iconSpacing', '6', 'px', { min: 0, max: 100 }))}

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTabsIconTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            tabsIconTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {tabsIconTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColor'), renderColorControl('iconColor', '#64748b'))}
                      {tabsIconTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColorHover'), renderColorControl('iconColorHover', '#0f172a'))}
                      {tabsIconTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColorActive'), renderColorControl('iconColorActive', '#ffffff'))}
                    </div>
                  </div>
                ))}

                {/* 4. Content styling */}
                {renderStyleSection('Nội dung', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Màu nền', 'contentBgColor'), renderColorControl('contentBgColor', '#ffffff'))}
                    
                    {renderStyleRow('Loại đường viền', (
                      <select
                        value={props.contentBorderType || 'solid'}
                        onChange={(e) => updateProp('contentBorderType', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                      >
                        <option value="none">Mặc định</option>
                        <option value="solid">Nét liền dải (Solid)</option>
                        <option value="double">Nét đôi (Double)</option>
                        <option value="dotted">Nét chấm (Dotted)</option>
                        <option value="dashed">Nét đứt (Dashed)</option>
                        <option value="hidden">Ẩn (Hidden)</option>
                      </select>
                    ))}
                    
                    {props.contentBorderType && props.contentBorderType !== 'none' && (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu viền', 'contentBorderColor'), renderColorControl('contentBorderColor', '#e2e8f0'))}
                        {renderStyleRow(renderResponsiveLabel('Độ dày viền', 'contentBorderWidth'), renderUnitControl('contentBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                      </>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'contentBorderRadius',
                        'Bo viền',
                        ['contentBorderTopLeftRadius', 'contentBorderTopRightRadius', 'contentBorderBottomRightRadius', 'contentBorderBottomLeftRadius']
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'contentPadding',
                        'Lề trong',
                        ['contentPaddingTop', 'contentPaddingRight', 'contentPaddingBottom', 'contentPaddingLeft']
                      )}
                    </div>

                    {/* Content text typography/color settings (for text content mode) */}
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 pt-4 border-t border-slate-100">Kiểu chữ nội dung</div>
                    <div className="space-y-2.5">
                      {renderStyleRow(renderResponsiveLabel('Màu chữ', 'contentColor'), renderColorControl('contentColor', '#334155'))}
                      
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'tabs'), renderEditButton(`tabs-content-type-${selected.id}`, null, () => {}, false))}
                        {renderPopoverPanel(`tabs-content-type-${selected.id}`, renderTypographyFields('content', '13', '400'))}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {name === 'Băng chuyền hình ảnh' && (
              <>
                {/* 1. Thanh điều hướng style settings */}
                {renderStyleSection('Thanh điều hướng', (
                  <div className="space-y-4">
                    {/* Arrows sub-section */}
                    {(props.navigation === 'arrows_dots' || props.navigation === 'arrows') && (
                      <div className="space-y-2.5 border-b border-slate-100 pb-3">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1 text-slate-400">Mũi tên</div>
                        {renderStyleRow('Vị trí', (
                          <select value={props.arrowsPosition || 'inside'} onChange={(e) => updateProp('arrowsPosition', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white">
                            <option value="inside">Bên trong</option>
                            <option value="outside">Bên ngoài</option>
                          </select>
                        ))}
                        {renderStyleRow(renderResponsiveLabel('Kích thước', 'arrowsSize'), renderUnitControl('arrowsSize', '24', 'px', { min: 10, max: 100 }))}
                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'arrowsColor'), renderColorControl('arrowsColor', '#000000'))}
                      </div>
                    )}

                    {/* Dots sub-section */}
                    {(props.navigation === 'arrows_dots' || props.navigation === 'dots') && (
                      <div className="space-y-2.5">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1 text-slate-400">Phân trang</div>
                        {renderStyleRow('Vị trí', (
                          <select value={props.dotsPosition || 'outside'} onChange={(e) => updateProp('dotsPosition', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white">
                            <option value="inside">Bên trong</option>
                            <option value="outside">Bên ngoài</option>
                          </select>
                        ))}
                        {renderStyleRow(renderResponsiveLabel('Khoảng cách giữa các chấm', 'dotsSpacing'), renderUnitControl('dotsSpacing', '8', 'px', { min: 0, max: 100 }))}
                        {renderStyleRow(renderResponsiveLabel('Kích thước', 'dotsSize'), renderUnitControl('dotsSize', '8', 'px', { min: 4, max: 40 }))}
                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'dotsColor'), renderColorControl('dotsColor', '#cccccc'))}
                        {renderStyleRow(renderResponsiveLabel('Màu sắc khi kích hoạt', 'dotsActiveColor'), renderColorControl('dotsActiveColor', '#000000'))}
                      </div>
                    )}
                  </div>
                ))}

                {/* 2. Hình ảnh style settings */}
                {renderStyleSection('Hình ảnh', (
                  <div className="space-y-2.5">
                    {renderStyleRow(renderResponsiveLabel('Căn theo chiều dọc', 'imageAlign'), renderSegmentedControl(props.imageAlign || 'center', 'center', [
                      { value: 'start', label: 'Trên' },
                      { value: 'center', label: 'Giữa' },
                      { value: 'end', label: 'Dưới' },
                    ] as const, (val: string) => updateProp('imageAlign', val)))}

                    {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'imageSpacing'), renderUnitControl('imageSpacing', '10', 'px', { min: 0, max: 100 }))}

                    {renderStyleRow('Loại đường viền', (
                      <select value={props.borderType || 'none'} onChange={(e) => updateProp('borderType', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white">
                        <option value="none">Không</option>
                        <option value="solid">Solid</option>
                        <option value="double">Double</option>
                        <option value="dotted">Dotted</option>
                        <option value="dashed">Dashed</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    ))}

                    {props.borderType && props.borderType !== 'none' && (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu viền', 'borderColor'), renderColorControl('borderColor', '#000000'))}
                        {renderStyleRow(renderResponsiveLabel('Độ rộng viền', 'borderWidth'), renderUnitControl('borderWidth', '1', 'px', { min: 0, max: 20 }))}
                      </>
                    )}

                    {renderSpacingControl('borderRadius', 'Bo viền', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'] as const)}
                  </div>
                ))}
              </>
            )}

            {name === 'Bộ đếm' && (
              <>
                {/* 1. Bộ đếm layout */}
                {renderStyleSection('Bộ đếm', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Vị trí Tiêu đề', 'titlePosition'), renderSegmentedControl(props.titlePosition || 'bottom', 'bottom', [
                      { value: 'top', label: 'Trên' },
                      { value: 'bottom', label: 'Dưới' },
                    ] as const, (val: string) => updateProp('titlePosition', val)))}

                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh Tiêu đề', 'titleHAlign'), renderSegmentedControl(props.titleHAlign || 'center', 'center', [
                      { value: 'left', label: 'Trái' },
                      { value: 'center', label: 'Giữa' },
                      { value: 'right', label: 'Phải' },
                    ] as const, (val: string) => updateProp('titleHAlign', val)))}

                    {renderStyleRow(renderResponsiveLabel('Khoảng cách Tiêu đề', 'titleSpacing'), renderUnitControl('titleSpacing', '10', 'px', { min: 0, max: 100 }))}

                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh Số', 'numberTextAlign'), renderSegmentedControl(props.numberTextAlign || 'center', 'center', [
                      { value: 'left', label: 'Trái' },
                      { value: 'center', label: 'Giữa' },
                      { value: 'right', label: 'Phải' },
                    ] as const, (val: string) => updateProp('numberTextAlign', val)))}
                  </div>
                ))}

                {/* 2. Số typography */}
                {renderStyleSection('Số', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'numberColor'), renderColorControl('numberColor', 'var(--site-color-primary)'))}

                    {(() => {
                      const isNumberTypoModified = props.numberFontFamily || props.numberFontSize !== '48px' || props.numberFontWeight !== '700' || props.numberFontStyle !== 'normal' || props.numberLineHeight || props.numberLetterSpacing || props.numberWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'number'), renderEditButton(`number-type-${selected.id}`, null, () => {
                            updateProp('numberFontFamily', '');
                            updateProp('numberFontSize', '48px');
                            updateProp('numberFontWeight', '700');
                            updateProp('numberFontStyle', 'normal');
                            updateProp('numberLineHeight', '');
                            updateProp('numberLetterSpacing', '');
                            updateProp('numberWordSpacing', '');
                          }, isNumberTypoModified))}
                          {renderPopoverPanel(`number-type-${selected.id}`, renderTypographyFields('number', '48', '700'))}
                        </>
                      );
                    })()}

                    {renderStyleRow('Nét văn bản', (
                      <select
                        value={props.numberTextDecoration || 'none'}
                        onChange={(e) => updateProp('numberTextDecoration', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white"
                      >
                        <option value="none">Không có</option>
                        <option value="underline">Gạch chân</option>
                        <option value="line-through">Gạch ngang</option>
                      </select>
                    ))}

                    {/* Số text shadow popover */}
                    {(() => {
                      const hasNumberShadow = props.numberTextShadowColor && props.numberTextShadowColor !== 'transparent';
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'numberShadow'), renderEditButton(`numberShadow-${selected.id}`, null, () => {
                            updateProp('numberTextShadowColor', 'transparent');
                            updateProp('numberTextShadowHorizontal', '0px');
                            updateProp('numberTextShadowVertical', '0px');
                            updateProp('numberTextShadowBlur', '0px');
                          }, hasNumberShadow))}
                          {renderPopoverPanel(`numberShadow-${selected.id}`, (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Màu sắc</span>
                                {renderColorControl('numberTextShadowColor', 'transparent')}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Ngang</span>
                                {renderUnitControl('numberTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Dọc</span>
                                {renderUnitControl('numberTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Độ mờ</span>
                                {renderUnitControl('numberTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ))}

                {/* 3. Tiêu đề typography */}
                {renderStyleSection('Tiêu đề', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColor'), renderColorControl('titleColor', 'var(--site-color-text)'))}

                    {(() => {
                      const isTitleTypoModified = props.titleFontFamily || props.titleFontSize !== '18px' || props.titleFontWeight !== '400' || props.titleFontStyle !== 'normal' || props.titleLineHeight || props.titleLetterSpacing || props.titleWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'title'), renderEditButton(`title-type-${selected.id}`, null, () => {
                            updateProp('titleFontFamily', '');
                            updateProp('titleFontSize', '18px');
                            updateProp('titleFontWeight', '400');
                            updateProp('titleFontStyle', 'normal');
                            updateProp('titleLineHeight', '');
                            updateProp('titleLetterSpacing', '');
                            updateProp('titleWordSpacing', '');
                          }, isTitleTypoModified))}
                          {renderPopoverPanel(`title-type-${selected.id}`, renderTypographyFields('title', '18', '400'))}
                        </>
                      );
                    })()}

                    {renderStyleRow('Nét văn bản', (
                      <select
                        value={props.titleTextDecoration || 'none'}
                        onChange={(e) => updateProp('titleTextDecoration', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none bg-white"
                      >
                        <option value="none">Không có</option>
                        <option value="underline">Gạch chân</option>
                        <option value="line-through">Gạch ngang</option>
                      </select>
                    ))}

                    {/* Tiêu đề text shadow popover */}
                    {(() => {
                      const hasTitleShadow = props.titleTextShadowColor && props.titleTextShadowColor !== 'transparent';
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'titleShadow'), renderEditButton(`titleShadow-${selected.id}`, null, () => {
                            updateProp('titleTextShadowColor', 'transparent');
                            updateProp('titleTextShadowHorizontal', '0px');
                            updateProp('titleTextShadowVertical', '0px');
                            updateProp('titleTextShadowBlur', '0px');
                          }, hasTitleShadow))}
                          {renderPopoverPanel(`titleShadow-${selected.id}`, (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Màu sắc</span>
                                {renderColorControl('titleTextShadowColor', 'transparent')}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Ngang</span>
                                {renderUnitControl('titleTextShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Dọc</span>
                                {renderUnitControl('titleTextShadowVertical', '0', 'px', { min: -50, max: 50 })}
                              </div>
                              <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">Độ mờ</span>
                                {renderUnitControl('titleTextShadowBlur', '0', 'px', { min: 0, max: 100 })}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </>
            )}

            {name === 'Thanh tiến trình' && (
              <>
                {/* 1. Thanh tiến trình layout */}
                {renderStyleSection('Thanh tiến trình', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Chiều cao', 'barHeight'), renderUnitControl('barHeight', '20', 'px', { min: 5, max: 100 }))}

                    {renderStyleRow(renderResponsiveLabel('Bo góc', 'barBorderRadius'), renderUnitControl('barBorderRadius', '10', 'px', { min: 0, max: 50 }))}

                    {props.barType !== 'inner' && renderStyleRow(renderResponsiveLabel('Khoảng cách Tiêu đề', 'titleSpacing'), renderUnitControl('titleSpacing', '8', 'px', { min: 0, max: 100 }))}

                    {renderStyleRow(renderResponsiveLabel('Màu nền', 'barBgColor'), renderColorControl('barBgColor', '#e5e7eb'))}

                    {renderStyleRow(renderResponsiveLabel('Màu thanh', 'barColor'), renderColorControl('barColor', 'var(--site-color-primary)'))}

                    {renderStyleRow('Hiệu ứng Gradient', (
                      <div className="flex items-center h-6 justify-end w-full">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={Boolean(props.barGradientEnabled)}
                            onChange={(e) => updateProp('barGradientEnabled', e.target.checked)}
                          />
                          <div className="w-[30px] h-[16px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[12px] after:w-[12px] after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                      </div>
                    ))}

                    {props.barGradientEnabled && renderStyleRow(renderResponsiveLabel('Màu Gradient 2', 'barGradientColor'), renderColorControl('barGradientColor', ''))}
                  </div>
                ))}

                {/* 2. Tiêu đề typography */}
                {renderStyleSection('Tiêu đề', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColor'), renderColorControl('titleColor', 'var(--site-color-text)'))}

                    {(() => {
                      const isTitleTypoModified = props.titleFontFamily || props.titleFontSize !== '14px' || props.titleFontWeight !== '600' || props.titleFontStyle !== 'normal' || props.titleLineHeight || props.titleLetterSpacing || props.titleWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'title'), renderEditButton(`title-type-${selected.id}`, null, () => {
                            updateProp('titleFontFamily', '');
                            updateProp('titleFontSize', '14px');
                            updateProp('titleFontWeight', '600');
                            updateProp('titleFontStyle', 'normal');
                            updateProp('titleLineHeight', '');
                            updateProp('titleLetterSpacing', '');
                            updateProp('titleWordSpacing', '');
                          }, isTitleTypoModified))}
                          {renderPopoverPanel(`title-type-${selected.id}`, renderTypographyFields('title', '14', '600'))}
                        </>
                      );
                    })()}

                    {props.barType === 'inner' && renderStyleRow(renderResponsiveLabel('Màu chữ trong thanh', 'innerTextColor'), renderColorControl('innerTextColor', '#ffffff'))}
                  </div>
                ))}

                {/* 3. Phần trăm typography */}
                {props.displayPercentage !== false && renderStyleSection('Phần trăm', (
                  <div className="space-y-4 font-sans">
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'percentColor'), renderColorControl('percentColor', 'var(--site-color-text)'))}

                    {(() => {
                      const isPercentTypoModified = props.percentFontFamily || props.percentFontSize !== '14px' || props.percentFontWeight !== '600' || props.percentFontStyle !== 'normal' || props.percentLineHeight || props.percentLetterSpacing || props.percentWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'percent'), renderEditButton(`percent-type-${selected.id}`, null, () => {
                            updateProp('percentFontFamily', '');
                            updateProp('percentFontSize', '14px');
                            updateProp('percentFontWeight', '600');
                            updateProp('percentFontStyle', 'normal');
                            updateProp('percentLineHeight', '');
                            updateProp('percentLetterSpacing', '');
                            updateProp('percentWordSpacing', '');
                          }, isPercentTypoModified))}
                          {renderPopoverPanel(`percent-type-${selected.id}`, renderTypographyFields('percent', '14', '600'))}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </>
            )}

            {name === 'Danh sách' && (
              <>
                {renderStyleSection('Danh sách', (
                  <div className="space-y-2.5">
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách giữa hai đối tượng', 'gap'), renderUnitControl('gap', '10', 'px', { min: 0, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh', 'align'), renderSegmentedControl(props.align || 'left',
                      'left',
                      [
                        { value: 'left', label: 'Trái' },
                        { value: 'center', label: 'Giữa' },
                        { value: 'right', label: 'Phải' },
                      ] as const,
                      (value: string) => updateProp('align', value)
                    ))}
                    
                    {renderStyleRow('Đường phân cách', (
                      <div className="flex items-center h-6 justify-end w-full">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={props.hasDivider || false}
                            onChange={(e) => updateProp('hasDivider', e.target.checked)}
                          />
                          <div className="w-[30px] h-[16px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[12px] after:w-[12px] after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                      </div>
                    ))}
                    
                    {props.hasDivider && (
                      <div className="space-y-2.5 pl-3 border-l border-slate-200">
                        {renderStyleRow('Kiểu', (
                          <select
                            value={props.dividerStyle || 'solid'}
                            onChange={(e) => updateProp('dividerStyle', e.target.value)}
                            className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] outline-none bg-white font-semibold text-slate-700 focus:border-brand-500"
                          >
                            <option value="solid">Nét liền (Solid)</option>
                            <option value="dashed">Nét đứt (Dashed)</option>
                            <option value="dotted">Chấm bi (Dotted)</option>
                          </select>
                        ))}
                        {renderStyleRow(renderResponsiveLabel('Độ dày', 'dividerWeight'), renderUnitControl('dividerWeight', '1', 'px', { min: 1, max: 20 }))}
                        {renderStyleRow(renderResponsiveLabel('Màu sắc', 'dividerColor'), renderColorControl('dividerColor', '#cbd5e1'))}
                      </div>
                    )}
                  </div>
                ))}

                {renderStyleSection('Biểu tượng', (
                  <div className="space-y-2.5">
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveIconListIconHoverTab('normal')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconListIconHoverTab === 'normal'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIconListIconHoverTab('hover')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconListIconHoverTab === 'hover'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Di chuột
                      </button>
                    </div>

                    {activeIconListIconHoverTab === 'normal' ? (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColor'), renderColorControl('iconColor', '#3b82f6'))
                    ) : (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'iconColorHover'), renderColorControl('iconColorHover', '#2563eb'))
                    )}

                    {renderStyleRow(renderResponsiveLabel('Kích thước', 'iconSize'), renderUnitControl('iconSize', '14', 'px', { min: 8, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng trống', 'iconGap'), renderUnitControl('iconGap', '8', 'px', { min: 0, max: 100 }))}
                    
                    {renderStyleRow(renderResponsiveLabel('Căn chỉnh theo chiều dọc', 'iconVerticalAlign'), renderSegmentedControl(props.iconVerticalAlign || 'middle',
                      'middle',
                      [
                        { value: 'top', label: 'Trên' },
                        { value: 'middle', label: 'Giữa' },
                        { value: 'bottom', label: 'Dưới' },
                      ] as const,
                      (value: string) => updateProp('iconVerticalAlign', value)
                    ))}
                    {renderStyleRow(renderResponsiveLabel('Điều chỉnhnh Vị trí Dọc', 'iconOffsetY'), renderUnitControl('iconOffsetY', '0', 'px', { min: -20, max: 20 }))}
                  </div>
                ))}

                {renderStyleSection('Văn bản', (
                  <div className="space-y-2.5">
                    {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'text'), renderEditButton(`text-type-${selected.id}`, null, handleResetTypography, isTypographyModified))}
                    {renderPopoverPanel(`text-type-${selected.id}`, (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Gia đình</span>
                          <select
                            value={props.fontFamily || 'Inter'}
                            onChange={(e) => updateProp('fontFamily', e.target.value)}
                            className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                          >
                            <optgroup label="Cài đặt website">
                              <option value="var(--site-font-family-body)">Default: Body font</option>
                              <option value="var(--site-font-family-heading)">Default: Heading font</option>
                            </optgroup>
                            <optgroup label="Tất cả Font chữ Google">
                              {GOOGLE_FONTS.map((font: string) => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Kích thước</span>
                          {renderUnitControl('fontSize', '14', 'px', { min: 8, max: 80 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Độ đậm</span>
                          <select value={props.fontWeight || '400'} onChange={(e) => updateProp('fontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                            <option value="300">300 (Mỏng)</option>
                            <option value="400">400 (Bình thường)</option>
                            <option value="500">500 (Trung bình)</option>
                            <option value="600">600 (Nửa đậm)</option>
                            <option value="700">700 (Đậm)</option>
                            <option value="800">800 (Rất đậm)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Chuyển đổi</span>
                          <select value={props.textTransform || 'none'} onChange={(e) => updateProp('textTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                            <option value="none">Mặc định</option>
                            <option value="uppercase">In hoa</option>
                            <option value="lowercase">In thường</option>
                            <option value="capitalize">In hoa chữ cái đầu</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                          {renderSegmentedControl(props.fontStyle, 'normal', [
                            { value: 'normal', label: 'Bình thường' },
                            { value: 'italic', label: 'Nghiêng' },
                          ] as const, (value: string) => updateProp('fontStyle', value))}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Trang trí</span>
                          <select value={props.textDecoration || 'none'} onChange={(e) => updateProp('textDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                            <option value="none">Mặc định</option>
                            <option value="underline">Gạch chân</option>
                            <option value="overline">Gạch trên</option>
                            <option value="line-through">Gạch ngang</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Độ cao dòng</span>
                          {renderLineHeightControl()}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Dãn cách ký tự</span>
                          {renderUnitControl('letterSpacing', '0', 'px', { min: -5, max: 20 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Khoảng cách từ</span>
                          {renderUnitControl('wordSpacing', '0', 'px', { min: 0, max: 40 })}
                        </div>
                      </div>
                    ))}

                    {renderStyleRow(renderResponsiveLabel('Bóng văn bản', 'text'), renderEditButton(`text-shadow-${selected.id}`, null, handleResetTextShadow, isTextShadowModified))}
                    {renderPopoverPanel(`text-shadow-${selected.id}`, (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Màu sắc</span>
                          {renderColorControl('textShadowColor', 'rgba(0, 0, 0, 0.3)')}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Ngang</span>
                          {renderUnitControl('textShadowHorizontal', '0', 'px', { min: -50, max: 50 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Dọc</span>
                          {renderUnitControl('textShadowVertical', '0', 'px', { min: -50, max: 50 })}
                        </div>
                        <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                          <span className="font-medium text-slate-500">Độ mờ</span>
                          {renderUnitControl('textShadowBlur', '10', 'px', { min: 0, max: 100 })}
                        </div>
                      </div>
                    ))}

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveIconListTextHoverTab('normal')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconListTextHoverTab === 'normal'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Bình thường
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveIconListTextHoverTab('hover')}
                        className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                          activeIconListTextHoverTab === 'hover'
                            ? 'border-brand-500 text-brand-600 font-extrabold'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Di chuột
                      </button>
                    </div>

                    {activeIconListTextHoverTab === 'normal' ? (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'textColor'), renderColorControl('textColor', '#334155'))
                    ) : (
                      renderStyleRow(renderResponsiveLabel('Màu sắc', 'textColorHover'), renderColorControl('textColorHover', '#2563eb'))
                    )}
                  </div>
                ))}
              </>
            )}

            {name === 'Menu' && (
              <>
                {/* 1. Menu Items style section */}
                {renderStyleSection('Mục Menu', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách các mục', 'itemGap'), renderUnitControl('itemGap', '20', 'px', { min: 0, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách từ nội dung', 'distanceFromContent'), renderUnitControl('distanceFromContent', '0', 'px', { min: -50, max: 100 }))}
                    
                    <div className="relative">
                      {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'menu'), renderEditButton(`menu-item-type-${selected.id}`, null, () => {}, false))}
                      {renderPopoverPanel(`menu-item-type-${selected.id}`, (
                        <div className="space-y-3">
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Gia đình</span>
                            <select
                              value={props.fontFamily || 'Inter'}
                              onChange={(e) => updateProp('fontFamily', e.target.value)}
                              className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 outline-none w-full bg-white"
                            >
                              <optgroup label="Cài đặt website">
                                <option value="var(--site-font-family-body)">Default: Body font</option>
                                <option value="var(--site-font-family-heading)">Default: Heading font</option>
                              </optgroup>
                              <optgroup label="Tất cả Font chữ Google">
                                {GOOGLE_FONTS.map((font: string) => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kích thước</span>
                            {renderUnitControl('fontSize', '14', 'px', { min: 8, max: 80 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ đậm</span>
                            <select value={props.fontWeight || '600'} onChange={(e) => updateProp('fontWeight', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="100">100 (Rất mỏng)</option>
                              <option value="200">200 (Mỏng nhẹ)</option>
                              <option value="300">300 (Mỏng)</option>
                              <option value="400">400 (Bình thường)</option>
                              <option value="500">500 (Trung bình)</option>
                              <option value="600">600 (Nửa đậm)</option>
                              <option value="700">700 (Đậm)</option>
                              <option value="800">800 (Rất đậm)</option>
                              <option value="900">900 (Đen)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Kiểu hiển thị</span>
                            {renderSegmentedControl(props.fontStyle, 'normal', [
                              { value: 'normal', label: 'Bình thường' },
                              { value: 'italic', label: 'Nghiêng' },
                            ] as const, (value: string) => updateProp('fontStyle', value))}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Độ cao dòng</span>
                            {renderUnitControl('lineHeight', '1.5', 'em', { min: 0.5, max: 3 }, ['em', 'px', '%'])}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Dãn cách chữ</span>
                            {renderUnitControl('letterSpacing', '0', 'px', { min: -5, max: 20 })}
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Biến đổi</span>
                            <select value={props.textTransform || 'none'} onChange={(e) => updateProp('textTransform', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định (none)</option>
                              <option value="uppercase">VIẾT HOA (uppercase)</option>
                              <option value="lowercase">viết thường (lowercase)</option>
                              <option value="capitalize">Viết Hoa Chữ Đầu (capitalize)</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                            <span className="font-medium text-slate-500">Trang trí</span>
                            <select value={props.textDecoration || 'none'} onChange={(e) => updateProp('textDecoration', e.target.value)} className="h-7 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none w-full bg-white">
                              <option value="none">Mặc định (none)</option>
                              <option value="underline">Gạch chân (underline)</option>
                              <option value="overline">Gạch trên (overline)</option>
                              <option value="line-through">Gạch ngang (line-through)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveMenuHoverTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            activeMenuHoverTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {activeMenuHoverTab === 'normal' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColor'), renderColorControl('textColor', '#334155'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền mục', 'itemBgColor'), renderColorControl('itemBgColor', 'transparent'))}
                          <div className="relative">
                            {renderStyleRow(renderResponsiveLabel('Bóng chữ', 'item'), renderEditButton(`item-textShadow-${selected.id}`, null, () => updateProp('textShadow', ''), props.textShadow && props.textShadow !== 'none'))}
                            {renderPopoverPanel(`item-textShadow-${selected.id}`, renderTextShadowPopover('textShadow'))}
                          </div>
                        </>
                      )}
                      {activeMenuHoverTab === 'hover' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColorHover'), renderColorControl('textColorHover', '#3b82f6'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền mục', 'itemBgColorHover'), renderColorControl('itemBgColorHover', 'transparent'))}
                          <div className="relative">
                            {renderStyleRow(renderResponsiveLabel('Bóng chữ', 'item'), renderEditButton(`item-textShadow-hover-${selected.id}`, null, () => updateProp('textShadowHover', ''), props.textShadowHover && props.textShadowHover !== 'none'))}
                            {renderPopoverPanel(`item-textShadow-hover-${selected.id}`, renderTextShadowPopover('textShadowHover'))}
                          </div>
                        </>
                      )}
                      {activeMenuHoverTab === 'active' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu chữ', 'textColorActive'), renderColorControl('textColorActive', '#3b82f6'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền mục', 'itemBgColorActive'), renderColorControl('itemBgColorActive', 'transparent'))}
                          <div className="relative">
                            {renderStyleRow(renderResponsiveLabel('Bóng chữ', 'item'), renderEditButton(`item-textShadow-active-${selected.id}`, null, () => updateProp('textShadowActive', ''), props.textShadowActive && props.textShadowActive !== 'none'))}
                            {renderPopoverPanel(`item-textShadow-active-${selected.id}`, renderTextShadowPopover('textShadowActive'))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      {renderStyleRow('Loại đường viền', (
                        <select
                          value={props.itemBorderType || 'none'}
                          onChange={(e) => updateProp('itemBorderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                        >
                          <option value="none">Không có</option>
                          <option value="solid">Solid</option>
                          <option value="double">Double</option>
                          <option value="dotted">Dotted</option>
                          <option value="dashed">Dashed</option>
                        </select>
                      ))}
                      {props.itemBorderType && props.itemBorderType !== 'none' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu viền', 'itemBorderColor'), renderColorControl('itemBorderColor', '#cbd5e1'))}
                          {renderStyleRow(renderResponsiveLabel('Độ dày viền', 'itemBorderWidth'), renderUnitControl('itemBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                        </>
                      )}
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Đổ bóng mục', 'itemBoxShadow'), renderEditButton(`itemBoxShadow-${selected.id}`, null, () => updateProp('itemBoxShadow', ''), props.itemBoxShadow && props.itemBoxShadow !== 'none'))}
                        {renderPopoverPanel(`itemBoxShadow-${selected.id}`, renderBoxShadowPopover('itemBoxShadow'))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'itemBorderRadius',
                        'Bo góc mục',
                        ['itemBorderTopLeftRadius', 'itemBorderTopRightRadius', 'itemBorderBottomRightRadius', 'itemBorderBottomLeftRadius']
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'itemPadding',
                        'Lề trong mục',
                        ['itemPaddingTop', 'itemPaddingRight', 'itemPaddingBottom', 'itemPaddingLeft']
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {renderStyleRow('Hiện phân cách', (
                        <input
                          type="checkbox"
                          checked={props.showDivider || false}
                          onChange={(e) => updateProp('showDivider', e.target.checked)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                      ))}
                      {props.showDivider && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu đường phân cách', 'dividerColor'), renderColorControl('dividerColor', '#cbd5e1'))}
                          {renderStyleRow(renderResponsiveLabel('Độ dày', 'dividerWidth'), renderUnitControl('dividerWidth', '1', 'px', { min: 1, max: 10 }))}
                          {renderStyleRow(renderResponsiveLabel('Chiều cao', 'dividerHeight'), renderUnitControl('dividerHeight', '16', 'px', { min: 4, max: 100 }))}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* 2. Icon style section */}
                {renderStyleSection('Biểu tượng (Icon)', (
                  <div className="space-y-4">
                    {renderStyleRow('Vị trí icon', (
                      <select
                        value={props.iconPosition || 'left'}
                        onChange={(e) => updateProp('iconPosition', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                      >
                        <option value="left">Bên trái</option>
                        <option value="right">Bên phải</option>
                        <option value="top">Phía trên</option>
                        <option value="bottom">Phía dưới</option>
                        <option value="hidden">Ẩn</option>
                      </select>
                    ))}
                    {props.iconPosition !== 'hidden' && (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Kích thước icon', 'iconSize'), renderUnitControl('iconSize', '14', 'px', { min: 6, max: 60 }))}
                        {renderStyleRow(renderResponsiveLabel('Khoảng cách icon', 'iconSpacing'), renderUnitControl('iconSpacing', '6', 'px', { min: 0, max: 40 }))}

                        <div className="flex border-b border-slate-100 my-2 pt-1">
                          {['normal', 'hover', 'active'].map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setActiveMenuIconHoverTab(tab as any)}
                              className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                                activeMenuIconHoverTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          {activeMenuIconHoverTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu icon', 'iconColor'), renderColorControl('iconColor', '#64748b'))}
                          {activeMenuIconHoverTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu icon', 'iconColorHover'), renderColorControl('iconColorHover', '#3b82f6'))}
                          {activeMenuIconHoverTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu icon', 'iconColorActive'), renderColorControl('iconColorActive', '#3b82f6'))}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* 3. Dropdown Indicator style section */}
                {renderStyleSection('Chỉ báo menu con', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Kích thước mũi tên', 'indicatorSize'), renderUnitControl('indicatorSize', '12', 'px', { min: 4, max: 40 }))}
                    {renderStyleRow(renderResponsiveLabel('Góc xoay khi mở', 'indicatorRotate'), renderUnitControl('indicatorRotate', '180', 'deg', { min: 0, max: 360 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'indicatorSpace'), renderUnitControl('indicatorSpace', '4', 'px', { min: 0, max: 30 }))}

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveMenuIndicatorHoverTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            activeMenuIndicatorHoverTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : tab === 'hover' ? 'Di chuột' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {activeMenuIndicatorHoverTab === 'normal' && renderStyleRow(renderResponsiveLabel('Màu chỉ báo', 'indicatorColor'), renderColorControl('indicatorColor', '#64748b'))}
                      {activeMenuIndicatorHoverTab === 'hover' && renderStyleRow(renderResponsiveLabel('Màu chỉ báo', 'indicatorColorHover'), renderColorControl('indicatorColorHover', '#3b82f6'))}
                      {activeMenuIndicatorHoverTab === 'active' && renderStyleRow(renderResponsiveLabel('Màu chỉ báo', 'indicatorColorActive'), renderColorControl('indicatorColorActive', '#3b82f6'))}
                    </div>
                  </div>
                ))}

                {/* 4. Menu Toggle (Hamburger) style section */}
                {props.mobileBreakpoint && props.mobileBreakpoint !== 'none' && renderStyleSection('Nút kích hoạt di động', (
                  <div className="space-y-4">
                    {renderStyleRow('Icon kích hoạt', (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenIcon(props.toggleIcon || 'Menu', (iconName: string) => {
                            updateProp('toggleIcon', iconName);
                          });
                        }}
                        className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-between bg-white cursor-pointer"
                      >
                        <span className="truncate">{props.toggleIcon || 'Menu'}</span>
                        <Lucide.Search className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                    {renderStyleRow(renderResponsiveLabel('Kích thước icon', 'toggleSize'), renderUnitControl('toggleSize', '20', 'px', { min: 10, max: 100 }))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách tới dropdown', 'toggleDistanceFromDropdown'), renderUnitControl('toggleDistanceFromDropdown', '0', 'px', { min: -50, max: 100 }))}

                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'hover'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveMenuToggleHoverTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            activeMenuToggleHoverTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : 'Di chuột'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {activeMenuToggleHoverTab === 'normal' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'toggleColor'), renderColorControl('toggleColor', '#334155'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền', 'toggleBgColor'), renderColorControl('toggleBgColor', 'transparent'))}
                        </>
                      )}
                      {activeMenuToggleHoverTab === 'hover' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu sắc', 'toggleColorHover'), renderColorControl('toggleColorHover', '#3b82f6'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền', 'toggleBgColorHover'), renderColorControl('toggleBgColorHover', 'transparent'))}
                        </>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      {renderStyleRow('Loại viền nút', (
                        <select
                          value={props.toggleBorderType || 'none'}
                          onChange={(e) => updateProp('toggleBorderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                        >
                          <option value="none">Không có</option>
                          <option value="solid">Solid</option>
                          <option value="double">Double</option>
                          <option value="dotted">Dotted</option>
                          <option value="dashed">Dashed</option>
                        </select>
                      ))}
                      {props.toggleBorderType && props.toggleBorderType !== 'none' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu viền nút', 'toggleBorderColor'), renderColorControl('toggleBorderColor', '#cbd5e1'))}
                          {renderStyleRow(renderResponsiveLabel('Độ dày viền nút', 'toggleBorderWidth'), renderUnitControl('toggleBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                        </>
                      )}
                      {renderStyleRow(renderResponsiveLabel('Bo góc nút', 'toggleBorderRadius'), renderUnitControl('toggleBorderRadius', '4', 'px', { min: 0, max: 100 }))}
                      
                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Đổ bóng nút', 'toggleBoxShadow'), renderEditButton(`toggleBoxShadow-${selected.id}`, null, () => updateProp('toggleBoxShadow', ''), props.toggleBoxShadow && props.toggleBoxShadow !== 'none'))}
                        {renderPopoverPanel(`toggleBoxShadow-${selected.id}`, renderBoxShadowPopover('toggleBoxShadow'))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'togglePadding',
                        'Lề trong nút',
                        ['togglePaddingTop', 'togglePaddingRight', 'togglePaddingBottom', 'togglePaddingLeft']
                      )}
                    </div>
                  </div>
                ))}

                {/* 5. Nav wrapper Content style section */}
                {renderStyleSection('Khung chứa (Wrapper)', (
                  <div className="space-y-4">
                    {renderStyleRow(renderResponsiveLabel('Màu nền khung', 'contentBgColor'), renderColorControl('contentBgColor', 'transparent'))}
                    
                    {renderStyleRow('Loại viền khung', (
                      <select
                        value={props.contentBorderType || 'none'}
                        onChange={(e) => updateProp('contentBorderType', e.target.value)}
                        className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                      >
                        <option value="none">Không có</option>
                        <option value="solid">Solid</option>
                        <option value="double">Double</option>
                        <option value="dotted">Dotted</option>
                        <option value="dashed">Dashed</option>
                      </select>
                    ))}
                    {props.contentBorderType && props.contentBorderType !== 'none' && (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu viền khung', 'contentBorderColor'), renderColorControl('contentBorderColor', '#cbd5e1'))}
                        {renderStyleRow(renderResponsiveLabel('Độ dày viền khung', 'contentBorderWidth'), renderUnitControl('contentBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                      </>
                    )}
                    {renderStyleRow(renderResponsiveLabel('Bo góc khung', 'contentBorderRadius'), renderUnitControl('contentBorderRadius', '0', 'px', { min: 0, max: 100 }))}
                    
                    <div className="relative">
                      {renderStyleRow(renderResponsiveLabel('Đổ bóng khung', 'contentBoxShadow'), renderEditButton(`contentBoxShadow-${selected.id}`, null, () => updateProp('contentBoxShadow', ''), props.contentBoxShadow && props.contentBoxShadow !== 'none'))}
                      {renderPopoverPanel(`contentBoxShadow-${selected.id}`, renderBoxShadowPopover('contentBoxShadow'))}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      {renderSpacingControl(
                        'contentPadding',
                        'Lề trong khung',
                        ['contentPaddingTop', 'contentPaddingRight', 'contentPaddingBottom', 'contentPaddingLeft']
                      )}
                    </div>
                  </div>
                ))}

                {/* 6. Dropdown Menu box and items style section */}
                {renderStyleSection('Hộp menu con (Dropdown)', (
                  <div className="space-y-4">
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      {['normal', 'active'].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveDropdownMenuHoverTab(tab as any)}
                          className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${
                            activeDropdownMenuHoverTab === tab ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab === 'normal' ? 'Bình thường' : 'Kích hoạt'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {activeDropdownMenuHoverTab === 'normal' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu chữ', 'dropdownTextColor'), renderColorControl('dropdownTextColor', '#334155'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền mục', 'dropdownItemBgColor'), renderColorControl('dropdownItemBgColor', '#ffffff'))}
                        </>
                      )}
                      {activeDropdownMenuHoverTab === 'active' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu chữ', 'dropdownTextColorActive'), renderColorControl('dropdownTextColorActive', '#3b82f6'))}
                          {renderStyleRow(renderResponsiveLabel('Màu nền mục', 'dropdownItemBgColorActive'), renderColorControl('dropdownItemBgColorActive', '#f8fafc'))}
                        </>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      {renderStyleRow('Loại viền hộp', (
                        <select
                          value={props.dropdownBorderType || 'solid'}
                          onChange={(e) => updateProp('dropdownBorderType', e.target.value)}
                          className="h-7 w-full rounded border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none focus:border-brand-500"
                        >
                          <option value="none">Không có</option>
                          <option value="solid">Solid</option>
                          <option value="double">Double</option>
                          <option value="dotted">Dotted</option>
                          <option value="dashed">Dashed</option>
                        </select>
                      ))}
                      {props.dropdownBorderType && props.dropdownBorderType !== 'none' && (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Màu viền hộp', 'dropdownBorderColor'), renderColorControl('dropdownBorderColor', '#cbd5e1'))}
                          {renderStyleRow(renderResponsiveLabel('Độ dày viền hộp', 'dropdownBorderWidth'), renderUnitControl('dropdownBorderWidth', '1', 'px', { min: 0, max: 20 }))}
                        </>
                      )}
                      {renderStyleRow(renderResponsiveLabel('Bo góc hộp', 'dropdownBorderRadius'), renderUnitControl('dropdownBorderRadius', '6', 'px', { min: 0, max: 100 }))}

                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Đổ bóng hộp', 'dropdownBoxShadow'), renderEditButton(`dropdownBoxShadow-${selected.id}`, null, () => updateProp('dropdownBoxShadow', ''), props.dropdownBoxShadow && props.dropdownBoxShadow !== 'none'))}
                        {renderPopoverPanel(`dropdownBoxShadow-${selected.id}`, renderBoxShadowPopover('dropdownBoxShadow'))}
                      </div>

                      <div className="relative">
                        {renderStyleRow(renderResponsiveLabel('Đổ bóng mục con', 'dropdownItemBoxShadow'), renderEditButton(`dropdownItemBoxShadow-${selected.id}`, null, () => updateProp('dropdownItemBoxShadow', ''), props.dropdownItemBoxShadow && props.dropdownItemBoxShadow !== 'none'))}
                        {renderPopoverPanel(`dropdownItemBoxShadow-${selected.id}`, renderBoxShadowPopover('dropdownItemBoxShadow'))}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {(name === 'Form' || name === 'Biểu mẫu' || name === 'FormBlock') && (
              <>
                {renderStyleSection('Bố cục Form', (
                  <>
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách cột', 'formColumnGap'), renderUnitControl('formColumnGap', props.formColumnGap || '20'))}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách dòng', 'formRowGap'), renderUnitControl('formRowGap', props.formRowGap || '20'))}
                  </>
                ))}

                {renderStyleSection('Nhãn (Label)', (
                  <>
                    {renderStyleRow(renderResponsiveLabel('Màu chữ', 'labelColor'), renderColorControl('labelColor', props.labelColor || '#475569'))}
                    {(() => {
                      const isLabelTypoModified = props.labelFontFamily || props.labelFontSize || props.labelFontWeight !== '600' || props.labelFontStyle || props.labelLineHeight || props.labelLetterSpacing || props.labelWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'label'), renderEditButton(`label-type-${selected.id}`, null, () => {
                            updateProp('labelFontFamily', '');
                            updateProp('labelFontSize', '');
                            updateProp('labelFontWeight', '600');
                            updateProp('labelFontStyle', '');
                            updateProp('labelLineHeight', '');
                            updateProp('labelLetterSpacing', '');
                            updateProp('labelWordSpacing', '');
                          }, isLabelTypoModified))}
                          {renderPopoverPanel(`label-type-${selected.id}`, renderTypographyFields('label', '13', '600'))}
                        </>
                      );
                    })()}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách tới Input', 'labelSpacing'), renderUnitControl('labelSpacing', props.labelSpacing || '6'))}
                  </>
                ))}

                {renderStyleSection('Ô nhập liệu (Field)', (
                  <>
                    {renderStyleRow(renderResponsiveLabel('Màu chữ', 'fieldColor'), renderColorControl('fieldColor', props.fieldColor || '#334155'))}
                    {renderStyleRow(renderResponsiveLabel('Màu nền', 'fieldBgColor'), renderColorControl('fieldBgColor', props.fieldBgColor || '#ffffff'))}
                    {renderStyleRow(renderResponsiveLabel('Màu nền (Focus)', 'fieldBgColorFocus'), renderColorControl('fieldBgColorFocus', props.fieldBgColorFocus || '#ffffff'))}
                    {renderStyleRow(renderResponsiveLabel('Màu viền', 'fieldBorderColor'), renderColorControl('fieldBorderColor', props.fieldBorderColor || '#e2e8f0'))}
                    {renderStyleRow(renderResponsiveLabel('Màu viền (Focus)', 'fieldBorderColorFocus'), renderColorControl('fieldBorderColorFocus', props.fieldBorderColorFocus || '#3b82f6'))}
                    {(() => {
                      const isFieldTypoModified = props.fieldFontFamily || props.fieldFontSize || props.fieldFontWeight !== '400' || props.fieldFontStyle || props.fieldLineHeight || props.fieldLetterSpacing || props.fieldWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'field'), renderEditButton(`field-type-${selected.id}`, null, () => {
                            updateProp('fieldFontFamily', '');
                            updateProp('fieldFontSize', '');
                            updateProp('fieldFontWeight', '400');
                            updateProp('fieldFontStyle', '');
                            updateProp('fieldLineHeight', '');
                            updateProp('fieldLetterSpacing', '');
                            updateProp('fieldWordSpacing', '');
                          }, isFieldTypoModified))}
                          {renderPopoverPanel(`field-type-${selected.id}`, renderTypographyFields('field', '14', '400'))}
                        </>
                      );
                    })()}
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ dày viền</span>
                      {renderUnitControl('fieldBorderWidth', props.fieldBorderWidth || '1', 'px', { min: 0, max: 10 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Bo góc</span>
                      {renderUnitControl('fieldBorderRadius', props.fieldBorderRadius || '6', 'px', { min: 0, max: 50 })}
                    </div>
                  </>
                ))}

                {renderStyleSection('Nút bấm (Buttons)', (
                  <>
                    {renderStyleRow(renderResponsiveLabel('Căn lề', 'formButtonAlign'), renderSegmentedControl(props.formButtonAlign || 'left',
                      'left',
                      [
                        { value: 'left', label: <Lucide.AlignLeft size={12} /> },
                        { value: 'center', label: <Lucide.AlignCenter size={12} /> },
                        { value: 'right', label: <Lucide.AlignRight size={12} /> },
                        { value: 'justify', label: <Lucide.AlignJustify size={12} /> }
                      ] as const,
                      (val: string) => updateProp('formButtonAlign', val)
                    ))}
                    {(() => {
                      const isBtnTypoModified = props.btnFontFamily || props.btnFontSize || props.btnFontWeight !== '600' || props.btnFontStyle || props.btnLineHeight || props.btnLetterSpacing || props.btnWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'btn'), renderEditButton(`btn-type-${selected.id}`, null, () => {
                            updateProp('btnFontFamily', '');
                            updateProp('btnFontSize', '');
                            updateProp('btnFontWeight', '600');
                            updateProp('btnFontStyle', '');
                            updateProp('btnLineHeight', '');
                            updateProp('btnLetterSpacing', '');
                            updateProp('btnWordSpacing', '');
                          }, isBtnTypoModified))}
                          {renderPopoverPanel(`btn-type-${selected.id}`, renderTypographyFields('btn', '13', '600'))}
                        </>
                      );
                    })()}
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Bo góc</span>
                      {renderUnitControl('formButtonRadius', props.formButtonRadius || '6', 'px', { min: 0, max: 50 })}
                    </div>

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Nút Submit / Next</div>
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button type="button" onClick={() => updateProp('activeFormSubmitBtnTab', 'normal')} className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${(!props.activeFormSubmitBtnTab || props.activeFormSubmitBtnTab === 'normal') ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Bình thường</button>
                      <button type="button" onClick={() => updateProp('activeFormSubmitBtnTab', 'hover')} className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${(props.activeFormSubmitBtnTab === 'hover') ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Di chuột</button>
                    </div>
                    {(!props.activeFormSubmitBtnTab || props.activeFormSubmitBtnTab === 'normal') ? (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu nền', 'submitBtnBg'), renderColorControl('submitBtnBg', props.submitBtnBg || '#3b82f6'))}
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'submitBtnText'), renderColorControl('submitBtnText', props.submitBtnText || '#ffffff'))}
                      </>
                    ) : (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu nền', 'submitBtnBgHover'), renderColorControl('submitBtnBgHover', props.submitBtnBgHover || '#2563eb'))}
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'submitBtnTextHover'), renderColorControl('submitBtnTextHover', props.submitBtnTextHover || '#ffffff'))}
                      </>
                    )}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Nút Previous</div>
                    <div className="flex border-b border-slate-100 my-2 pt-1">
                      <button type="button" onClick={() => updateProp('activeFormPrevBtnTab', 'normal')} className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${(!props.activeFormPrevBtnTab || props.activeFormPrevBtnTab === 'normal') ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Bình thường</button>
                      <button type="button" onClick={() => updateProp('activeFormPrevBtnTab', 'hover')} className={`flex-1 py-1 text-center text-[10px] font-bold border-b-2 transition-all ${(props.activeFormPrevBtnTab === 'hover') ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Di chuột</button>
                    </div>
                    {(!props.activeFormPrevBtnTab || props.activeFormPrevBtnTab === 'normal') ? (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu nền', 'prevBtnBg'), renderColorControl('prevBtnBg', props.prevBtnBg || '#e2e8f0'))}
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'prevBtnText'), renderColorControl('prevBtnText', props.prevBtnText || '#475569'))}
                      </>
                    ) : (
                      <>
                        {renderStyleRow(renderResponsiveLabel('Màu nền', 'prevBtnBgHover'), renderColorControl('prevBtnBgHover', props.prevBtnBgHover || '#cbd5e1'))}
                        {renderStyleRow(renderResponsiveLabel('Màu chữ', 'prevBtnTextHover'), renderColorControl('prevBtnTextHover', props.prevBtnTextHover || '#334155'))}
                      </>
                    )}
                  </>
                ))}

                {renderStyleSection('Thông báo (Messages)', (
                  <>
                    {(() => {
                      const isMsgTypoModified = props.msgFontFamily || props.msgFontSize || props.msgFontWeight !== '500' || props.msgFontStyle || props.msgLineHeight || props.msgLetterSpacing || props.msgWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'msg'), renderEditButton(`msg-type-${selected.id}`, null, () => {
                            updateProp('msgFontFamily', '');
                            updateProp('msgFontSize', '');
                            updateProp('msgFontWeight', '500');
                            updateProp('msgFontStyle', '');
                            updateProp('msgLineHeight', '');
                            updateProp('msgLetterSpacing', '');
                            updateProp('msgWordSpacing', '');
                          }, isMsgTypoModified))}
                          {renderPopoverPanel(`msg-type-${selected.id}`, renderTypographyFields('msg', '12', '500'))}
                        </>
                      );
                    })()}
                    {renderStyleRow(renderResponsiveLabel('Thành công', 'successMessageColor'), renderColorControl('successMessageColor', props.successMessageColor || '#10b981'))}
                    {renderStyleRow(renderResponsiveLabel('Lỗi tổng thể', 'errorMessageColor'), renderColorControl('errorMessageColor', props.errorMessageColor || '#ef4444'))}
                    {renderStyleRow(renderResponsiveLabel('Lỗi từng dòng', 'inlineMessageColor'), renderColorControl('inlineMessageColor', props.inlineMessageColor || '#ef4444'))}
                  </>
                ))}

                {((props.fields || []).some((f: any) => f.type === 'step')) && renderStyleSection('Thanh Bước (Steps)', (
                  <>
                    {(() => {
                      const isStepTypoModified = props.stepFontFamily || props.stepFontSize || props.stepFontWeight !== '600' || props.stepFontStyle || props.stepLineHeight || props.stepLetterSpacing || props.stepWordSpacing;
                      return (
                        <>
                          {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'step'), renderEditButton(`step-type-${selected.id}`, null, () => {
                            updateProp('stepFontFamily', '');
                            updateProp('stepFontSize', '');
                            updateProp('stepFontWeight', '600');
                            updateProp('stepFontStyle', '');
                            updateProp('stepLineHeight', '');
                            updateProp('stepLetterSpacing', '');
                            updateProp('stepWordSpacing', '');
                          }, isStepTypoModified))}
                          {renderPopoverPanel(`step-type-${selected.id}`, renderTypographyFields('step', '12', '600'))}
                        </>
                      );
                    })()}
                    {renderStyleRow(renderResponsiveLabel('Khoảng cách', 'stepSpacing'), renderUnitControl('stepSpacing', props.stepSpacing || '16'))}
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ dày viền (px)</span>
                      {renderUnitControl('stepBorderWidth', props.stepBorderWidth || '2', 'px', { min: 0, max: 10 })}
                    </div>
                    
                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Trạng thái: Chưa kích hoạt</div>
                    {renderStyleRow(renderResponsiveLabel('Màu chính (Viền/Nền)', 'stepInactivePrimary'), renderColorControl('stepInactivePrimary', props.stepInactivePrimary || '#e2e8f0'))}
                    {renderStyleRow(renderResponsiveLabel('Màu phụ (Chữ/Số)', 'stepInactiveSecondary'), renderColorControl('stepInactiveSecondary', props.stepInactiveSecondary || '#94a3b8'))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Trạng thái: Đang ở</div>
                    {renderStyleRow(renderResponsiveLabel('Màu chính', 'stepActivePrimary'), renderColorControl('stepActivePrimary', props.stepActivePrimary || '#3b82f6'))}
                    {renderStyleRow(renderResponsiveLabel('Màu phụ', 'stepActiveSecondary'), renderColorControl('stepActiveSecondary', props.stepActiveSecondary || '#ffffff'))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Trạng thái: Hoàn thành</div>
                    {renderStyleRow(renderResponsiveLabel('Màu chính', 'stepCompletedPrimary'), renderColorControl('stepCompletedPrimary', props.stepCompletedPrimary || '#10b981'))}
                    {renderStyleRow(renderResponsiveLabel('Màu phụ', 'stepCompletedSecondary'), renderColorControl('stepCompletedSecondary', props.stepCompletedSecondary || '#ffffff'))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Đường nối (Divider)</div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Độ dày</span>
                      {renderUnitControl('stepDividerWidth', props.stepDividerWidth || '2', 'px', { min: 1, max: 10 })}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Khoảng hở</span>
                      {renderUnitControl('stepDividerGap', props.stepDividerGap || '8', 'px', { min: 0, max: 30 })}
                    </div>
                  </>
                ))}
              </>
            )}

            {(name === 'Danh sách bài viết' || name === 'PostGridBlock') && (
              <>
                {renderAccordionSection('postgrid_style_layout', 'Layout', (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Columns Gap</span>
                      {renderSliderControl('columnsGap', parseInt(props.columnsGap || '30'), { min: 0, max: 100, step: 1 }, (key, value) => updateProp('columnsGap', `${value}px`))}
                    </div>
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Rows Gap</span>
                      {renderSliderControl('rowsGap', parseInt(props.rowsGap || '35'), { min: 0, max: 100, step: 1 }, (key, value) => updateProp('rowsGap', `${value}px`))}
                    </div>
                    {renderStyleRow(renderResponsiveLabel('Alignment', 'alignment'), renderSegmentedControl(props.alignment, 'left', [
                      { value: 'left', label: <Lucide.AlignLeft size={12} />, tooltip: 'Trái' } as any,
                      { value: 'center', label: <Lucide.AlignCenter size={12} />, tooltip: 'Giữa' } as any,
                      { value: 'right', label: <Lucide.AlignRight size={12} />, tooltip: 'Phải' } as any
                    ], (v: string) => updateProp('alignment', v)))}
                  </div>
                ))}

                {renderAccordionSection('postgrid_style_box', 'Box', (
                  <div className="space-y-3">
                    {renderSpacingControl('postGridBorderWidth', 'Border Width', ['boxBorderTopWidth', 'boxBorderRightWidth', 'boxBorderBottomWidth', 'boxBorderLeftWidth'])}
                    
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Border Radius</span>
                      {renderSliderControl('boxBorderRadius', parseInt(props.boxBorderTopLeftRadius || '0'), { min: 0, max: 100, step: 1 }, (key, value) => {
                        updateProp('boxBorderTopLeftRadius', `${value}px`); updateProp('boxBorderTopRightRadius', `${value}px`);
                        updateProp('boxBorderBottomRightRadius', `${value}px`); updateProp('boxBorderBottomLeftRadius', `${value}px`);
                      })}
                    </div>

                    {renderSpacingControl('postGridPadding', 'Padding', ['boxPaddingTop', 'boxPaddingRight', 'boxPaddingBottom', 'boxPaddingLeft'])}
                    
                    {renderSpacingControl('postGridContentPadding', 'Content Padding', ['boxContentPaddingTop', 'boxContentPaddingRight', 'boxContentPaddingBottom', 'boxContentPaddingLeft'])}
                    
                    <hr className="border-slate-100" />
                    
                    {renderStyleRow(renderResponsiveLabel('Đổ bóng', 'box'), renderEditButton(`box-shadow-${selected.id}`, null, () => updateProp('boxShadow', 'none'), props.boxShadow && props.boxShadow !== 'none'))}
                    {renderPopoverPanel(`box-shadow-${selected.id}`, renderBoxShadowFields(parseBoxShadow(props.boxShadow), (s) => updateProp('boxShadow', serializeBoxShadow(s))))}

                    <div className="flex border-b border-slate-200 mt-2">
                      <button className={`flex-1 py-1.5 text-center text-[10px] font-bold ${activeBgTab === 'normal' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-400'}`} onClick={() => setActiveBgTab('normal')}>Normal</button>
                      <button className={`flex-1 py-1.5 text-center text-[10px] font-bold ${activeBgTab === 'hover' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-400'}`} onClick={() => setActiveBgTab('hover')}>Hover</button>
                    </div>
                    {activeBgTab === 'normal' && (
                      <div className="space-y-3 pt-2">
                        {renderStyleRow(renderResponsiveLabel('Background Color', 'boxBgColor'), renderColorControl('boxBgColor', 'transparent', undefined, props.boxBgColor, (v: string) => updateProp('boxBgColor', v)))}
                        {renderStyleRow(renderResponsiveLabel('Border Color', 'boxBorderColor'), renderColorControl('boxBorderColor', 'transparent', undefined, props.boxBorderColor, (v: string) => updateProp('boxBorderColor', v)))}
                      </div>
                    )}
                    {activeBgTab === 'hover' && (
                      <div className="space-y-3 pt-2">
                        {renderStyleRow(renderResponsiveLabel('Background Color', 'boxBgColorHover'), renderColorControl('boxBgColorHover', 'transparent', undefined, props.boxBgColorHover, (v: string) => updateProp('boxBgColorHover', v)))}
                        {renderStyleRow(renderResponsiveLabel('Border Color', 'boxBorderColorHover'), renderColorControl('boxBorderColorHover', 'transparent', undefined, props.boxBorderColorHover, (v: string) => updateProp('boxBorderColorHover', v)))}
                      </div>
                    )}
                  </div>
                ))}
                
                {renderAccordionSection('postgrid_style_image', 'Image', (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[82px_1fr] items-center gap-3 text-[11px]">
                      <span className="font-medium text-slate-500">Border Radius</span>
                      {renderSliderControl('imgBorderRadius', parseInt(props.imgBorderTopLeftRadius || '0'), { min: 0, max: 100, step: 1 }, (key, value) => {
                        updateProp('imgBorderTopLeftRadius', `${value}px`); updateProp('imgBorderTopRightRadius', `${value}px`);
                        updateProp('imgBorderBottomRightRadius', `${value}px`); updateProp('imgBorderBottomLeftRadius', `${value}px`);
                      })}
                    </div>
                  </div>
                ))}
                
                {renderAccordionSection('postgrid_style_content', 'Content', (
                  <div className="space-y-3">
                    <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 pt-1">Tiêu đề</div>
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'titleColor'), renderColorControl('titleColor', '#0f172a'))}
                    {renderStyleRow(renderResponsiveLabel('Màu khi trỏ chuột', 'titleColorHover'), renderColorControl('titleColorHover', '#4f46e5'))}
                    {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'title'), renderEditButton(`title-type-${selected.id}`, null, () => {
                      updateProp('titleFontFamily', ''); updateProp('titleFontSize', ''); updateProp('titleFontWeight', ''); updateProp('titleFontStyle', ''); updateProp('titleLineHeight', ''); updateProp('titleLetterSpacing', ''); updateProp('titleWordSpacing', '');
                    }, Boolean(props.titleFontFamily || props.titleFontSize || props.titleFontWeight || props.titleFontStyle || props.titleLineHeight || props.titleLetterSpacing || props.titleWordSpacing)))}
                    {renderPopoverPanel(`title-type-${selected.id}`, renderTypographyFields('title', '18', '800'))}
                    {renderStyleRow(renderResponsiveLabel('Margin Bottom', 'titleMarginBottom'), renderUnitControl('titleMarginBottom', '12', 'px', { min: 0, max: 60 }))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Đoạn trích (Excerpt)</div>
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'excerptColor'), renderColorControl('excerptColor', '#64748b'))}
                    {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'excerpt'), renderEditButton(`excerpt-type-${selected.id}`, null, () => {
                      updateProp('excerptFontFamily', ''); updateProp('excerptFontSize', ''); updateProp('excerptFontWeight', ''); updateProp('excerptFontStyle', ''); updateProp('excerptLineHeight', ''); updateProp('excerptLetterSpacing', ''); updateProp('excerptWordSpacing', '');
                    }, Boolean(props.excerptFontFamily || props.excerptFontSize || props.excerptFontWeight || props.excerptFontStyle || props.excerptLineHeight || props.excerptLetterSpacing || props.excerptWordSpacing)))}
                    {renderPopoverPanel(`excerpt-type-${selected.id}`, renderTypographyFields('excerpt', '13', '400'))}
                    {renderStyleRow(renderResponsiveLabel('Margin Bottom', 'excerptMarginBottom'), renderUnitControl('excerptMarginBottom', '16', 'px', { min: 0, max: 60 }))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Meta (Ngày, Tác giả...)</div>
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'metaColor'), renderColorControl('metaColor', '#94a3b8'))}
                    {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'meta'), renderEditButton(`meta-type-${selected.id}`, null, () => {
                      updateProp('metaFontFamily', ''); updateProp('metaFontSize', ''); updateProp('metaFontWeight', ''); updateProp('metaFontStyle', ''); updateProp('metaLineHeight', ''); updateProp('metaLetterSpacing', ''); updateProp('metaWordSpacing', '');
                    }, Boolean(props.metaFontFamily || props.metaFontSize || props.metaFontWeight || props.metaFontStyle || props.metaLineHeight || props.metaLetterSpacing || props.metaWordSpacing)))}
                    {renderPopoverPanel(`meta-type-${selected.id}`, renderTypographyFields('meta', '10', '700'))}
                    {renderStyleRow(renderResponsiveLabel('Margin Bottom', 'metaMarginBottom'), renderUnitControl('metaMarginBottom', '12', 'px', { min: 0, max: 60 }))}

                    <div className="mt-3 font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2 border-t border-slate-100 pt-3">Read More</div>
                    {renderStyleRow(renderResponsiveLabel('Màu sắc', 'readMoreColor'), renderColorControl('readMoreColor', '#4f46e5'))}
                    {renderStyleRow(renderResponsiveLabel('Màu khi trỏ chuột', 'readMoreColorHover'), renderColorControl('readMoreColorHover', '#4338ca'))}
                    {renderStyleRow(renderResponsiveLabel('Kiểu chữ', 'readMore'), renderEditButton(`readMore-type-${selected.id}`, null, () => {
                      updateProp('readMoreFontFamily', ''); updateProp('readMoreFontSize', ''); updateProp('readMoreFontWeight', ''); updateProp('readMoreFontStyle', ''); updateProp('readMoreLineHeight', ''); updateProp('readMoreLetterSpacing', ''); updateProp('readMoreWordSpacing', '');
                    }, Boolean(props.readMoreFontFamily || props.readMoreFontSize || props.readMoreFontWeight || props.readMoreFontStyle || props.readMoreLineHeight || props.readMoreLetterSpacing || props.readMoreWordSpacing)))}
                    {renderPopoverPanel(`readMore-type-${selected.id}`, renderTypographyFields('readMore', '12', '800'))}
                  </div>
                ))}
              </>
            )}

            {showBorderInStyle && renderStyleSection('Đường viền & Góc bo', borderAndRadiusOptions)}

            {(name === 'Vùng chứa' || name === 'Lưới') && renderStyleSection('Bóng', (
              renderStyleRow('Box shadow', (
                <select value={props.shadow || 'none'} onChange={(e) => updateProp('shadow', e.target.value)} className="h-7 w-full rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 outline-none">
                  <option value="none">Không</option>
                  <option value="sm">Nhỏ</option>
                  <option value="md">Vừa</option>
                  <option value="lg">Lớn</option>
                  <option value="xl">Rất lớn</option>
                  <option value="2xl">2XL</option>
                </select>
              ))
            ))}

            {!(name === 'Văn bản' || name === 'Danh sách bài viết' || name === 'PostGridBlock' || name === 'Tiêu đề' || name === 'Nút bấm' || name === 'Hình ảnh' || name === 'Video' || name === 'Đường phân cách' || name === 'Vùng chứa' || name === 'Lưới' || name === 'Biểu tượng' || name === 'Sập mở (FAQ)' || name === 'Danh sách' || name === 'Khoảng trống' || name === 'Mã HTML' || name === 'Tabs' || name === 'Hộp Icon' || name === 'Hộp hình ảnh' || name === 'Băng chuyền hình ảnh' || name === 'Bộ đếm' || name === 'Thanh tiến trình' || name === 'Icon Mạng Xã Hội' || name === 'SocialIconsBlock' || name === 'Form' || name === 'Biểu mẫu' || name === 'FormBlock' || name === 'Menu') && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-[11px] font-semibold text-slate-400">
                Thành phần này chưa có tùy chọn kiểu hiển thị riêng.
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <AdvancedPanel
            ctx={{
              props,
              name,
              SPACING_UNITS,
              Lucide,
              activeBgTab,
              setActiveBgTab,
              updateProp,
              renderAccordionSection,
              renderSpacingControl,
              renderUnitControl,
              renderSegmentedControl,
              renderStyleRow,
              renderColorControl,
              registerStepper,
              startStepping,
              stopStepping,
              borderAndRadiusOptions,
              renderResponsiveLabel,
            }}
          />
        )}
        </>
        );
        })()
  );
}
