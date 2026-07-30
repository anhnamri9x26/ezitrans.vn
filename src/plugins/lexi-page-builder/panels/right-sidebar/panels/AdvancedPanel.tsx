import { guardCustomCss, validateCssClasses, validateElementId } from '../../../utils/customCssEngine';

type AdvancedPanelCtx = {
  props: Record<string, any>;
  name: string;
  SPACING_UNITS: readonly string[];
  Lucide: any;
  activeBgTab: 'normal' | 'hover';
  setActiveBgTab: (tab: 'normal' | 'hover') => void;
  updateProp: (key: string, value: unknown) => void;
  renderAccordionSection: (sectionId: string, title: string, children: React.ReactNode, defaultExpanded?: boolean) => React.ReactNode;
  renderSpacingControl: (group: string, title: string, keys: readonly [string, string, string, string]) => React.ReactNode;
  renderUnitControl: (...args: any[]) => React.ReactNode;
  renderSegmentedControl: (...args: any[]) => React.ReactNode;
  renderStyleRow: (label: React.ReactNode, control: React.ReactNode) => React.ReactNode;
  renderColorControl: (...args: any[]) => React.ReactNode;
  registerStepper: (id: string, action: () => void) => null;
  startStepping: (id: string, action: () => void) => void;
  stopStepping: () => void;
  borderAndRadiusOptions: React.ReactNode;
  renderResponsiveLabel: (label: string | React.ReactNode, id: string | string[]) => React.ReactNode;
};

