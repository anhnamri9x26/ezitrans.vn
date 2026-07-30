import React, { useState } from 'react';
import { Plus, X, ArrowDown, ArrowRight } from 'lucide-react';
import { useEditor, Element } from '@craftjs/core';

interface AddSectionAreaProps {
  isBottom?: boolean;
  index?: number;
}

export const AddSectionArea: React.FC<AddSectionAreaProps> = ({ isBottom, index }) => {
  const [step, setStep] = useState<0 | 1 | 'flex' | 'grid'>(0);
  const { actions, query } = useEditor();

  const options = query.getOptions();
  const Container = options.resolver['Container'] as any;
  const GridContainer = options.resolver['GridContainer'] as any;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep(0);
    // Dispath event to close the add section area if it's inline
    if (!isBottom) {
      window.dispatchEvent(new CustomEvent('craft-show-add-section', { detail: null }));
    }
  };

  const handleAddStructure = (element: React.ReactElement) => {
    const nodeTree = query.parseReactElement(element).toNodeTree();
    
    // If index is provided, insert at that index. Otherwise, insert at the end of ROOT.
    if (index !== undefined) {
      actions.addNodeTree(nodeTree, 'ROOT', index);
    } else {
      actions.addNodeTree(nodeTree, 'ROOT');
    }
    
    // Reset state
    setStep(0);
    if (!isBottom) {
      window.dispatchEvent(new CustomEvent('craft-show-add-section', { detail: null }));
    }
  };

  const renderStep0 = () => (
    <div 
      className="w-full max-w-4xl min-h-[120px] flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 rounded-lg transition-all group"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStep(1);
        }}
        className="h-10 w-10 flex items-center justify-center bg-indigo-100 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-full transition-colors shadow-sm"
        title="Thêm cấu trúc"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="w-full max-w-4xl min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-lg relative py-8">
      <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
        <X size={18} />
      </button>
      <h3 className="text-sm font-medium text-slate-600 mb-6">Bố cục nào bạn muốn sử dụng?</h3>
      <div className="flex gap-8">
        <button 
          onClick={(e) => { e.stopPropagation(); setStep('flex'); }}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 bg-slate-200 group-hover:bg-indigo-100 flex p-1 gap-0.5 rounded transition-colors">
            <div className="w-1/2 h-full bg-slate-300 group-hover:bg-indigo-300 rounded-sm"></div>
            <div className="w-1/2 h-full flex flex-col gap-0.5">
               <div className="w-full h-1/2 bg-slate-300 group-hover:bg-indigo-300 rounded-sm"></div>
               <div className="w-full h-1/2 bg-slate-300 group-hover:bg-indigo-300 rounded-sm"></div>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Flexbox</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setStep('grid'); }}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 border-2 border-dashed border-slate-300 group-hover:border-fuchsia-400 flex flex-wrap p-1 gap-1 rounded transition-colors">
            <div className="w-[calc(50%-2px)] h-[calc(50%-2px)] border border-dashed border-slate-300 group-hover:border-fuchsia-400 rounded-sm"></div>
            <div className="w-[calc(50%-2px)] h-[calc(50%-2px)] border border-dashed border-slate-300 group-hover:border-fuchsia-400 rounded-sm"></div>
            <div className="w-[calc(50%-2px)] h-[calc(50%-2px)] border border-dashed border-slate-300 group-hover:border-fuchsia-400 rounded-sm"></div>
            <div className="w-[calc(50%-2px)] h-[calc(50%-2px)] border border-dashed border-slate-300 group-hover:border-fuchsia-400 rounded-sm"></div>
          </div>
          <span className="text-xs font-medium text-slate-500 group-hover:text-fuchsia-600">Lưới</span>
        </button>
      </div>
    </div>
  );

  const renderStepFlex = () => {
    const LayoutIcon = ({ cols, heights = [] }: { cols: number[], heights?: string[] }) => (
      <div className="w-14 h-10 flex gap-0.5 bg-slate-100 p-0.5 hover:bg-indigo-100 cursor-pointer transition-colors rounded-sm border border-slate-200 hover:border-indigo-300">
        {cols.map((width, i) => (
          <div key={i} className="bg-slate-300 h-full rounded-[1px]" style={{ width: `${width}%` }}></div>
        ))}
      </div>
    );

    return (
      <div className="w-full max-w-4xl min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-lg relative py-8 px-12">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setStep(1); }} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700">
          <ArrowRight size={18} className="transform rotate-180" />
        </button>
        <h3 className="text-sm font-medium text-slate-600 mb-6">Chọn cấu trúc của bạn</h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="column" canvas />
          )}>
            <div className="w-14 h-10 bg-slate-100 hover:bg-indigo-100 p-0.5 cursor-pointer rounded-sm border border-slate-200 hover:border-indigo-300">
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white/50 rounded-[1px]"><ArrowDown size={14} /></div>
            </div>
          </div>
          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" canvas />
          )}>
            <div className="w-14 h-10 bg-slate-100 hover:bg-indigo-100 p-0.5 cursor-pointer rounded-sm border border-slate-200 hover:border-indigo-300">
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white/50 rounded-[1px]"><ArrowRight size={14} /></div>
            </div>
          </div>
          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" gap="16px" canvas>
               <Element is={Container} width="50%" canvas />
               <Element is={Container} width="50%" canvas />
            </Element>
          )}><LayoutIcon cols={[50, 50]} /></div>
          
          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" gap="16px" canvas>
               <Element is={Container} width="33.33%" canvas />
               <Element is={Container} width="33.33%" canvas />
               <Element is={Container} width="33.33%" canvas />
            </Element>
          )}><LayoutIcon cols={[33.33, 33.33, 33.33]} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" gap="16px" canvas>
               <Element is={Container} width="25%" canvas />
               <Element is={Container} width="25%" canvas />
               <Element is={Container} width="25%" canvas />
               <Element is={Container} width="25%" canvas />
            </Element>
          )}><LayoutIcon cols={[25, 25, 25, 25]} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" gap="16px" canvas>
               <Element is={Container} width="33.33%" canvas />
               <Element is={Container} width="66.66%" canvas />
            </Element>
          )}><LayoutIcon cols={[33.33, 66.66]} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={Container} flexDirection="row" gap="16px" canvas>
               <Element is={Container} width="66.66%" canvas />
               <Element is={Container} width="33.33%" canvas />
            </Element>
          )}><LayoutIcon cols={[66.66, 33.33]} /></div>
        </div>
      </div>
    );
  };

  const renderStepGrid = () => {
    const GridIcon = ({ cols, rows }: { cols: number, rows: number }) => (
      <div 
        className="w-14 h-10 grid gap-[1px] bg-slate-100 p-0.5 hover:bg-fuchsia-100 cursor-pointer transition-colors rounded-sm border border-slate-200 hover:border-fuchsia-300"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div key={i} className="bg-slate-300 w-full h-full rounded-[1px] border border-dashed border-slate-400/30"></div>
        ))}
      </div>
    );

    return (
      <div className="w-full max-w-4xl min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-lg relative py-8 px-12">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X size={18} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setStep(1); }} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700">
          <ArrowRight size={18} className="transform rotate-180" />
        </button>
        <h3 className="text-sm font-medium text-slate-600 mb-6">Chọn cấu trúc của bạn</h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={2} gridRows={1} canvas />
          )}><GridIcon cols={2} rows={1} /></div>
          
          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={3} gridRows={1} canvas />
          )}><GridIcon cols={3} rows={1} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={4} gridRows={1} canvas />
          )}><GridIcon cols={4} rows={1} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={2} gridRows={2} canvas />
          )}><GridIcon cols={2} rows={2} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={3} gridRows={2} canvas />
          )}><GridIcon cols={3} rows={2} /></div>

          <div onClick={() => handleAddStructure(
            <Element is={GridContainer} gridColumns={4} gridRows={2} canvas />
          )}><GridIcon cols={4} rows={2} /></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full p-4 flex justify-center items-center ${isBottom ? 'mt-4' : 'my-4'}`}>
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 'flex' && renderStepFlex()}
      {step === 'grid' && renderStepGrid()}
    </div>
  );
};