export function AdvancedPanel({ ctx }: { ctx: AdvancedPanelCtx }) {
  const {
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
  } = ctx;
  const elementIdValidation = validateElementId(props.idCss || '');
  const cssClassesValidation = validateCssClasses(props.classCss || '');
  const customCssGuard = guardCustomCss(props.customCss || '');

  return (
  <div className="space-y-4 animate-fade-in pb-8">
    {renderAccordionSection('advanced_layout', 'Bố cục', (
      <>
      {renderSpacingControl('margin', 'Lề ngoài', ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'])}
      {renderSpacingControl('padding', 'Lề trong', ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'])}

      <div className="space-y-1.5">
        <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Chiều rộng', 'widthMode')}</label>
        <select
          value={props.widthMode || (name === 'Hình ảnh' || name === 'Video' || name === 'Đường phân cách' || name === 'Khoảng trống' || name === 'Danh sách' || name === 'Sập mở (FAQ)' || name === 'Mã HTML' || name === 'Menu' ? 'full' : 'default')}
          onChange={(e) => {
            const mode = e.target.value;
            updateProp('widthMode', mode);
            if (mode === 'full') updateProp('width', '100%');
            if (mode === 'inline') updateProp('width', 'auto');
            if (mode === 'default' && name === 'Nút bấm') updateProp('width', 'auto');
            if (mode === 'full' && name === 'Nút bấm') updateProp('width', 'full');
          }}
          className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none"
        >
          <option value="default">Mặc định</option>
          <option value="inline">Ôm nội dung</option>
          <option value="full">Kéo giãn / Toàn chiều rộng</option>
          <option value="custom">Tùy chỉnh</option>
        </select>
      </div>

      {props.widthMode === 'custom' && (
        <div className="space-y-1.5 animate-fade-in">
          <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Chiều rộng tùy chỉnh', ['customWidth', 'width'])}</label>
          {renderUnitControl('customWidth', '320', 'px', undefined, SPACING_UNITS, (val: string) => updateProp('width', val))}
        </div>
      )}

      {(name === 'Hình ảnh' || name === 'Video' || name === 'Đường phân cách') && (
        <div className="grid grid-cols-4 gap-1">
          {['100%', 'auto', '320px', '50%'].map((value) => (
            <button
              key={value}
              onClick={() => {
                updateProp('widthMode', value === '100%' ? 'full' : value === 'auto' ? 'inline' : 'custom');
                updateProp('customWidth', value);
                updateProp('width', value);
              }}
              className={`rounded border px-1.5 py-1 text-[9px] font-bold transition-colors ${(props.width === value || props.customWidth === value) ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Chiều cao', 'height')}</label>
        {renderUnitControl('height', 'auto', 'px', undefined, SPACING_UNITS)}
      </div>

      {(name === 'Hình ảnh' || name === 'Video') && (
        <div className="grid grid-cols-2 gap-1">
          {['auto', '200px'].map((value) => (
            <button
              key={value}
              onClick={() => updateProp('height', value)}
              className={`rounded border px-1.5 py-1 text-[9px] font-bold transition-colors ${props.height === value ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              Height {value}
            </button>
          ))}
        </div>
      )}
      </>
    ), true)}

    {renderAccordionSection('advanced_animation', 'Hiệu ứng động', (
      <div className="space-y-4">
        {/* Entrance Animation */}
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-600 font-semibold mb-1">Hiệu ứng động xuất hiện &nbsp; <svg className="inline w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 20v-4"/></svg></label>
          <select
            value={props.animationName || 'none'}
            onChange={(e) => updateProp('animationName', e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none"
          >
            <option value="none">Mặc định</option>
            <optgroup label="Fade">
              <option value="fadeIn">Fade In</option>
              <option value="fadeInUp">Fade Up</option>
              <option value="fadeInDown">Fade Down</option>
              <option value="fadeInLeft">Fade Left</option>
              <option value="fadeInRight">Fade Right</option>
            </optgroup>
            <optgroup label="Slide">
              <option value="slideInUp">Slide Up</option>
              <option value="slideInDown">Slide Down</option>
              <option value="slideInLeft">Slide Left</option>
              <option value="slideInRight">Slide Right</option>
            </optgroup>
            <optgroup label="Zoom">
              <option value="zoomIn">Zoom In</option>
              <option value="zoomOut">Zoom Out</option>
            </optgroup>
            <optgroup label="Scale">
              <option value="craftScaleUp">Scale Up</option>
              <option value="scaleDown">Scale Down</option>
            </optgroup>
            <optgroup label="Rotate">
              <option value="rotateIn">Rotate In</option>
              <option value="rotateOut">Rotate Out</option>
            </optgroup>
            <optgroup label="Bounce">
              <option value="bounceIn">Bounce In</option>
            </optgroup>
          </select>
        </div>
        {props.animationName && props.animationName !== 'none' && (
          <div className="pl-2 border-l-2 border-slate-100 space-y-3 mt-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold">Thời lượng hiệu ứng động</label>
              <select
                value={props.animationDuration || 'normal'}
                onChange={(e) => updateProp('animationDuration', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white text-slate-700 focus:border-brand-500 outline-none"
              >
                <option value="slow">Chậm</option>
                <option value="normal">Bình thường</option>
                <option value="fast">Nhanh</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold">Độ trễ hiệu ứng động (ms)</label>
              <input
                type="text"
                value={props.animationDelay || ''}
                onChange={(e) => updateProp('animationDelay', e.target.value)}
                className="w-full h-7 px-2 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-brand-500"
                placeholder="VD: 500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold">Trigger</label>
              <select
                value={props.animationTrigger || 'onLoad'}
                onChange={(e) => updateProp('animationTrigger', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white text-slate-700 focus:border-brand-500 outline-none"
              >
                <option value="onLoad">On Load</option>
                <option value="onScroll">On Scroll</option>
                <option value="onViewport">On Viewport</option>
                <option value="onHover">On Hover</option>
              </select>
            </div>
          </div>
        )}
      </div>
    ), false)}

    {renderAccordionSection('advanced_position', 'Vị trí & Sắp xếp', (
      <div className="space-y-3">
        <div className="space-y-1.5">
        <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Sắp xếp thứ tự', 'orderMode')}</label>
        {renderSegmentedControl(
          props.orderMode,
          'default',
          [
            { value: 'default', label: <span className="text-[9px] uppercase tracking-wider font-bold">Mặc định</span> },
            {
              value: 'first',
              label: (
                <span title="Đầu tiên" className="flex items-center justify-center h-full">
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7M5 3h14" />
                  </svg>
                </span>
              )
            },
            {
              value: 'last',
              label: (
                <span title="Cuối cùng" className="flex items-center justify-center h-full">
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-7-7m7 7l7-7M5 21h14" />
                  </svg>
                </span>
              )
            },
            {
              value: 'custom',
              label: (
                <span title="Tùy chỉnh" className="flex items-center justify-center h-full">
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                  </svg>
                </span>
              )
            },
          ],
          (val: string) => updateProp('orderMode', val)
        )}
      </div>

      {props.orderMode === 'custom' && (
        <div className="space-y-1.5 animate-fade-in">
          <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Thứ tự tùy chỉnh', 'customOrder')}</label>
          <input
            type="number"
            value={props.customOrder || ''}
            onChange={(e) => updateProp('customOrder', e.target.value)}
            className="w-full h-7 px-2 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-brand-500"
            placeholder="Ví dụ: 2"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Vị trí', 'position')}</label>
        <select
          value={props.position || 'default'}
          onChange={(e) => updateProp('position', e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white font-semibold text-slate-700 focus:border-brand-500 outline-none"
        >
          <option value="default">Mặc định</option>
          <option value="absolute">Tuyệt đối (Absolute)</option>
          <option value="fixed">Cố định (Fixed)</option>
        </select>
        {props.position === 'absolute' && (
          <p className="text-[9px] leading-snug text-slate-400 italic">Định vị theo vùng chứa cha gần nhất. Có thể kéo trực tiếp trên canvas.</p>
        )}
        {props.position === 'fixed' && (
          <p className="text-[9px] leading-snug text-slate-400 italic">Cố định theo màn hình. Có thể kéo trực tiếp trên canvas.</p>
        )}
      </div>

      {(props.position === 'absolute' || props.position === 'fixed') && (
        <div className="space-y-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 animate-fade-in">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-600 font-bold">Định vị ngang</label>
              <select
                value={props.horizontalAlign || 'left'}
                onChange={(e) => {
                  const newAlign = e.target.value;
                  updateProp('horizontalAlign', newAlign);
                  if (newAlign === 'left') updateProp('right', '');
                  else updateProp('left', '');
                }}
                className="text-[9px] border border-slate-200 rounded px-1 py-0.5 bg-white font-semibold text-slate-600 outline-none"
              >
                <option value="left">Trái (Left)</option>
                <option value="right">Phải (Right)</option>
              </select>
            </div>
            {props.horizontalAlign === 'right' ? (
              renderUnitControl('right', '0', 'px', undefined, SPACING_UNITS)
            ) : (
              renderUnitControl('left', '0', 'px', undefined, SPACING_UNITS)
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-600 font-bold">Định vị dọc</label>
              <select
                value={props.verticalAlign || 'top'}
                onChange={(e) => {
                  const newAlign = e.target.value;
                  updateProp('verticalAlign', newAlign);
                  if (newAlign === 'top') updateProp('bottom', '');
                  else updateProp('top', '');
                }}
                className="text-[9px] border border-slate-200 rounded px-1 py-0.5 bg-white font-semibold text-slate-600 outline-none"
              >
                <option value="top">Trên (Top)</option>
                <option value="bottom">Dưới (Bottom)</option>
              </select>
            </div>
            {props.verticalAlign === 'bottom' ? (
              renderUnitControl('bottom', '0', 'px', undefined, SPACING_UNITS)
            ) : (
              renderUnitControl('top', '0', 'px', undefined, SPACING_UNITS)
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Z-Index', 'zIndex')}</label>
        {(() => {
          const stepZIndex = (direction: 1 | -1) => {
            const base = parseInt(props.zIndex || '0', 10) || 0;
            updateProp('zIndex', String(base + direction));
          };
          const upId = 'zIndex-up';
          const downId = 'zIndex-down';
          return (
            <div className="elementor-number-stepper w-24">
              {registerStepper(upId, () => stepZIndex(1))}
              {registerStepper(downId, () => stepZIndex(-1))}
              <input
                type="number"
                value={props.zIndex || ''}
                onChange={(e) => updateProp('zIndex', e.target.value)}
                className="elementor-number-input h-7 w-full rounded border border-slate-200 text-center text-[10px] font-mono outline-none focus:border-brand-500"
                placeholder="Auto"
              />
              <div className="elementor-stepper-buttons">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); startStepping(upId, () => stepZIndex(1)); }}
                  onMouseUp={stopStepping}
                  onMouseLeave={stopStepping}
                  aria-label="Tăng Z-Index"
                  className="group"
                >
                  <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); startStepping(downId, () => stepZIndex(-1)); }}
                  onMouseUp={stopStepping}
                  onMouseLeave={stopStepping}
                  aria-label="Giảm Z-Index"
                  className="group"
                >
                  <svg className="w-1.5 h-1.5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
      </div>
    ), false)}

    {renderAccordionSection('advanced_background', 'Nền', (
      <div className="space-y-4">
        <div className="flex p-0.5 bg-slate-100/80 border border-slate-200 rounded-md">
          <button onClick={() => setActiveBgTab('normal')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${activeBgTab === 'normal' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}>Bình thường</button>
          <button onClick={() => setActiveBgTab('hover')} className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${activeBgTab === 'hover' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 border border-transparent'}`}>Di chuột</button>
        </div>

        {(() => {
          const s = activeBgTab === 'hover' ? 'Hover' : '';
          const bgTypeProp = `advancedBgType${s}`;
          const bgColorProp = `advancedBgColor${s}`;
          const bgImageProp = `advancedBgImage${s}`;
          const bgGradientProp = `advancedBgGradient${s}`;
          const currentBgType = props[bgTypeProp] || 'classic';

          return (
            <>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-slate-500">{renderResponsiveLabel('Loại nền', bgTypeProp)}</span>
                <div className="flex gap-1">
                  <button onClick={() => updateProp(bgTypeProp, 'classic')} className={`w-8 h-7 flex items-center justify-center border rounded ${currentBgType === 'classic' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Cơ bản (Màu / Hình ảnh)">
                    <Lucide.PaintRoller size={13} className={currentBgType === 'classic' ? 'text-slate-700' : 'text-slate-400'} />
                  </button>
                  <button onClick={() => updateProp(bgTypeProp, 'gradient')} className={`w-8 h-7 flex items-center justify-center border rounded ${currentBgType === 'gradient' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Gradient">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect width="14" height="14" rx="2" fill="url(#paint0_linear)" />
                      <defs>
                        <linearGradient id="paint0_linear" x1="0" y1="0" x2="14" y2="14" gradientUnits="userSpaceOnUse">
                          <stop stopColor={currentBgType === 'gradient' ? '#94a3b8' : '#e2e8f0'}/>
                          <stop offset="1" stopColor={currentBgType === 'gradient' ? '#cbd5e1' : '#f1f5f9'}/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </button>
                </div>
              </div>

              {currentBgType === 'classic' ? (
                <div className="space-y-3 mt-2">
                  {renderStyleRow(renderResponsiveLabel('Màu sắc', bgColorProp), renderColorControl(bgColorProp, '#ffffff', activeBgTab === 'hover' ? (props.advancedBgColor || 'transparent') : 'transparent'))}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Hình nền (URL)', bgImageProp)}</label>
                    <input type="text" value={props[bgImageProp] || ''} onChange={(e) => updateProp(bgImageProp, e.target.value)} className="w-full h-7 px-2 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-brand-500" placeholder="https://..." />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  <div className="p-2 border-l-2 border-yellow-400 bg-yellow-50 text-yellow-700 text-[10px] italic">
                    Đặt vị trí và góc cho mỗi điểm ngắt để đảm bảo chuyển màu thích nghi với các kích thước màn hình khác nhau.
                  </div>

                  {/* Color 1 */}
                  {renderStyleRow(renderResponsiveLabel('Màu sắc', `bgGradientColor1${s}`), renderColorControl(`bgGradientColor1${s}`, '#000000', activeBgTab === 'hover' ? (props.bgGradientColor1 || 'transparent') : '#000000'))}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                      <span className="text-[9px] text-slate-400">%</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="range" min="0" max="100" value={props[`bgGradientPos1${s}`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1${s}`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      <input type="number" min="0" max="100" value={props[`bgGradientPos1${s}`] ?? 0} onChange={(e) => updateProp(`bgGradientPos1${s}`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                    </div>
                  </div>

                  {/* Color 2 */}
                  {renderStyleRow(renderResponsiveLabel('Màu thứ hai', `bgGradientColor2${s}`), renderColorControl(`bgGradientColor2${s}`, '#ffffff', activeBgTab === 'hover' ? (props.bgGradientColor2 || 'transparent') : '#ffffff'))}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-600 font-bold">Vị trí</label>
                      <span className="text-[9px] text-slate-400">%</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="range" min="0" max="100" value={props[`bgGradientPos2${s}`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2${s}`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      <input type="number" min="0" max="100" value={props[`bgGradientPos2${s}`] ?? 100} onChange={(e) => updateProp(`bgGradientPos2${s}`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                    </div>
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-600 font-bold">{renderResponsiveLabel('Kiểu', `bgGradientType${s}`)}</label>
                    <select
                      value={props[`bgGradientType${s}`] || 'linear'}
                      onChange={(e) => updateProp(`bgGradientType${s}`, e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-white text-slate-700 outline-none focus:border-slate-500"
                    >
                      <option value="linear">Linear</option>
                      <option value="radial">Radial</option>
                    </select>
                  </div>

                  {/* Angle (only for linear) */}
                  {(!props[`bgGradientType${s}`] || props[`bgGradientType${s}`] === 'linear') && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-600 font-bold">Góc</label>
                        <span className="text-[9px] text-slate-400">deg</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="range" min="0" max="360" value={props[`bgGradientAngle${s}`] ?? 180} onChange={(e) => updateProp(`bgGradientAngle${s}`, Number(e.target.value))} className="flex-1 accent-slate-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        <input type="number" min="0" max="360" value={props[`bgGradientAngle${s}`] ?? 180} onChange={(e) => updateProp(`bgGradientAngle${s}`, Number(e.target.value))} className="w-12 h-6 px-1 border border-slate-200 rounded text-[10px] text-center outline-none focus:border-slate-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>
    ), false)}

    {(name !== 'Khoảng trống' && name !== 'Đường phân cách' && name !== 'Sập mở (FAQ)') && renderAccordionSection('advanced_border', 'Đường viền & Góc bo', (
      <div className="space-y-2.5">
        {borderAndRadiusOptions}
      </div>
    ), false)}

    {renderAccordionSection('advanced_developer', 'Nhà phát triển', (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-600 font-bold">Element ID</label>
          <input
            type="text"
            value={props.idCss || ''}
            onChange={(e) => updateProp('idCss', e.target.value)}
            className={`w-full h-7 px-2 border rounded text-[10px] font-mono outline-none focus:border-brand-500 ${elementIdValidation.valid ? 'border-slate-200' : 'border-rose-300 bg-rose-50'}`}
            placeholder="my-custom-id"
          />
          {!elementIdValidation.valid && (
            <p className="text-[10px] leading-4 text-rose-600">{elementIdValidation.error}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-600 font-bold">CSS Classes</label>
          <input
            type="text"
            value={props.classCss || ''}
            onChange={(e) => updateProp('classCss', e.target.value)}
            className={`w-full h-7 px-2 border rounded text-[10px] font-mono outline-none focus:border-brand-500 ${cssClassesValidation.valid ? 'border-slate-200' : 'border-rose-300 bg-rose-50'}`}
            placeholder="my-custom-class another-class"
          />
          {!cssClassesValidation.valid && (
            <p className="text-[10px] leading-4 text-rose-600">{cssClassesValidation.error}</p>
          )}
          <p className="text-[9px] leading-3 text-slate-400">Tách nhiều class bằng dấu cách. Prefix <code>lexi-</code> được giữ riêng cho builder.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-[10px] text-slate-600 font-bold">Custom CSS</label>
            <span className="text-[9px] text-slate-400">{String(props.customCss || '').length} ký tự</span>
          </div>
          <textarea
            value={props.customCss || ''}
            onChange={(e) => updateProp('customCss', e.target.value)}
            className={`w-full min-h-[140px] px-2 py-2 border rounded text-[10px] leading-4 font-mono outline-none focus:border-brand-500 resize-y ${customCssGuard.safe ? 'border-slate-200 bg-slate-950 text-slate-100' : 'border-rose-300 bg-rose-950 text-rose-50'}`}
            placeholder={`selector {\n  background: #f8fafc;\n}\n\nselector h2 {\n  color: red;\n}`}
            spellCheck={false}
          />
          <p className="text-[9px] leading-3 text-slate-400">Dùng <code>selector</code> để trỏ tới widget hiện tại, giống Elementor.</p>
          {!customCssGuard.safe && customCssGuard.warnings.map((warning) => (
            <p key={warning} className="text-[10px] leading-4 text-rose-600">{warning}</p>
          ))}
        </div>
      </div>
    ), false)}
  </div>
  );
}
